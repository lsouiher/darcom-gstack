import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NEW_AGENCY: 'Nouvelle agence',
    AGENCY: 'agence',
    AGENCIES: 'agences',
  },
  en: {
    NEW_AGENCY: 'New agency',
    AGENCY: 'agency',
    AGENCIES: 'agencies',
  },
  ar: {
    NEW_AGENCY: 'وكالة جديدة',
    AGENCY: 'وكالة',
    AGENCIES: 'وكالات',
  },
})

langHelper.setLanguage(strings)
export { strings }
