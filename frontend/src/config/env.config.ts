import * as darywinTypes from ':darywin-types'
import Const from './const'

//
// ISO 639-1 language codes and their labels
// https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
//
const LANGUAGES = [
  {
    code: 'en',
    countryCode: 'us',
    label: 'English',
  },
  {
    code: 'fr',
    countryCode: 'fr',
    label: 'Français',
  },
  {
    code: 'ar',
    countryCode: 'sa',
    label: 'العربية',
  },
]

type Currency = { code: string, symbol: string }

/**
 * The three-letter ISO 4217 alphabetic currency codes, e.g. "USD" or "EUR" and their symbols.
 * https://docs.stripe.com/currencies
 *
 * @type {Currency[]}
 */
const CURRENCIES: Currency[] = [
  {
    code: 'USD',
    symbol: '$',
  },
  {
    code: 'EUR',
    symbol: '€',
  },
  {
    code: 'DZD',
    symbol: 'د.ج',
  },
]

const getPaymentGateway = () => {
  const paymentGateway = String(import.meta.env.VITE_DW_PAYMENT_GATEWAY || 'stripe').toUpperCase()

  if (paymentGateway === 'PAYPAL') {
    return darywinTypes.PaymentGateway.PayPal
  }

  // Default is Stripe
  return darywinTypes.PaymentGateway.Stripe
}

const PAYMENT_GATEWAY = getPaymentGateway()

const env = {
  isMobile: window.innerWidth <= 960,
  isProduction: import.meta.env.VITE_NODE_ENV === 'production',
  isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),

  WEBSITE_NAME: String(import.meta.env.VITE_DW_WEBSITE_NAME || "DaryWin"),

  APP_TYPE: darywinTypes.AppType.Frontend,
  API_HOST: String(import.meta.env.VITE_DW_API_HOST),
  LANGUAGES: LANGUAGES.map((l) => l.code),
  _LANGUAGES: LANGUAGES,
  DEFAULT_LANGUAGE: String(import.meta.env.VITE_DW_DEFAULT_LANGUAGE || 'en'),
  BASE_CURRENCY: String(import.meta.env.VITE_DW_BASE_CURRENCY || 'USD'),
  CURRENCIES,
  PAGE_SIZE: Number.parseInt(String(import.meta.env.VITE_DW_PAGE_SIZE), 10) || 30,
  PROPERTIES_PAGE_SIZE: Number.parseInt(String(import.meta.env.VITE_DW_PROPERTIES_PAGE_SIZE), 10) || 15,
  BOOKINGS_PAGE_SIZE: Number.parseInt(String(import.meta.env.VITE_DW_BOOKINGS_PAGE_SIZE), 10) || 20,
  BOOKINGS_MOBILE_PAGE_SIZE: Number.parseInt(String(import.meta.env.VITE_DW_BOOKINGS_MOBILE_PAGE_SIZE), 10) || 10,
  CDN_USERS: String(import.meta.env.VITE_DW_CDN_USERS),
  CDN_PROPERTIES: String(import.meta.env.VITE_DW_CDN_PROPERTIES),
  CDN_LOCATIONS: String(import.meta.env.VITE_DW_CDN_LOCATIONS),
  PAGE_OFFSET: 200,
  INFINITE_SCROLL_OFFSET: 40,
  AGENCY_IMAGE_WIDTH: Number.parseInt(String(import.meta.env.VITE_DW_AGENCY_IMAGE_WIDTH), 10) || 60,
  AGENCY_IMAGE_HEIGHT: Number.parseInt(String(import.meta.env.VITE_DW_AGENCY_IMAGE_HEIGHT), 10) || 30,
  PROPERTY_IMAGE_WIDTH: Number.parseInt(String(import.meta.env.VITE_DW_PROPERTY_IMAGE_WIDTH), 10) || 300,
  PROPERTY_IMAGE_HEIGHT: Number.parseInt(String(import.meta.env.VITE_DW_PROPERTY_IMAGE_HEIGHT), 10) || 200,
  PROPERTY_OPTION_IMAGE_HEIGHT: 85,
  SELECTED_PROPERTY_OPTION_IMAGE_HEIGHT: 30,
  RECAPTCHA_ENABLED: (import.meta.env.VITE_DW_RECAPTCHA_ENABLED && import.meta.env.VITE_DW_RECAPTCHA_ENABLED.toLowerCase()) === 'true',
  RECAPTCHA_SITE_KEY: String(import.meta.env.VITE_DW_RECAPTCHA_SITE_KEY),
  MINIMUM_AGE: Number.parseInt(String(import.meta.env.VITE_DW_MINIMUM_AGE), 10) || 21,
  /**
  * PAGINATION_MODE: CLASSIC or INFINITE_SCROLL
  * If you choose CLASSIC, you will get a classic pagination with next and previous buttons on desktop and infinite scroll on mobile.
  * If you choose INFINITE_SCROLL, you will get infinite scroll on desktop and mobile.
  * Default is CLASSIC
  */
  PAGINATION_MODE:
    (import.meta.env.VITE_DW_PAGINATION_MODE && import.meta.env.VITE_DW_PAGINATION_MODE.toUpperCase()) === Const.PAGINATION_MODE.INFINITE_SCROLL
      ? Const.PAGINATION_MODE.INFINITE_SCROLL
      : Const.PAGINATION_MODE.CLASSIC,
  SIZE_UNIT: 'm²',
  PAYMENT_GATEWAY,
  STRIPE_PUBLISHABLE_KEY: String(import.meta.env.VITE_DW_STRIPE_PUBLISHABLE_KEY),
  PAYPAL_CLIENT_ID: String(import.meta.env.VITE_DW_PAYPAL_CLIENT_ID),
  PAYPAL_DEBUG: (import.meta.env.VITE_DW_PAYPAL_DEBUG && import.meta.env.VITE_DW_PAYPAL_DEBUG.toLowerCase()) === 'true',
  SET_LANGUAGE_FROM_IP: (import.meta.env.VITE_DW_SET_LANGUAGE_FROM_IP && import.meta.env.VITE_DW_SET_LANGUAGE_FROM_IP.toLowerCase()) === 'true',
  GOOGLE_ANALYTICS_ENABLED: (import.meta.env.VITE_DW_GOOGLE_ANALYTICS_ENABLED && import.meta.env.VITE_DW_GOOGLE_ANALYTICS_ENABLED.toLowerCase()) === 'true',
  GOOGLE_ANALYTICS_ID: String(import.meta.env.VITE_DW_GOOGLE_ANALYTICS_ID),
  FB_APP_ID: String(import.meta.env.VITE_DW_FB_APP_ID),
  APPLE_ID: String(import.meta.env.VITE_DW_APPLE_ID),
  GG_APP_ID: String(import.meta.env.VITE_DW_GG_APP_ID),
  MIN_LOCATIONS: Number.parseInt(String(import.meta.env.VITE_DW_MIN_LOCATIONS), 10) || 4,
  CONTACT_EMAIL: import.meta.env.VITE_DW_CONTACT_EMAIL,
  HIDE_AGENCIES: (import.meta.env.VITE_DW_HIDE_AGENCIES && import.meta.env.VITE_DW_HIDE_AGENCIES.toLowerCase()) === 'true',
  MAP_LATITUDE: Number(String(import.meta.env.VITE_DW_MAP_LATITUDE || '36.7538')),
  MAP_LONGITUDE: Number(String(import.meta.env.VITE_DW_MAP_LONGITUDE || '3.0588')),
  MAP_ZOOM: Number(String(import.meta.env.VITE_DW_MAP_ZOOM || '6')),
}

export default env
