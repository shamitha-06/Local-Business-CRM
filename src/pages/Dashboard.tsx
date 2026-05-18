import React from 'react';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  MousePointer2, 
  ArrowUpRight,
  Sparkles,
  Calendar,
  MessageSquare,
  Target
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, limit, orderBy, getDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { useSettings } from '../context/SettingsContext';

const data = [
  { name: 'Mon', revenue: 4000, customers: 24 },
  { name: 'Tue', revenue: 3000, customers: 18 },
  { name: 'Wed', revenue: 2000, customers: 12 },
  { name: 'Thu', revenue: 2780, customers: 20 },
  { name: 'Fri', revenue: 1890, customers: 15 },
  { name: 'Sat', revenue: 2390, customers: 25 },
  { name: 'Sun', revenue: 3490, customers: 30 },
];

const StatCard = ({ title, value, change, icon: Icon, type, themeColor }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md h-full flex flex-col justify-between"
    >
      <p className="text-slate-400 dark:text-slate-500 text-[11px] font-extrabold uppercase tracking-widest mb-4">{title}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
            <Icon className="w-6 h-6" style={{ color: type === 'success' ? '#10b981' : themeColor }} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tighter">{value}</h3>
        </div>
        <span className={cn(
          "text-xs font-extrabold px-3 py-1 rounded-full",
          type === 'success' ? "text-emerald-600 bg-emerald-100/50" : 
          type === 'info' ? "text-blue-600 bg-blue-100/50" : "text-slate-400 bg-slate-100/50"
        )} style={type !== 'success' && type !== 'info' ? {} : (type === 'info' ? { color: themeColor, backgroundColor: `${themeColor}15` } : {})}>
          {change}
        </span>
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const [aiInsights, setAiInsights] = React.useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = React.useState(true);
  const [stats, setStats] = React.useState({ customers: 0, leads: 0 });
  const [recentCustomers, setRecentCustomers] = React.useState<any[]>([]);
  const navigate = useNavigate();
  const { t, themeColor } = useSettings();

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      // Real-time stats
      const customerPath = `businesses/${user.uid}/customers`;
      const unsubCustomers = onSnapshot(query(collection(db, customerPath), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
        setStats(prev => ({ ...prev, customers: snap.size }));
        const recents = snap.docs.slice(0, 3).map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Customer',
          time: 'Just now',
          sentiment: doc.data().sentiment || 'Neutral',
          status: doc.data().type || 'Customer'
        }));
        setRecentCustomers(recents);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, customerPath);
      });

      const reminderPath = `businesses/${user.uid}/reminders`;
      const unsubReminders = onSnapshot(query(collection(db, reminderPath), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
        setStats(prev => ({ ...prev, leads: snap.size }));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, reminderPath);
      });

      const fetchInsights = async () => {
        if (!user) return;
        try {
          const bizPath = `businesses/${user.uid}`;
          const bizSnap = await getDoc(doc(db, bizPath));
          const businessType = bizSnap.exists() ? bizSnap.data().category : 'General';

          const res = await fetch('/api/ai/generate-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              businessType,
              businessData: { 
                customerCount: stats.customers, 
                reminderCount: stats.leads,
                recentCustomers: recentCustomers.length
              } 
            }),
          });
          const data = await res.json();
          setAiInsights(data.insights || ["Weekend sales predicted to increase", "Analyze evening peak hours", "Send loyalty rewards to top customers"]);
        } catch (err) {
          setAiInsights(["Weekend sales predicted to increase", "Analyze evening peak hours", "Send loyalty rewards to top customers"]);
        } finally {
          setLoadingInsights(false);
        }
      };
      
      fetchInsights();

      return () => {
        unsubCustomers();
        unsubReminders();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pt-4">
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">Business Overview</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-bizmind'));
            }}
            className="flex items-center gap-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl hover:opacity-90 transition-all active:scale-95"
          >
            <Sparkles className="w-5 h-5 text-white/70 dark:text-slate-900/70" />
            BizMind AI
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Customers" value={stats.customers} change="+12%" type="success" icon={Users} themeColor={themeColor} />
        <StatCard title="Active Alerts" value={stats.leads} change="Syncing" type="info" icon={Target} themeColor={themeColor} />
        <StatCard title="Retention Rate" value="84.2%" change="+2.4%" type="success" icon={TrendingUp} themeColor={themeColor} />
        <StatCard title="AI Score" value="92" change="High" type="neutral" icon={Sparkles} themeColor={themeColor} />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Revenue Chart Block */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 xl:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col min-h-[450px]"
        >
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Revenue & Growth Trends</h4>
            <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
              <span className="px-4 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm rounded-lg text-xs font-bold">Monthly</span>
              <span className="px-4 py-1.5 text-slate-400 rounded-lg text-xs font-bold cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">Weekly</span>
            </div>
          </div>
          <div className="flex-1 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColor || "#2563eb"} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={themeColor || "#2563eb"} stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="revenue" stroke={themeColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Strategy Lab Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 xl:col-span-4 rounded-3xl p-8 text-white shadow-2xl flex flex-col h-full relative overflow-hidden"
          style={{ backgroundColor: themeColor }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-10">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
              <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-white/80">AI Strategy Lab</h4>
            </div>
            
            <div className="space-y-10 flex-1">
              {aiInsights.map((insight, idx) => (
                <div key={idx} className="group">
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.15em] mb-2 leading-none">
                    {idx === 0 ? "Customer Prediction" : idx === 1 ? "Trending Analysis" : "Follow-up Alert"}
                  </p>
                  <p className="text-base leading-snug font-bold text-white pr-4">{insight}</p>
                </div>
              ))}
              {loadingInsights && (
                <div className="animate-pulse space-y-6">
                  <div className="space-y-2">
                    <div className="h-2 bg-white/20 rounded w-1/4"></div>
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-white/20 rounded w-1/4"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => navigate('/marketing')}
              className="mt-12 w-full bg-white py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-slate-50 transition-all shadow-xl active:scale-95"
              style={{ color: themeColor }}
            >
              Launch Campaigns
            </button>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-bold text-slate-800 dark:text-white">Recent Customers & Sentiment</h4>
          <button 
            onClick={() => navigate('/customers')}
            className="text-primary dark:text-primary text-xs font-bold hover:underline"
          >
            View All Customers
          </button>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-12 border-b border-slate-100 dark:border-slate-800 pb-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <div className="col-span-4">Customer</div>
              <div className="col-span-3">Last Visit</div>
              <div className="col-span-2 text-center">Sentiment</div>
              <div className="col-span-3 text-right">Status</div>
            </div>
            <div className="space-y-4 pt-4">
              {recentCustomers.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-medium italic">No recent customers found.</div>
              ) : recentCustomers.map((activity, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors cursor-default">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-xs text-primary">
                      {activity.name[0]}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activity.name}</span>
                  </div>
                  <div className="col-span-3 text-slate-500 dark:text-slate-400 font-medium">{activity.time}</div>
                  <div className="col-span-2 flex justify-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      activity.sentiment === "Positive" ? "bg-emerald-100 text-emerald-700" : 
                      activity.sentiment === "Negative" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {activity.sentiment}
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-primary font-bold text-xs">{activity.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
