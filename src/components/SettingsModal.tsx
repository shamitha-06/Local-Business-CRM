
import React from 'react';
import { X, Globe, Moon, Sun, Palette, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';
import { Language } from '../lib/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    language, setLanguage, 
    themeMode, setThemeMode, 
    themeColor, setThemeColor,
    fontSize, setFontSize,
    t 
  } = useSettings();

  const colors = [
    { name: 'Blue', value: '#2563eb' },
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Purple', value: '#9333ea' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Slate', value: '#334155' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{t('settings')}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
            {/* Language Selection */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('language')}</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'te', label: 'తెలుగు' },
                  { id: 'hi', label: 'हिन्दी' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id as Language)}
                    className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${
                      language === lang.id 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-200 dark:hover:border-slate-600'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Theme Mode */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                {themeMode === 'light' ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Interface Theme</h3>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`flex-1 group relative p-1 rounded-2xl border-4 transition-all overflow-hidden ${
                    themeMode === 'light' 
                      ? 'border-primary' 
                      : 'border-slate-100 dark:border-slate-700 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                  }`}
                >
                  <div className="bg-slate-50 p-4 rounded-xl flex flex-col items-center gap-3">
                    <Sun className={cn("w-6 h-6", themeMode === 'light' ? "text-primary" : "text-slate-400")} />
                    <span className={cn("text-xs font-bold", themeMode === 'light' ? "text-primary" : "text-slate-500")}>Bright Mode</span>
                  </div>
                </button>
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`flex-1 group relative p-1 rounded-2xl border-4 transition-all overflow-hidden ${
                    themeMode === 'dark' 
                      ? 'border-primary' 
                      : 'border-slate-100 dark:border-slate-700 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                  }`}
                >
                  <div className="bg-slate-900 p-4 rounded-xl flex flex-col items-center gap-3">
                    <Moon className={cn("w-6 h-6", themeMode === 'dark' ? "text-primary" : "text-slate-400")} />
                    <span className={cn("text-xs font-bold", themeMode === 'dark' ? "text-primary" : "text-white")}>Night Mode</span>
                  </div>
                </button>
              </div>
            </section>

            {/* Theme Color */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('theme_color')}</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setThemeColor(color.value)}
                    className={`w-10 h-10 rounded-full border-4 transition-all relative ${
                      themeColor === color.value 
                        ? 'border-slate-200 dark:border-slate-500 scale-110 shadow-lg' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {themeColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Font Size */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('font_size')}</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size as any)}
                    className={`py-2 px-4 rounded-xl text-sm font-bold border-2 transition-all capitalize ${
                      fontSize === size 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-slate-100 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </section>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
            <button 
              onClick={onClose}
              className="w-full bg-primary text-white py-4 rounded-2xl font-extrabold tracking-widest uppercase shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
            >
              OK
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsModal;
