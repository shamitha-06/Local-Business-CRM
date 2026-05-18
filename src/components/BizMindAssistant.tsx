import React from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Mic, 
  ChevronRight, 
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { useSettings } from '../context/SettingsContext';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
  type?: 'text' | 'prediction' | 'summary' | 'alert';
  data?: any;
}

const BizMindAssistant: React.FC = () => {
  const { language, t, themeColor } = useSettings();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      text: t('ai_assistant') + ": Hello! I'm BizMind AI, your virtual manager.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [businessType, setBusinessType] = React.useState('General');
  const [intel, setIntel] = React.useState<any>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-bizmind', handleOpen);
    return () => window.removeEventListener('open-bizmind', handleOpen);
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const gatherContext = async () => {
    if (!auth.currentUser) return null;
    
    try {
      const bizPath = `businesses/${auth.currentUser.uid}`;
      const bizRef = doc(db, bizPath);
      const bizSnap = await getDoc(bizRef);
      const bType = bizSnap.exists() ? bizSnap.data().category : 'General';

      const custPath = `businesses/${auth.currentUser.uid}/customers`;
      const leadPath = `businesses/${auth.currentUser.uid}/leads`;
      const remPath = `businesses/${auth.currentUser.uid}/reminders`;
      
      const [cSnap, lSnap, rSnap] = await Promise.all([
        getDocs(query(collection(db, custPath), limit(50))),
        getDocs(query(collection(db, leadPath), limit(50))),
        getDocs(query(collection(db, remPath), limit(20)))
      ]);

      const customers = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const leads = lSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const reminders = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      return {
        businessType: bType,
        customerCount: cSnap.size,
        leadCount: lSnap.size,
        reminderCount: rSnap.size,
        customers,
        leads,
        reminders,
        recentActivity: 'high'
      };
    } catch (err) {
      console.error("Gather context error:", err);
      return null;
    }
  };

  React.useEffect(() => {
    const initAssistant = async () => {
      const context = await gatherContext();
      if (!context) return;

      setBusinessType(context.businessType);

      try {
        const res = await fetch('/api/ai/bizmind/intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessType: context.businessType,
            userName: auth.currentUser?.displayName || 'Owner',
            businessData: context
          })
        });
        const data = await res.json();
        setIntel(data);
        
        if (data.todaySummary) {
          setMessages(prev => [...prev, {
            id: `summary-${Date.now()}`,
            text: `Today's Briefing for your ${context.businessType}: Expected ${data.todaySummary.expectedCustomers} customers today.`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'summary',
            data: data.todaySummary
          }]);
        }
      } catch (err) {
        console.error("BizMind Intel error:", err);
      }
    };

    initAssistant();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const history = messages.slice(-10);
      const freshContext = await gatherContext();
      
      const res = await fetch('/api/ai/bizmind/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          history,
          businessType,
          language, // Pass current language to AI
          context: {
            intel,
            database: freshContext
          }
        })
      });
      const data = await res.json();
      
      if (data.error) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: data.message || "I'm having a bit of trouble with my AI brain right now. Please try again or check your API keys.",
          sender: 'ai',
          timestamp: new Date()
        }]);
        return;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date(),
        type: data.data?.daily || data.data?.revenuePrediction ? 'prediction' : 'text',
        data: data.data
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "I'm having a momentary connection issue. Let's try again in a second.",
        sender: 'ai',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Map our language codes to speech codes
    const langMap = { en: 'en-US', te: 'te-IN', hi: 'hi-IN' };
    recognition.lang = langMap[language] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInputValue(transcript);
        // Short delay before sending to show the user what was captured
        setTimeout(() => handleSendMessage(), 500);
      }
    };

    recognition.start();
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={cn(
              "bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-800 overflow-hidden mb-4 flex flex-col transition-all duration-300",
              isMinimized ? "w-72 h-14" : "w-[360px] sm:w-[400px] h-[600px]"
            )}
          >
            {/* Header */}
            <div className="p-6 text-white flex items-center justify-between shadow-lg" style={{ backgroundColor: themeColor }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight tracking-tight">BizMind AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                    <p className="text-[10px] text-white/80 font-black uppercase tracking-[0.15em]">AI Strategist Online</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ChevronRight className={cn("w-5 h-5 transition-transform", isMinimized ? "rotate-90" : "-rotate-90")} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f8fafc] dark:bg-slate-950/50"
                >
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[88%]",
                        msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "px-6 py-4 rounded-[24px] text-sm leading-relaxed shadow-sm",
                        msg.sender === 'user' 
                          ? "text-white rounded-tr-none font-bold" 
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none font-medium"
                      )}
                      style={msg.sender === 'user' ? { backgroundColor: themeColor } : {}}
                      >
                        {msg.text}
                      </div>

                      <span className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest px-2 opacity-60">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 w-fit">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor }}></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.2s]" style={{ backgroundColor: themeColor }}></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.4s]" style={{ backgroundColor: themeColor }}></div>
                    </div>
                  )}

                  {messages.length < 5 && !isTyping && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {[
                        t('revenue_prediction_q') || "What is my revenue prediction for next month?",
                        t('customer_expectation_q') || "Based on my data, how many customers should I expect this week?",
                        t('leads_summary_q') || "Show me a summary of my current leads."
                      ].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInputValue(q);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-colors text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Growth Coach Footer (Proactive) */}
                {intel?.growthCoach?.[0] && (
                  <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-t border-blue-100 dark:border-blue-900/30 flex items-center gap-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group">
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <p className="text-[10px] text-blue-800 dark:text-blue-300 font-medium truncate">
                      <span className="font-bold">Coach:</span> {intel.growthCoach[0].tip}
                    </p>
                    <ChevronRight className="w-3 h-3 text-blue-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                )}

                {/* Input Area */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-2.5 border border-slate-100 dark:border-slate-700 transition-all focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-lg focus-within:border-transparent">
                    <input 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask your virtual manager..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 text-slate-800 dark:text-white placeholder:text-slate-400 font-medium"
                    />
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={toggleVoice}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                        )}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          inputValue.trim() ? "text-white shadow-lg" : "text-slate-300 dark:text-slate-600"
                        )}
                        style={inputValue.trim() ? { backgroundColor: themeColor } : {}}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl relative group transition-all duration-300",
          isOpen ? "bg-slate-900 dark:bg-slate-950 rotate-90" : ""
        )}
        style={!isOpen ? { backgroundColor: themeColor } : {}}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <>
            <Bot className="w-7 h-7" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
            
            {/* Pop Tooltip */}
            <div className="absolute right-16 px-3 py-2 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest hidden lg:block">
              Consult BizMind AI
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-950 rotate-45"></div>
            </div>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default BizMindAssistant;
