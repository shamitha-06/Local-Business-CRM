import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Target, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  LayoutDashboard,
  Clock,
  Megaphone,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LucideIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import VoiceModal from './VoiceModal';
import PredictionsModal from './PredictionsModal';
import BizMindAssistant from './BizMindAssistant';
import SettingsModal from './SettingsModal';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';

const SidebarLink = ({ to, icon: Icon, children, onClick }: { to: string, icon: LucideIcon, children: React.ReactNode, onClick?: () => void }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold",
        isActive 
          ? "text-primary shadow-sm" 
          : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
      )}
      style={({ isActive }) => isActive ? { 
        backgroundColor: 'var(--primary-color-light)',
        color: 'var(--primary-color)'
      } : {}}
    >
      <Icon className="w-5 h-5 transition-colors" />
      <span className="text-[13px]">{children}</span>
    </NavLink>
  );
};

const Layout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [isVoiceOpen, setVoiceOpen] = React.useState(false);
  const [isPredictionsOpen, setPredictionsOpen] = React.useState(false);
  const [isSettingsOpen, setSettingsOpen] = React.useState(false);
  const [isNotifOpen, setNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const navigate = useNavigate();
  const { t, themeColor, themeMode, setThemeMode } = useSettings();

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) return;

      const q = query(
        collection(db, 'businesses', user.uid, 'reminders'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubSnap = onSnapshot(q, (snap) => {
        setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => unsubSnap();
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-colors">
        <div className="p-8 pb-10 flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200"
            style={{ backgroundColor: themeColor }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white leading-tight">LocalConnect AI<br/>CRM</span>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          <SidebarLink to="/" icon={LayoutDashboard}>{t('dashboard')}</SidebarLink>
          <SidebarLink to="/customers" icon={Users}>{t('customers')}</SidebarLink>
          <SidebarLink to="/leads" icon={Target}>{t('pipeline')}</SidebarLink>
          <SidebarLink to="/reminders" icon={Bell}>{t('reminders')}</SidebarLink>
          <SidebarLink to="/marketing" icon={Megaphone}>{t('marketing')}</SidebarLink>
          <SidebarLink to="/profile" icon={User}>{t('profile')}</SidebarLink>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 font-medium"
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-sm">{t('settings')}</span>
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-slate-50 dark:border-slate-800">
          <div className="rounded-2xl p-6 text-white text-sm relative overflow-hidden mb-6 shadow-xl shadow-blue-100 dark:shadow-none" style={{ backgroundColor: themeColor }}>
            <div className="relative z-10">
              <p className="text-white/80 font-bold text-[11px] uppercase tracking-wider mb-1">{t('ai_assistant')}</p>
              <p className="font-bold text-lg mb-4">{t('pro_active')}</p>
              <button 
                onClick={() => setPredictionsOpen(true)}
                className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors shadow-sm"
                style={{ color: themeColor }}
              >
                {t('view_predictions')}
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/20 rounded-full blur-3xl"></div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all duration-200 font-bold group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="text-[13px]">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-20 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 px-10 items-center justify-between z-10 transition-colors">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Global Dashboard</h1>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-widest font-extrabold rounded-full border border-emerald-200 dark:border-emerald-800">Active Now</span>
          </div>
          <div className="flex items-center gap-6">
            <div 
              onClick={() => setVoiceOpen(true)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
            >
              <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: themeColor }} />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Voice Command</span>
            </div>
            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-6 text-slate-400 relative">
              <div className="relative group" onClick={() => setNotifOpen(!isNotifOpen)}>
                <Bell className={cn("w-6 h-6 transition-colors cursor-pointer", isNotifOpen ? "text-primary" : "text-slate-400 hover:text-slate-600")} style={isNotifOpen ? { color: themeColor } : {}} />
                {notifications.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </div>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-10 right-0 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-white">Alerts & Reminders</span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary-light px-2 py-0.5 rounded">Real-time</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center text-slate-400 text-xs font-medium">No new notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                                  <Bell className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-white">{n.title}</p>
                                  <p className="text-xs text-slate-500">{n.customer}</p>
                                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-bold uppercase">
                                    <Clock className="w-3 h-3" />
                                    {n.time}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <button 
                        onClick={() => { navigate('/reminders'); setNotifOpen(false); }}
                        className="w-full py-3 bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        See All Activity
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-xs tracking-tighter">
                {auth.currentUser?.email?.[0].toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Nav Header */}
        <div className="lg:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-50">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-400">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" style={{ color: themeColor }} />
            <span className="font-bold text-slate-900 dark:text-white">LocalConnect AI CRM</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-[60]" 
                onClick={() => setSidebarOpen(false)} 
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 z-[70] p-6 shadow-2xl" 
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg dark:text-white">LocalConnect AI CRM</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-600 dark:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-2">
                  <SidebarLink to="/" icon={LayoutDashboard} onClick={() => setSidebarOpen(false)}>Dashboard</SidebarLink>
                  <SidebarLink to="/customers" icon={Users} onClick={() => setSidebarOpen(false)}>Customers</SidebarLink>
                  <SidebarLink to="/leads" icon={Target} onClick={() => setSidebarOpen(false)}>Inventory</SidebarLink>
                  <SidebarLink to="/reminders" icon={Bell} onClick={() => setSidebarOpen(false)}>Analytics</SidebarLink>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 z-50">
          <NavLink to="/" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-slate-400")} style={({ isActive }) => isActive ? { color: themeColor } : {}}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('dashboard')}</span>
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-slate-400")} style={({ isActive }) => isActive ? { color: themeColor } : {}}>
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('customers')}</span>
          </NavLink>
          <NavLink to="/leads" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-slate-400")} style={({ isActive }) => isActive ? { color: themeColor } : {}}>
            <Target className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('pipeline')}</span>
          </NavLink>
          <NavLink to="/reminders" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-slate-400")} style={({ isActive }) => isActive ? { color: themeColor } : {}}>
            <Bell className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('reminders')}</span>
          </NavLink>
        </nav>
      </div>
      <VoiceModal isOpen={isVoiceOpen} onClose={() => setVoiceOpen(false)} />
      <PredictionsModal isOpen={isPredictionsOpen} onClose={() => setPredictionsOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      <BizMindAssistant />
    </div>
  );
};

export default Layout;
