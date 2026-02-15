  import LocalizedStrings from 'localized-strings'
  import * as langHelper from '@/utils/langHelper'

  const strings = new LocalizedStrings({
    fr: {
      SIGN_IN: 'Se connecter',
      HOME: 'Accueil',
      BOOKINGS: 'Réservations',
      ABOUT: 'À propos',
      TOS: "Conditions d'utilisation",
      CONTACT: 'Contact',
      LANGUAGE: 'Langue',
      SETTINGS: 'Paramètres',
      SIGN_OUT: 'Déconnexion',
      AGENCIES: 'Agences',
      LOCATIONS: 'Destinations',
      PRIVACY_POLICY: 'Politique de Confidentialité',
      COOKIE_POLICY: 'Politique de cookies',
    },
    en: {
      SIGN_IN: 'Sign in',
      HOME: 'Home',
      BOOKINGS: 'Bookings',
      ABOUT: 'About',
      TOS: 'Terms of Service',
      CONTACT: 'Contact',
      LANGUAGE: 'Language',
      SETTINGS: 'Settings',
      SIGN_OUT: 'Sign out',
      AGENCIES: 'Agencies',
      LOCATIONS: 'Destinations',
      PRIVACY_POLICY: 'Privacy Policy',
      COOKIE_POLICY: 'Cookie Policy',
    },
    ar: {
      SIGN_IN: 'تسجيل الدخول',
      HOME: 'الرئيسية',
      BOOKINGS: 'الحجوزات',
      ABOUT: 'من نحن',
      TOS: 'شروط الاستخدام',
      CONTACT: 'اتصل بنا',
      LANGUAGE: 'اللغة',
      SETTINGS: 'الإعدادات',
      SIGN_OUT: 'تسجيل الخروج',
      AGENCIES: 'الوكالات',
      LOCATIONS: 'الوجهات',
      PRIVACY_POLICY: 'سياسة الخصوصية',
      COOKIE_POLICY: 'سياسة ملفات تعريف الارتباط',
    },
  })

  langHelper.setLanguage(strings)
  export { strings }
