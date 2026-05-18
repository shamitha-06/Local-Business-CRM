import React from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { useSettings } from '../context/SettingsContext';

const Customers: React.FC = () => {
  const { t, themeColor } = useSettings();
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState('All');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      const q = query(collection(db, 'businesses', user.uid, 'customers'), orderBy('createdAt', 'desc'));
      const unsubscribeSnap = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(docs);
        setLoading(false);
      }, (err) => {
        console.error("Firestore error in Customers:", err);
        alert("Failed to load customers: " + err.message);
        setLoading(false);
      });
      return () => unsubscribeSnap();
    });
    return () => unsubscribeAuth();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (filterType === 'All' || c.type === filterType)
  );

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState({ name: '', phone: '', type: 'Regular' });

  const addNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newCustomer.name) return;
    
    try {
      setLoading(true);
      await addDoc(collection(db, 'businesses', auth.currentUser.uid, 'customers'), {
        ...newCustomer,
        sentiment: 'Neutral',
        churnScore: 0.1,
        createdAt: serverTimestamp(),
        ownerId: auth.currentUser.uid
      });
      setIsModalOpen(false);
      setNewCustomer({ name: '', phone: '', type: 'Regular' });
    } catch (err) {
      alert('Error adding customer: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('customers')}</h2>
          <p className="text-slate-500 mt-1 font-medium">{t('manage_customers')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: themeColor }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 shadow-xl transition-all self-start md:self-auto active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          <span>{t('new_customer')}</span>
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
              <div 
                className="absolute top-0 right-0 w-32 h-32 blur-3xl -translate-y-1/2 translate-x-1/2 opacity-10"
                style={{ backgroundColor: themeColor }}
              ></div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('add_new_customer')}</h3>
              <form onSubmit={addNewCustomer} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('full_name')}</label>
                  <input 
                    autoFocus
                    required
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('phone')}</label>
                  <input 
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Type</label>
                  <select 
                    value={newCustomer.type}
                    onChange={(e) => setNewCustomer({...newCustomer, type: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 outline-none transition-all font-medium appearance-none text-slate-800 dark:text-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                  >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="New">New</option>
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

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder={t('search_customers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-4 pl-12 pr-4 focus:ring-2 shadow-sm transition-all text-slate-800 dark:text-white"
            style={{ '--tw-ring-color': themeColor } as any}
          />
        </div>
        <div className="flex gap-2">
          {['All', 'VIP', 'Regular', 'Churn Risk'].map(t => (
            <button 
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === t ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-48" />
          ))
        ) : filteredCustomers.map((customer, idx) => (
          <motion.div 
            key={customer.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {customer.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white transition-colors">{customer.name}</h4>
                  <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full ${
                    customer.type === 'VIP' ? 'bg-amber-100 text-amber-700' : 
                    customer.type === 'Churn Risk' ? 'bg-red-100 text-red-700' : 
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {customer.type}
                  </span>
                </div>
              </div>
              <button className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-300">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                <Sparkles className="w-4 h-4" style={{ color: themeColor }} />
                <span className="flex items-center gap-1.5">
                  {t('sentiment')}: 
                  <span className={`font-bold ${customer.sentiment === 'Positive' ? 'text-emerald-600' : customer.sentiment === 'Negative' ? 'text-red-500' : 'text-amber-500'}`}>
                    {customer.sentiment}
                  </span>
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('churn_probability')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${customer.churnScore > 0.7 ? 'bg-red-500' : customer.churnScore > 0.4 ? 'bg-amber-500' : 'bg-primary'}`}
                      style={{ 
                        width: `${customer.churnScore * 100}%`,
                        backgroundColor: customer.churnScore <= 0.4 ? themeColor : undefined
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{Math.round(customer.churnScore * 100)}%</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-primary transition-colors" style={{ '--tw-text-opacity': 1, color: themeColor } as any} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Customers;
