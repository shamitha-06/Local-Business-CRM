import React from 'react';
import { Mic, X, Loader2, Save, Bell, UserPlus, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose }) => {
  const { language, t, themeColor } = useSettings();
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    const langMap = { en: 'en-US', te: 'te-IN', hi: 'hi-IN' };
    recognition.lang = langMap[language] || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setResult(null);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const currentTranscript = Array.from(event.results)
        .map((res: any) => res[0].transcript)
        .join('');
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setError('Could not hear you clearly. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-process if we have a transcript
      setTimeout(() => {
        setTranscript(prev => {
          if (prev.length > 3) { // Lowered from 5
            processVoiceCommand(prev);
          }
          return prev;
        });
      }, 200); // Lowered from 500
    };

    recognition.start();
  };

  const processVoiceCommand = async (text?: string) => {
    const commandText = text || transcript;
    if (!auth.currentUser || !commandText || processing) return;
    
    setProcessing(true);
    setError(null);
    try {
      const bizRef = doc(db, 'businesses', auth.currentUser.uid);
      const bizSnap = await getDoc(bizRef);
      const businessType = bizSnap.exists() ? bizSnap.data().category : 'General';

      // Fetch customers to help AI identify people by name
      const custRef = collection(db, 'businesses', auth.currentUser.uid, 'customers');
      const custSnap = await getDocs(query(custRef, limit(50)));
      const customers = custSnap.docs.map(d => ({ name: d.data().name, phone: d.data().phone }));

      const response = await fetch('/api/ai/voice-to-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: commandText, 
          businessType,
          language,
          context: { customers } 
        }),
      });
      
      if (!response.ok) throw new Error('AI processing failed');
      
      const data = await response.json();
      if (data.error) {
        setError(data.message || 'AI quota exceeded. Please check your settings.');
        return;
      }
      setResult(data);
    } catch (error) {
      console.error('Processing error', error);
      setError('Falling back: Could not understand the voice command. Try typing or saying it differently.');
    } finally {
      setProcessing(false);
    }
  };

  const executeAction = async () => {
    if (!result || !auth.currentUser) return;
    setProcessing(true);

    try {
      if (result.action === 'add_customer') {
        await addDoc(collection(db, 'businesses', auth.currentUser.uid, 'customers'), {
          name: result.name || 'New Customer',
          phone: result.phone || '',
          notes: result.note || '',
          type: 'New',
          sentiment: 'Neutral',
          churnScore: 0.1,
          createdAt: serverTimestamp(),
          ownerId: auth.currentUser.uid
        });
      } else if (result.action === 'set_reminder') {
        const isBirthday = (result.note || '').toLowerCase().includes('birthday') || (result.name || '').toLowerCase().includes('birthday');
        await addDoc(collection(db, 'businesses', auth.currentUser.uid, 'reminders'), {
          title: result.note || 'Voice Reminder',
          customer: result.name || 'General',
          time: result.date || 'Soon',
          phone: result.phone || '',
          status: 'Pending',
          type: isBirthday ? 'Birthday' : 'Voice',
          priority: isBirthday ? 'High' : 'Medium',
          createdAt: serverTimestamp(),
          ownerId: auth.currentUser.uid
        });
      } else if (result.action === 'add_lead' || result.action === 'add_note') {
        await addDoc(collection(db, 'businesses', auth.currentUser.uid, 'leads'), {
          name: result.name || 'Quick Lead',
          amount: result.amount || '$0',
          source: 'Voice command',
          score: Math.floor(Math.random() * 40) + 50,
          status: result.status || 'new',
          note: result.note || transcript,
          createdAt: serverTimestamp(),
          ownerId: auth.currentUser.uid
        });
      }
      
      // Log the activity
      await addDoc(collection(db, 'businesses', auth.currentUser.uid, 'activities'), {
        type: 'voice_command',
        transcript,
        action: result.action,
        timestamp: serverTimestamp()
      });
      
      const isBirthday = (result.note || '').toLowerCase().includes('birthday') || (result.name || '').toLowerCase().includes('birthday');
      let messageText = result.whatsappMessage || `Hi ${result.name || ''}! We've noted your request: ${result.note || 'the update'}. We'll get back to you!`;
      
      if (isBirthday && !result.whatsappMessage) {
        messageText = `Happy Birthday ${result.name || ''}! 🎉 We wish you a fantastic day. As a gift, use coupon BDAY20 for 20% off on your next visit!`;
      }

      const finalPhone = (result.phone || '').replace(/[^0-9]/g, '');
      const finalMsg = encodeURIComponent(messageText);
      const finalUrl = `https://wa.me/${finalPhone}?text=${finalMsg}`;
      
      onClose();

      if (finalPhone && result.autoWhatsApp) {
        // Automatic trigger
        window.open(finalUrl, '_blank');
      } else if (finalPhone) {
        // Optional trigger
        if (confirm('Action saved! Send WhatsApp confirmation?')) {
          window.open(finalUrl, '_blank');
        }
      } else if (result.name) {
        console.log(`Action saved for ${result.name}. No phone found for WhatsApp.`);
      }

      if (result.action === 'set_reminder') navigate('/reminders');
      else if (result.action === 'add_customer') navigate('/customers');
    } catch (error) {
      console.error('Execution error', error);
      setError('Database error: ' + (error as any).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 border border-slate-100 dark:border-slate-700"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isListening ? 'bg-red-50 dark:bg-red-950/30 text-red-600 animate-pulse scale-110 shadow-lg shadow-red-100' : 'bg-blue-50 dark:bg-blue-950/30 shadow-lg shadow-blue-100'}`} style={!isListening ? { color: themeColor } as any : {}}>
                <Mic className={`w-10 h-10 ${isListening ? 'animate-bounce' : ''}`} />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">{t('voice_crm_title')}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                {isListening ? 'Listening your command...' : t('voice_crm_hint')}
              </p>

              {transcript && (
                <div className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6 text-sm font-semibold text-slate-600 dark:text-slate-400 italic relative group">
                  "{transcript}"
                  {!isListening && !processing && !result && (
                    <button 
                      onClick={() => processVoiceCommand()}
                      style={{ backgroundColor: themeColor }}
                      className="absolute -bottom-3 right-4 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-lg"
                    >
                      Analyze This
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="text-red-500 text-xs font-bold mb-4 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 w-full text-left">
                  {error}
                </div>
              )}

              {processing && (
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: themeColor }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('analyzing')}
                </div>
              )}

              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-left">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-widest mb-3">
                      {result.action === 'add_customer' ? <UserPlus className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      Command Detected
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-white capitalize">{(result.action || '').replace('_', ' ')}</p>
                      {result.name && <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-bold">Name:</span> {result.name}</p>}
                      {result.note && <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-bold">Note:</span> {result.note}</p>}
                      {result.date && <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-bold">Date:</span> {result.date}</p>}
                      {result.phone && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 w-fit px-2 py-0.5 rounded-full">
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp Ready
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={executeAction}
                    style={{ backgroundColor: themeColor }}
                    className="w-full text-white py-4 rounded-xl font-bold tracking-widest uppercase text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    {t('confirm_save')}
                  </button>
                </motion.div>
              )}

              {!isListening && !processing && !result && (
                <button 
                  onClick={startListening}
                  style={{ backgroundColor: themeColor }}
                  className="w-full text-white py-4 rounded-xl font-bold tracking-widest uppercase text-xs hover:opacity-90 shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {transcript ? 'Record Again' : 'Start Speaking'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

  );
};

export default VoiceModal;
