import React from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Globe, 
  Mail, 
  Phone, 
  Camera,
  Save,
  Twitter,
  Instagram,
  Facebook,
  Link as LinkIcon,
  Check
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useSettings } from '../context/SettingsContext';
import { motion, AnimatePresence } from 'motion/react';

const Profile: React.FC = () => {
  const { t, themeColor } = useSettings();
  const [business, setBusiness] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const fetchProfile = async () => {
        const ref = doc(db, 'businesses', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setBusiness(snap.data());
        } else {
          setBusiness({
            name: 'My Awesome Business',
            category: 'Salon',
            address: '123 Tech Avenue, Silicon Valley',
            phone: '+1 234 567 890',
            email: user.email || '',
            description: 'A premium local service provider.',
            workingHours: '9:00 AM - 6:00 PM',
            website: 'www.mybusiness.com',
            instagram: '',
            twitter: ''
          });
        }
        setLoading(false);
      };
      fetchProfile();
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusiness({ ...business, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await setDoc(doc(db, 'businesses', auth.currentUser.uid), business, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error saving profile: ' + (err as any).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      <AnimatePresence>
        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <Save className="w-3.5 h-3.5" />
            </div>
            Profile Saved Successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('business_profile')}</h2>
          <p className="text-slate-500 mt-1 font-medium">{t('manage_business')}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: saveSuccess ? '#10b981' : themeColor }}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50"
        >
          {saveSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : t('save')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden transition-all group-hover:border-blue-100">
                {business.logoUrl ? <img src={business.logoUrl} className="w-full h-full object-cover" /> : <Building2 className="w-12 h-12" />}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 text-white rounded-full shadow-lg hover:opacity-90 transition-all active:scale-90"
                style={{ backgroundColor: themeColor }}
              >
                <Camera className="w-4 h-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </div>
            <h3 className="text-xl font-bold mt-6 text-slate-800 dark:text-white tracking-tight">{business.name}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{business.category}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{t('social_presence')}</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase px-1">Instagram</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <input 
                    value={business.instagram || ''}
                    onChange={e => setBusiness({...business, instagram: e.target.value})}
                    placeholder="@username"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase px-1">Twitter</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
                  <Twitter className="w-4 h-4 text-blue-400" />
                  <input 
                    value={business.twitter || ''}
                    onChange={e => setBusiness({...business, twitter: e.target.value})}
                    placeholder="@username"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('business_name')}</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={business.name}
                    onChange={e => setBusiness({...business, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:ring-2 transition-all font-semibold text-slate-700 dark:text-slate-200"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Industry</label>
                <input 
                  value={business.category}
                  onChange={e => setBusiness({...business, category: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 transition-all font-semibold text-slate-700 dark:text-slate-200"
                  style={{ '--tw-ring-color': themeColor } as any}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('address')}</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={business.address}
                  onChange={e => setBusiness({...business, address: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:ring-2 transition-all font-semibold text-slate-700 dark:text-slate-200"
                  style={{ '--tw-ring-color': themeColor } as any}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={business.phone}
                    onChange={e => setBusiness({...business, phone: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:ring-2 transition-all font-semibold text-slate-700 dark:text-slate-200"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Website</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={business.website}
                    onChange={e => setBusiness({...business, website: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:ring-2 transition-all font-semibold text-slate-700 dark:text-slate-200"
                    style={{ '--tw-ring-color': themeColor } as any}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('working_hours')}</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={business.workingHours}
                  onChange={e => setBusiness({...business, workingHours: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:ring-2 transition-all font-semibold text-slate-700 dark:text-slate-200"
                  placeholder="e.g. Mon-Fri 9AM-8PM"
                  style={{ '--tw-ring-color': themeColor } as any}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Description</label>
              <textarea 
                rows={4}
                value={business.description}
                onChange={e => setBusiness({...business, description: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 transition-all font-semibold text-slate-700 dark:text-slate-200 resize-none"
                style={{ '--tw-ring-color': themeColor } as any}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
