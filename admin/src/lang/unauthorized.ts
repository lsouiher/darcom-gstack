import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    UNAUTHORIZED: "Vous n'avez pas accès à cette section",
    UNAUTHORIZED_DESCRIPTION: 'Seuls les administrateurs de la plateforme peuvent accéder à cette section. Si vous avez besoin d\'accès, contactez le support.',
    CONTACT_SUPPORT: 'Contacter le support',
  },
  en: {
    UNAUTHORIZED: "You don't have access to this area",
    UNAUTHORIZED_DESCRIPTION: 'Only platform admins can view this section. If you need access, contact support.',
    CONTACT_SUPPORT: 'Contact support',
  },
})

langHelper.setLanguage(strings)
export { strings }
