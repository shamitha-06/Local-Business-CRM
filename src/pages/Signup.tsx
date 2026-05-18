import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, User, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { useSettings } from '../context/SettingsContext';

const categories = [
  "Salon", "Pharmacy", "Restaurant", "Driver Service", "Repair Shop", 
  "Clinic", "Gym", "Grocery Store", "Tuition Center", "Others"
];

const Signup: React.FC = () => {
  const { t } = useSettings();
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    businessName: '',
    category: 'Salon',
    ownerName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // Save business profile to Firestore
      const businessPath = `businesses/${user.uid}`;
      try {
        await setDoc(doc(db, 'businesses', user.uid), {
          name: formData.businessName,
          category: formData.category,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          username: formData.username,
          createdAt: new Date().toISOString()
        });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.WRITE, businessPath);
      }
      
      setStep(3); // Show success/OTP step
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-none p-8 md:p-10 relative overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 flex">
          <div className={`h-full bg-slate-900 dark:bg-blue-600 transition-all duration-500 ease-out ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Sparkles className="text-white w-6 h-6" />
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

        <form onSubmit={handleSignup} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('business_name')}</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500">
                    <Sparkles className="w-full h-full" />
                  </div>
                  <input 
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-700 dark:text-slate-200 font-semibold"
                    placeholder="E.g. Serenity Spa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Industry Category</label>
                <div className="relative">
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-700 dark:text-slate-200 font-semibold appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('full_name')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input 
                    name="ownerName"
                    required
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-700 dark:text-slate-200 font-semibold"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.businessName || !formData.ownerName}
                className="w-full bg-slate-900 dark:bg-blue-600 text-white rounded-xl py-4 font-bold tracking-widest uppercase text-xs hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-xl shadow-slate-200 dark:shadow-none flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
              >
                {t('done')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('email_address')}</label>
                  <input 
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-700 dark:text-slate-200 font-semibold"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('phone')}</label>
                  <input 
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-700 dark:text-slate-200 font-semibold"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('password')}</label>
                <input 
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-700 dark:text-slate-200 font-semibold"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Confirm Password</label>
                <input 
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-700 dark:text-slate-200 font-semibold"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl py-4 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-blue-600 text-white rounded-xl py-4 font-bold tracking-widest uppercase text-xs hover:bg-blue-700 shadow-xl shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? t('creating_account') : t('create_account')}
                  {!loading && <CheckCircle2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center py-10 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Success!</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-center max-w-xs font-medium">Your business account has been created. Redirecting to dashboard...</p>
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
          {t('already_have_account')} <Link to="/login" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline">{t('sign_in')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
