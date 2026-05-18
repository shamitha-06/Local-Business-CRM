import React from 'react';
import { 
  Bell, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Plus,
  Filter,
  MessageSquare,
  Phone,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useSettings } from '../context/SettingsContext';

const Reminders: React.FC = () => {
  const { t, themeColor } = useSettings();
  const [reminders, setReminders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const q = query(
        collection(db, 'businesses', user.uid, 'reminders'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribeSnap = onSnapshot(q, (snap) => {
        setReminders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        console.error("Firestore error in Reminders:", error);
        alert("Failed to load reminders: " + error.message);
        setLoading(false);
      });

      return () => unsubscribeSnap();
    });

    return () => unsubscribeAuth();
  }, []);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newReminder, setNewReminder] = React.useState({ title: '', customer: '', time: '', phone: '' });

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newReminder.title) return;
    
    try {
      setLoading(true);
      await addDoc(collection(db, 'businesses', auth.currentUser.uid, 'reminders'), {
        ...newReminder,
        customer: newReminder.customer || 'General',
        time: newReminder.time || 'Just now',
        phone: newReminder.phone || '',
        type: newReminder.title.toLowerCase().includes('birthday') ? 'Birthday' : 'Manual',
        priority: newReminder.title.toLowerCase().includes('birthday') ? 'High' : 'Medium',
        status: 'Pending',
        createdAt: serverTimestamp(),
        ownerId: auth.currentUser.uid
      });
      setIsModalOpen(false);
      setNewReminder({ title: '', customer: '', time: '', phone: '' });
    } catch (err) {
      alert('Error adding reminder: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  const markDone = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'businesses', auth.currentUser.uid, 'reminders', id));
  };

  const sendWhatsApp = (reminder: any) => {
    if (!reminder.phone) {
      alert("No phone number found for this reminder.");
      return;
    }
    
    const isBirthday = reminder.title.toLowerCase().includes('birthday') || reminder.type === 'Birthday';
    let message = `Hello ${reminder.customer}! This is a reminder: ${reminder.title} at ${reminder.time}.`;
    
    if (isBirthday) {
      message = `Happy Birthday ${reminder.customer}! 🎉 We at our business wish you a fantastic day. To celebrate, we have a special 20% discount coupon just for you: BDAY20. Have a great one!`;
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${reminder.phone.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('reminders_alerts')}</h2>
          <p className="text-slate-500 mt-1 font-medium">{t('manage_reminders')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: themeColor }}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 shadow-xl transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{t('new_reminder')}</span>
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('new_reminder')}</h3>
              <form onSubmit={addReminder} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('reminder_title')}</label>
                  <input 
                    autoFocus
                    required
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                    placeholder="e.g. Call Rahul for confirmation"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Name</label>
                  <input 
                    type="text"
                    value={newReminder.customer}
                    onChange={(e) => setNewReminder({...newReminder, customer: e.target.value})}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time / Date</label>
                  <input 
                    type="text"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                    placeholder="e.g. Tomorrow, 10:00 AM"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('phone')}</label>
                  <input 
                    type="tel"
                    value={newReminder.phone}
                    onChange={(e) => setNewReminder({...newReminder, phone: e.target.value})}
                    placeholder="e.g. +91 9876543210"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: themeColor }}
                    className="flex-1 py-3 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="font-bold text-slate-800 dark:text-white">{t('upcoming')}</h3>
            <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-slate-500 font-bold">Syncing Alerts...</p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">No pending reminders. You're all caught up!</p>
            </div>
          ) : reminders.map((reminder, idx) => (
            <motion.div 
              key={reminder.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  reminder.priority === 'High' ? "bg-red-50 text-red-600" : 
                  reminder.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-primary-light text-primary"
                )}>
                  <Bell className="w-6 h-6 border-2 border-white shadow-sm" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 tracking-tight">{reminder.title}</h4>
                  <p className="text-sm text-slate-500 font-medium">{reminder.customer}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {reminder.time}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      {reminder.type}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => sendWhatsApp(reminder)}
                  className="flex-1 sm:flex-none py-2 px-4 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </button>
                <button 
                  onClick={() => markDone(reminder.id)}
                  className="flex-1 sm:flex-none py-2 px-4 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('done')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-2xl text-white overflow-hidden relative shadow-xl">
            <div 
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: themeColor }}
            />
            <h3 className="text-xl font-bold mb-4 relative z-10 tracking-tight">{t('smart_templates')}</h3>
            <p className="text-sm text-slate-400 mb-6 relative z-10 leading-relaxed">Use AI to generate personalized follow-up messages for WhatsApp.</p>
            <div className="space-y-3 relative z-10">
              {[
                "Service due reminder",
                "Birthday wish + offer",
                "Payment follow-up",
                "Review request"
              ].map((template, idx) => (
                <button key={idx} className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between text-sm transition-colors group">
                  <span className="font-medium text-slate-200">{template}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-900 shadow-sm shadow-amber-100/50">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-500 mb-2">
              <AlertCircle className="w-5 h-5 font-bold" />
              <h4 className="font-extrabold text-sm uppercase tracking-wider">{t('pending_actions')}</h4>
            </div>
            <p className="text-sm text-amber-900 font-medium leading-relaxed">You have 12 customers who haven't visited in over 30 days. Consider sending a re-engagement offer.</p>
            <button className="mt-4 w-full py-3 bg-amber-200 text-amber-900 rounded-xl font-bold text-xs hover:bg-amber-300 transition-colors uppercase tracking-widest">
              Analyze Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
