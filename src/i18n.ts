import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import es from './locales/es';

export const defaultLanguage = 'en';

export const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
};

void i18next.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  supportedLngs: availableLanguages.map((language) => language.code),
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  returnNull: false,
});

export default i18next;
