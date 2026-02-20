import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
    fr: {
        AVAILABLE: 'Disponible',
        AVAILABLE_INFO: 'Cette propriété est disponible.',
        UNAVAILABLE: 'Indisponible',
        UNAVAILABLE_INFO: 'Cette propriété est indisponible.',
    },
    en: {
        AVAILABLE: 'Available',
        AVAILABLE_INFO: 'This property is available.',
        UNAVAILABLE: 'Unavailable',
        UNAVAILABLE_INFO: 'This property is unavailable.',
    },
    ar: {
        AVAILABLE: 'متاح',
        AVAILABLE_INFO: 'هذا العقار متاح.',
        UNAVAILABLE: 'غير متاح',
        UNAVAILABLE_INFO: 'هذا العقار غير متاح.',
    },
})

langHelper.setLanguage(strings)
export { strings }
