import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useSettings } from '../context/SettingsContext';

const Login: React.FC = () => {
  const { t } = useSettings();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-none p-8 md:p-10 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Sparkles className="text-white w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight text-center">{t('welcome_title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center font-medium">{t('welcome_subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('email_address')}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-700 dark:text-slate-200 font-semibold"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('password')}</label>
              <button type="button" className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-widest hover:underline">{t('forgot_password')}</button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-700 dark:text-slate-200 font-semibold"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="remember" className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{t('remember_me')}</label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white rounded-xl py-4 font-bold tracking-widest uppercase text-xs hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-xl shadow-slate-200 dark:shadow-none flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
          >
            {loading ? t('signing_in') : t('sign_in')}
            {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
          {t('no_account')} <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline">{t('register')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
