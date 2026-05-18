import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Helper for retries and fallbacks
async function safeAiCall(task: () => Promise<any>, fallback: any) {
  let attempts = 0;
  const maxAttempts = 3;
  let lastError: any = null;

  while (attempts < maxAttempts) {
    try {
      return await task();
    } catch (error: any) {
      attempts++;
      lastError = error;
      const errorStr = String(error?.stack || error?.message || error);
      const isQuota = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota');
      
      if (isQuota && attempts < maxAttempts) {
        const delay = Math.pow(2, attempts) * 1000;
        console.warn(`AI Quota hit, retrying in ${delay}ms... (Attempt ${attempts})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      console.error("AI execution error:", errorStr);
      if (attempts >= maxAttempts) break;
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // If we reach here, we failed all attempts
  const errorMsg = String(lastError?.message || lastError);
  if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
    return { 
      error: "QUOTA_EXHAUSTED", 
      message: "AI quota exceeded. Please add your OpenAI API Key in Settings > Secrets to continue.",
      details: errorMsg
    };
  }

  return { error: "AI_FAILED", message: "AI processing failed.", fallback };
}

function parseAIResponse(text: string | undefined, fallback: any) {
  if (!text) return fallback;
  try {
    // Try to find JSON block
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const jsonString = match ? match[0] : text;
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON Parse Error on text:", text);
    return fallback;
  }
}

// AI API Routes
app.post("/api/ai/analyze-sentiment", async (req, res) => {
  const { text } = req.body;
  
  if (openai) {
    const result = await safeAiCall(async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Analyze the sentiment of the following customer interaction and return ONLY one word: Positive, Neutral, or Negative.\n\nText: "${text}"` }],
        temperature: 0,
      });
      return { sentiment: (completion.choices[0].message.content || 'Neutral').trim() };
    }, { sentiment: 'Neutral' });
    return res.json(result);
  }

  const result = await safeAiCall(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the sentiment of the following customer interaction and return ONLY one word: Positive, Neutral, or Negative.\n\nText: "${text}"`,
    });
    return { sentiment: (response.text || 'Neutral').trim() };
  }, { sentiment: 'Neutral' });
  
  res.json(result);
});

app.post("/api/ai/voice-to-crm", async (req, res) => {
  const { transcript, businessType, context, language } = req.body;

  const systemPrompt = `Analyze this voice transcript for a "${businessType || 'General'}" business: "${transcript}".
          
          REFERENCE DATA (Your Customers): ${JSON.stringify(context?.customers || [])}

          GOAL: Identify the intent and map it to a CRM action. 

          STRICT MATCHING RULE:
          - If a name is mentioned (e.g., "Rahul", "Priya"), search the REFERENCE DATA. 
          - If a match is found, return that customer's exact 'name' and 'phone' from the data.
          - If multiple matches or no match, extract the name from the transcript as is.

          JSON SCHEMA:
          {
            "action": "add_customer" | "set_reminder" | "add_lead" | "add_note",
            "name": "Full Name",
            "phone": "Phone Number",
            "note": "Clean summary of what they said",
            "date": "ISO/Relative date",
            "whatsappMessage": "Friendly, professional message ready to send",
            "autoWhatsApp": boolean (true if transcript implies notifying or reminding the person, e.g., 'Tell Rahul...', 'Remind Rahul...', 'Message Rahul...')
          }

          INSTRUCTIONS: 
          - If a name matches reference data, ALWAYS use the phone from that data. 
          - If the user says 'Remind Rahul...', set autoWhatsApp to true.
          - CRITICAL: Provide the 'note' and 'whatsappMessage' in the following language: ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}.`;

  if (openai) {
    const result = await safeAiCall(async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: systemPrompt }],
        response_format: { type: "json_object" },
        temperature: 0, // Maximum deterministic speed and precision
      });
      return parseAIResponse(completion.choices[0].message.content || "", { action: 'add_note', note: transcript });
    }, { action: 'add_note', note: transcript });
    return res.json(result);
  }

  const result = await safeAiCall(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: systemPrompt,
      config: { responseMimeType: "application/json" }
    });
    
    return parseAIResponse(response.text, { action: 'add_note', note: transcript });
  }, { action: 'add_note', note: transcript });
  
  res.json(result);
});

app.post("/api/ai/generate-insights", async (req, res) => {
  const { businessData, businessType } = req.body;

  if (openai) {
    const result = await safeAiCall(async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ 
          role: "user", 
          content: `You are an AI Business Consultant for a "${businessType || 'Small Business'}". 
          Based on this data: ${JSON.stringify(businessData)}, provide 3 short actionable growth predictions or operational alerts. 
          Tailor them strictly to use cases for a ${businessType}.
          Each insight should be max 15 words. Return ONLY the insights separated by newlines.` 
        }],
        temperature: 0.7,
      });
      return { insights: (completion.choices[0].message.content || "").split('\n').filter(l => l.trim().length > 0) };
    }, { 
      insights: [
        "Target high-value customers for special offers",
        "Optimize staff schedules for peak hours",
        "Monitor recent sentiment trends closely"
      ] 
    });
    return res.json(result);
  }

  const result = await safeAiCall(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI Business Consultant for a "${businessType || 'Small Business'}". 
      Based on this data: ${JSON.stringify(businessData)}, provide 3 short actionable growth predictions or operational alerts. 
      Tailor them strictly to use cases for a ${businessType} (e.g., if Salon: talk about appointments/peak hours; if Medical: talk about stock/prescriptions; if CA: talk about deadlines).
      
      Each insight should be max 15 words. Return ONLY the insights separated by newlines.`,
    });
    return { insights: response.text?.split('\n').filter(l => l.trim().length > 0) };
  }, { 
    insights: [
      "Target high-value customers for special offers",
      "Optimize staff schedules for peak hours",
      "Monitor recent sentiment trends closely"
    ] 
  });
  
  res.json(result);
});

app.post("/api/ai/predict-campaign", async (req, res) => {
  const { campaignName, businessType, audienceStats } = req.body;
  
  const prompt = `Predict marketing campaign results for a "${businessType}" running a campaign named "${campaignName}". 
      Audience detail: ${JSON.stringify(audienceStats)}.
      Return JSON with:
      - estReach: string (e.g. "500+ People")
      - expectedCVR: string (e.g. "3.5% CVR")
      - logic: string (1 sentence explaining why)`;

  if (openai) {
    const result = await safeAiCall(async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      return parseAIResponse(completion.choices[0].message.content || "", null);
    }, null);
    if (result) return res.json(result);
  }

  const result = await safeAiCall(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseAIResponse(response.text, { 
      estReach: "150+ People", 
      expectedCVR: "1.8% CVR",
      logic: "Based on local market averages."
    });
  }, { 
    estReach: "150+ People", 
    expectedCVR: "1.8% CVR",
    logic: "Based on local market averages."
  });
  
  res.json(result);
});

app.post("/api/ai/bizmind/intel", async (req, res) => {
  const { businessData, businessType, userName } = req.body;

  const prompt = `You are "BizMind AI", a virtual business manager for ${userName}'s ${businessType || 'Business'}.
      Based on this data: ${JSON.stringify(businessData)}, generate a comprehensive "Virtual Manager Intel" response.
      
      Return a JSON object with:
      - todaySummary: { expectedCustomers: string, pendingFollowups: number, appointments: number, revenueYesterday: string }
      - revenuePrediction: { daily: string, weekly: string, monthly: string, growthPercent: string, trend: 'up' | 'down' | 'stable' }
      - stockPrediction: Array<{ item: string, status: string, risk: string, suggestion: string }>
      - customerIntel: { repeatRate: string, vipCount: number, dropRiskCount: number, highlightedAction: string }
      - proactiveAlerts: Array<{ title: string, message: string, type: 'critical' | 'warning' | 'info' }>
      - growthCoach: Array<{ tip: string, reason: string }>
      
      BE SPECIFIC to ${businessType}. If Salon, use hair styling terms. If Pharmacy, use medicine terms. If Restaurant, use menu terms.
      Example item for Pharmacy: { "item": "Paracetamol", "status": "Low", "risk": "Finish in 4 days", "suggestion": "Order 10 units now" }`;

  const fallback = { 
    todaySummary: { expectedCustomers: "10-15", pendingFollowups: 5, appointments: 3, revenueYesterday: "$1,200" },
    revenuePrediction: { daily: "$1,100", weekly: "$7,500", monthly: "$32,000", growthPercent: "+12%", trend: 'up' },
    stockPrediction: [{ item: "Main Stock", status: "Healthy", risk: "Low", suggestion: "Monitor weekly" }],
    customerIntel: { repeatRate: "65%", vipCount: 12, dropRiskCount: 3, highlightedAction: "Invite Rahul for a loyalty visit" },
    proactiveAlerts: [{ title: "Morning Brief", message: "Expect a busy afternoon between 2 PM and 5 PM.", type: 'info' }],
    growthCoach: [{ tip: "Increase weekend staff", reason: "AI predicts 20% higher footfall this Saturday." }]
  };

  if (openai) {
    const result = await safeAiCall(async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      return parseAIResponse(completion.choices[0].message.content || "", null);
    }, null);
    if (result) return res.json(result);
  }

  const result = await safeAiCall(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    return parseAIResponse(response.text, fallback);
  }, fallback);
  
  res.json(result);
});

app.post("/api/ai/bizmind/chat", async (req, res) => {
  const { message, history, context, businessType, language } = req.body;
  
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "No AI API key configured. Please add Gemini or OpenAI key in Settings > Secrets." });
  }

  const systemPrompt = `You are "BizMind AI", the intelligent virtual business manager for a ${businessType || 'local business'}. 
        
        GOAL: Provide "perfect" answers based ONLY on the provided Context.
        
        CRITICAL CONTEXT (Business Database Snapshot):
        ${JSON.stringify(context || {})}
        
        RESPONSE GUIDELINES:
        1. If asked for predictions (Daily, Weekly, Monthly), calculate them based on actual data provided in the context.
        2. BE SPECIFIC. Mention names of customers or specific numbers from the lists.
        3. STRUCTURED OUTPUT: If the user asks for a report, prediction, or summary, you MUST return a valid JSON object with:
           {
             "text": "Your natural language response here...",
             "data": { 
                "daily": "₹X", 
                "weekly": "₹Y", 
                "monthly": "₹Z", 
                "growthPercent": "+N%",
                "breakdown": "Optional detailed notes"
             }
           }
        4. If you return JSON, ensure it is the ONLY thing you return or the very last block.
        5. Tone: Professional, authoritative, and data-driven.
        6. RESPONSE LANGUAGE: You MUST respond in the following language: ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}. If the language is Telugu or Hindi, ensure the tone remains professional and business-appropriate.`;

  // Try OpenAI if configured
  if (openai) {
    const result = await safeAiCall(async () => {
      const messages = [
        { role: "system", content: systemPrompt },
        ...(history || []).map((msg: any) => ({
          role: msg.sender === 'ai' ? 'assistant' : 'user',
          content: msg.text
        })),
        { role: "user", content: message }
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages as any,
        temperature: 0.2,
      });

      const text = completion.choices[0].message.content || "";
      if (text.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(text);
          return { response: parsed.text || "Report generated.", data: parsed.data || parsed };
        } catch (e) {
          return { response: text };
        }
      }
      return { response: text };
    }, null);

    if (result) return res.json(result);
  }

  // Fallback or primary to Gemini
  const result = await safeAiCall(async () => {
    // Filter history to ensure it's valid for Gemini (alternating user/model, starting with user)
    let chatHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory = chatHistory.slice(1);
    }
    
    const filteredHistory: any[] = [];
    chatHistory.forEach((msg: any) => {
      if (filteredHistory.length > 0 && filteredHistory[filteredHistory.length - 1].role === msg.role) {
        filteredHistory[filteredHistory.length - 1].parts[0].text += "\n" + msg.parts[0].text;
      } else {
        filteredHistory.push(msg);
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...filteredHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
      }
    });
    
    const text = response.text || "";
    if (text.trim().startsWith('{')) {
       try {
         const parsed = JSON.parse(text);
         return { response: parsed.text || "Here is the data you requested", data: parsed.data || parsed };
       } catch (e) {
         return { response: text };
       }
    }
    
    return { response: text || "I've analyzed your request. Based on our current trends, I suggest focusing on lead conversion this week." };
  }, { response: "I'm having a bit of trouble connecting to my growth engine via Gemini. How can I help?" });
  
  res.json(result);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
