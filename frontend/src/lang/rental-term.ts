import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    MONTHLY: 'Mensuel',
    WEEKLY: 'Hebdomadaire',
    DAILY: 'Journalier',
    YEARLY: 'Annuel',
    MONTH: 'mois',
    WEEK: 'semaine',
    DAY: 'jour',
    YEAR: 'an',
  },
  en: {
    MONTHLY: 'Monthly',
    WEEKLY: 'Weekly',
    DAILY: 'Daily',
    YEARLY: 'Yearly',
    MONTH: 'month',
    WEEK: 'week',
    DAY: 'day',
    YEAR: 'year',
  },
  ar: {
    MONTHLY: 'شهري',
    WEEKLY: 'أسبوعي',
    DAILY: 'يومي',
    YEARLY: 'سنوي',
    MONTH: 'شهر',
    WEEK: 'أسبوع',
    DAY: 'يوم',
    YEAR: 'سنة',
  },
})

langHelper.setLanguage(strings)
export { strings }
