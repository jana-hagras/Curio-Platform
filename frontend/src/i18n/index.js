import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English
import commonEN from './locales/en/common.json';
import homeEN from './locales/en/home.json';
import authEN from './locales/en/auth.json';
import marketplaceEN from './locales/en/marketplace.json';
import productEN from './locales/en/product.json';
import requestEN from './locales/en/request.json';
import mentorshipEN from './locales/en/mentorship.json';
import workshopEN from './locales/en/workshop.json';
import dashboardEN from './locales/en/dashboard.json';
import adminEN from './locales/en/admin.json';
import chatEN from './locales/en/chat.json';
import orderEN from './locales/en/order.json';
import profileEN from './locales/en/profile.json';

// Arabic
import commonAR from './locales/ar/common.json';
import homeAR from './locales/ar/home.json';
import authAR from './locales/ar/auth.json';
import marketplaceAR from './locales/ar/marketplace.json';
import productAR from './locales/ar/product.json';
import requestAR from './locales/ar/request.json';
import mentorshipAR from './locales/ar/mentorship.json';
import workshopAR from './locales/ar/workshop.json';
import dashboardAR from './locales/ar/dashboard.json';
import adminAR from './locales/ar/admin.json';
import chatAR from './locales/ar/chat.json';
import orderAR from './locales/ar/order.json';
import profileAR from './locales/ar/profile.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEN,
        home: homeEN,
        auth: authEN,
        marketplace: marketplaceEN,
        product: productEN,
        request: requestEN,
        mentorship: mentorshipEN,
        workshop: workshopEN,
        dashboard: dashboardEN,
        admin: adminEN,
        chat: chatEN,
        order: orderEN,
        profile: profileEN,
      },
      ar: {
        common: commonAR,
        home: homeAR,
        auth: authAR,
        marketplace: marketplaceAR,
        product: productAR,
        request: requestAR,
        mentorship: mentorshipAR,
        workshop: workshopAR,
        dashboard: dashboardAR,
        admin: adminAR,
        chat: chatAR,
        order: orderAR,
        profile: profileAR,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'home', 'auth', 'marketplace', 'product', 'request', 'mentorship', 'workshop', 'dashboard', 'admin', 'chat', 'order', 'profile'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'curio_lang',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

// Apply direction and lang attributes on init and language change
const applyLanguageAttributes = (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lng);
};

applyLanguageAttributes(i18n.language);
i18n.on('languageChanged', applyLanguageAttributes);

export default i18n;
