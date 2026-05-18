import React from 'react';
import { 
  Target, 
  Plus, 
  MoreHorizontal, 
  GripVertical,
  ChevronRight,
  TrendingUp,
  Star,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useSettings } from '../context/SettingsContext';

const stages = [
  { id: 'new', name: 'New Lead', color: 'bg-blue-500' },
  { id: 'contacted', name: 'Contacted', color: 'bg-indigo-500' },
  { id: 'interested', name: 'Interested', color: 'bg-amber-500' },
  { id: 'pending', name: 'Follow-up', color: 'bg-orange-500' },
  { id: 'converted', name: 'Converted', color: 'bg-emerald-500' }
];

const Leads: React.FC = () => {
  const { t, themeColor } = useSettings();
  const [leads, setLeads] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      const q = query(collection(db, 'businesses', user.uid, 'leads'), orderBy('createdAt', 'desc'));
      const unsubSnap = onSnapshot(q, (snap) => {
        setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        console.error("Firestore error in Leads:", error);
        alert("Failed to load leads: " + error.message);
        setLoading(false);
      });
      return () => unsubSnap();
    });
    return () => unsubscribeAuth();
  }, []);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newLead, setNewLead] = React.useState({ name: '', amount: '', source: 'Direct', status: 'new' });

  const addLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newLead.name) return;
    
    try {
      setLoading(true);
      await addDoc(collection(db, 'businesses', auth.currentUser.uid, 'leads'), {
        ...newLead,
        score: Math.floor(Math.random() * 40) + 60,
        createdAt: serverTimestamp(),
        ownerId: auth.currentUser.uid
      });
      setIsModalOpen(false);
      setNewLead({ name: '', amount: '', source: 'Direct' });
    } catch (err) {
      alert('Error adding lead: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (id: string, newStatus: string) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'businesses', auth.currentUser.uid, 'leads', id), {
      status: newStatus
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('lead_pipeline')}</h2>
          <p className="text-slate-500 mt-1 font-medium">{t('manage_leads')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: themeColor }}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 shadow-xl transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{t('add_new_lead')}</span>
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
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('add_new_lead')}</h3>
              <form onSubmit={addLead} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lead Name</label>
                  <input 
                    autoFocus
                    required
                    type="text"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                    placeholder="e.g. Vikram Dash"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('expected_amount')}</label>
                  <input 
                    type="text"
                    value={newLead.amount}
                    onChange={(e) => setNewLead({...newLead, amount: e.target.value})}
                    placeholder="e.g. $450"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Source</label>
                  <select 
                    value={newLead.source}
                    onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium appearance-none text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  >
                    <option value="Direct">Direct</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('initial_stage')}</label>
                  <select 
                    value={newLead.status}
                    onChange={(e) => setNewLead({...newLead, status: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium appearance-none text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
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

      <div className="flex overflow-x-auto gap-6 pb-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                <h3 className="font-bold text-slate-700 text-sm">{stage.name}</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {leads.filter(l => l.status === stage.id).length}
                </span>
              </div>
              <button onClick={addLead} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 min-h-[500px] bg-slate-100/50 p-3 rounded-2xl border border-dashed border-slate-200">
              {leads.filter(l => l.status === stage.id).map((lead) => (
                <motion.div 
                  key={lead.id}
                  layoutId={lead.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-slate-200" />
                      <h4 className="font-bold text-sm text-slate-800">{lead.name}</h4>
                    </div>
                    <button className="p-1 hover:bg-slate-50 rounded text-slate-300">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-slate-600">{lead.score}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                      {lead.source}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{lead.amount}</span>
                    <div className="flex gap-1">
                      {stages.map(s => s.id !== lead.status && (
                        <button 
                          key={s.id}
                          onClick={() => updateLeadStatus(lead.id, s.id)}
                          title={`Move to ${s.name}`}
                          className={`w-3 h-3 rounded-full ${s.color} opacity-40 hover:opacity-100 transition-opacity`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {leads.filter(l => l.status === stage.id).length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-20 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                  No leads
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leads;
