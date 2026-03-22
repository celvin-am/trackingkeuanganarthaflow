import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';
import type { Language, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('arthaflow_language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('arthaflow_language', language);
  }, [language]);

  const value = React.useMemo(() => ({
    language,
    setLanguage,
    t: (key: TranslationKey): string => {
      return translations[language][key] || translations['en'][key] || key;
    }
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
