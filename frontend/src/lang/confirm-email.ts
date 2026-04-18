import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    CONFIRM_EMAIL_HEADING: 'Confirmation de l\'adresse e-mail',
    CONFIRM_EMAIL_SUCCESS: 'Votre adresse e-mail a été confirmée avec succès.',
    CONFIRM_EMAIL_ALREADY_VERIFIED: 'Votre compte est déjà vérifié.',
    CONFIRM_EMAIL_ERROR: 'Une erreur s\'est produite lors de la confirmation de votre adresse e-mail.',
    CONFIRM_EMAIL_EXPIRED: 'Votre lien de confirmation a expiré.',
    REDIRECT_MESSAGE: 'Vous serez redirigé automatiquement dans quelques secondes...',
  },
  en: {
    CONFIRM_EMAIL_HEADING: 'Email Confirmation',
    CONFIRM_EMAIL_SUCCESS: 'Your email address has been successfully confirmed.',
    CONFIRM_EMAIL_ALREADY_VERIFIED: 'Your account is already verified.',
    CONFIRM_EMAIL_ERROR: 'An error occurred while confirming your email address.',
    CONFIRM_EMAIL_EXPIRED: 'Your confirmation link has expired.',
    REDIRECT_MESSAGE: 'You will be redirected automatically in a few seconds...',
  },
  ar: {
    CONFIRM_EMAIL_HEADING: 'تأكيد البريد الإلكتروني',
    CONFIRM_EMAIL_SUCCESS: 'تم تأكيد عنوان بريدك الإلكتروني بنجاح.',
    CONFIRM_EMAIL_ALREADY_VERIFIED: 'حسابك مُفعّل بالفعل.',
    CONFIRM_EMAIL_ERROR: 'حدث خطأ أثناء تأكيد عنوان بريدك الإلكتروني.',
    CONFIRM_EMAIL_EXPIRED: 'انتهت صلاحية رابط التأكيد الخاص بك.',
    REDIRECT_MESSAGE: 'ستتم إعادة توجيهك تلقائيًا خلال ثوانٍ قليلة...',
  },
})

langHelper.setLanguage(strings)
export { strings }
