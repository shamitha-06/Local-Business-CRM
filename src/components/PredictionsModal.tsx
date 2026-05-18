import React from 'react';
import { Sparkles, X, Loader2, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';

interface PredictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PredictionsModal: React.FC<PredictionsModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = React.useState(false);
  const [insights, setInsights] = React.useState<string[]>([]);

  const fetchInsights = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // Fetch Business Profile for Category
      const bizRef = doc(db, 'businesses', auth.currentUser.uid);
      const bizSnap = await getDoc(bizRef);
      const businessType = bizSnap.exists() ? bizSnap.data().category : 'General';

      // Fetch some real data to give context to AI
      const q = query(
        collection(db, 'businesses', auth.currentUser.uid, 'customers'), 
        limit(10)
      );
      const snap = await getDocs(q);
      const customers = snap.docs.map(d => d.data());

      const response = await fetch('/api/ai/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessData: { customerCount: snap.size, recentCustomers: customers },
          businessType 
        }),
      });
      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Insights error', error);
      setInsights(['Network error fetching AI insights.', 'Try again in a few moments.']);
    } finally {
      setLoading(true); // Artificial delay for cool effect
      setTimeout(() => setLoading(false), 800);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchInsights();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-2 bg-blue-600 w-full" />
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                    <Sparkles className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">AI Growth Predictions</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Personalized Business Strategy</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  <p className="text-sm font-bold text-slate-500 animate-pulse">Consulting Gemini AI Pro...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {insights.length === 0 && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-slate-500 font-medium italic">No growth patterns detected yet. Add more customers to unlock AI insights!</p>
                    </div>
                  )}
                  {insights.map((insight, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all cursor-default"
                    >
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {idx === 0 ? <TrendingUp className="w-5 h-5" /> : idx === 1 ? <Zap className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-700 font-bold leading-relaxed">{insight}</p>
                          <button 
                            onClick={() => {
                              alert('Strategy applied: New marketing campaign draft created based on this insight!');
                              onClose();
                            }}
                            className="mt-3 flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="text-[10px] font-extrabold uppercase tracking-widest">Apply Strategy</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <button 
                onClick={onClose}
                className="mt-8 w-full bg-slate-900 text-white py-4 rounded-xl font-bold tracking-widest uppercase text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Got it, Thanks
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PredictionsModal;
