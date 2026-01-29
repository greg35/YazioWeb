/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';
import { locales } from './locales';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('fr'); // Default to French

    const t = (key) => {
        const translation = locales[language]?.[key];
        if (translation) return translation;

        // Fallback to French
        const fallback = locales['fr']?.[key];
        if (fallback) return fallback;

        // Fallback to key
        return key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
