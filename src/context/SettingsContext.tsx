
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../lib/translations';

type ThemeMode = 'light' | 'dark';
type FontSize = 'small' | 'medium' | 'large';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('app-lang') as Language) || 'en');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem('app-theme') as ThemeMode) || 'light');
  const [themeColor, setThemeColor] = useState<string>(() => localStorage.getItem('app-color') || '#2563eb');
  const [fontSize, setFontSize] = useState<FontSize>(() => (localStorage.getItem('app-font-size') as FontSize) || 'medium');

  useEffect(() => {
    localStorage.setItem('app-lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-theme', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('app-color', themeColor);
    document.documentElement.style.setProperty('--primary-color', themeColor);
    // Create a light version with opacity for backgrounds
    document.documentElement.style.setProperty('--primary-color-light', `${themeColor}15`);
    document.documentElement.style.setProperty('--primary-color-active', `${themeColor}30`);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('app-font-size', fontSize);
    const html = document.documentElement;
    if (fontSize === 'small') html.style.fontSize = '14px';
    else if (fontSize === 'medium') html.style.fontSize = '16px';
    else if (fontSize === 'large') html.style.fontSize = '18px';
  }, [fontSize]);

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ 
      language, setLanguage, 
      themeMode, setThemeMode, 
      themeColor, setThemeColor,
      fontSize, setFontSize,
      t 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
