import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    UNAUTHORIZED: 'Accès non autorisé',
  },
  en: {
    UNAUTHORIZED: 'Unauthorized access',
  },
  es: {
    UNAUTHORIZED: 'Acceso no autorizado',
  },
  ar: {
    UNAUTHORIZED: 'وصول غير مصرح به',
  },
})

langHelper.setLanguage(strings)
export { strings }
