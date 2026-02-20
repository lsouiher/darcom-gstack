import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const COPYRIGHT_PART1 = `Copyright © ${new Date().getFullYear()} ${env.WEBSITE_NAME}`

const strings = new LocalizedStrings({
  fr: {
    COPYRIGHT_PART1,
    COPYRIGHT_PART2: '. Tous droits réservés.',

    CORPORATE: 'À Propos',
    ABOUT: 'À propos de Nous',
    TOS: "Conditions d'utilisation",
    RENT: 'Louer une Propriété',
    AGENCIES: 'Agences',
    LOCATIONS: 'Destinations',
    SUPPORT: 'Support',
    CONTACT: 'Contact',
    SECURE_PAYMENT: `Paiement 100% sécurisé avec ${env.WEBSITE_NAME}`,
    PRIVACY_POLICY: 'Politique de Confidentialité',
    COOKIE_POLICY: 'Politique de cookies',
  },
  en: {
    COPYRIGHT_PART1,
    COPYRIGHT_PART2: '. All rights reserved.',

    CORPORATE: 'Corporate',
    ABOUT: 'About Us',
    TOS: 'Terms of Service',
    RENT: 'Rent a Property',
    AGENCIES: 'Agencies',
    LOCATIONS: 'Destinations',
    SUPPORT: 'Support',
    CONTACT: 'Contact',
    SECURE_PAYMENT: `100% secure payment with ${env.WEBSITE_NAME}`,
    PRIVACY_POLICY: 'Privacy Policy',
    COOKIE_POLICY: 'Cookie Policy',
  },
  ar: {
    COPYRIGHT_PART1,
    COPYRIGHT_PART2: '. جميع الحقوق محفوظة.',

    CORPORATE: 'عن الشركة',
    ABOUT: 'من نحن',
    TOS: 'شروط الاستخدام',
    RENT: 'استأجر عقارًا',
    AGENCIES: 'الوكالات',
    LOCATIONS: 'الوجهات',
    SUPPORT: 'الدعم',
    CONTACT: 'اتصل بنا',
    SECURE_PAYMENT: `دفع آمن 100% مع ${env.WEBSITE_NAME}`,
    PRIVACY_POLICY: 'سياسة الخصوصية',
    COOKIE_POLICY: 'سياسة ملفات تعريف الارتباط',
  },
})

langHelper.setLanguage(strings)
export { strings }
