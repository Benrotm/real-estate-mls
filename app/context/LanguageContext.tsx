'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'ro' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string; // Simple mock translation function
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('proplist-language') as Language;
        if (saved) setLanguage(saved);
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('proplist-language', language);
    }, [language]);

    // Mock translations for demo purposes
    const t = (key: string) => {
        return key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
