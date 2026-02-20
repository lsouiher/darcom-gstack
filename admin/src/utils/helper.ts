import { toast } from 'react-toastify'
import validator from 'validator'
import * as darywinTypes from ':darywin-types'
import * as darywinHelper from ':darywin-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings as rtStrings } from '@/lang/rental-term'
import { strings } from '@/lang/properties'
import env from '@/config/env.config'
import * as UserService from '@/services/UserService'

/**
 * Get language.
 *
 * @param {string} code
 * @returns {*}
 */
export const getLanguage = (code: string) => env._LANGUAGES.find((l) => l.code === code)

/**
 * Toast info message.
 *
 * @param {string} message
 */
export const info = (message: string) => {
  toast.info(message)
}

/**
 * Toast error message.
 *
 * @param {?unknown} [err]
 * @param {?string} [message]
 */
export const error = (err?: unknown, message?: string) => {
  if (err && console?.log) {
    console.log(err)
  }
  if (message) {
    toast.error(message)
  } else {
    toast.error(commonStrings.GENERIC_ERROR)
  }
}

/**
 * Get property type label.
 *
 * @param {string} type
 * @returns {string}
 */
export const getPropertyType = (type: string) => {
  switch (type) {
    case darywinTypes.PropertyType.Apartment:
      return strings.APARTMENT

    case darywinTypes.PropertyType.Commercial:
      return strings.COMMERCIAL

    case darywinTypes.PropertyType.Farm:
      return strings.FARM

    case darywinTypes.PropertyType.House:
      return strings.HOUSE

    case darywinTypes.PropertyType.Industrial:
      return strings.INDUSTRIAL

    case darywinTypes.PropertyType.Plot:
      return strings.PLOT

    case darywinTypes.PropertyType.Townhouse:
      return strings.TOWN_HOUSE
    default:
      return ''
  }
}

/**
 * Check whether a user is an administrator or not.
 *
 * @param {?darywinTypes.User} [user]
 * @returns {boolean}
 */
export const admin = (user?: darywinTypes.User): boolean =>
  (user && user.type === darywinTypes.RecordType.Admin) ?? false

/**
 * Get booking status background color.
 *
 * @param {string} status
 * @returns {string}
 */
export const getBookingStatusBackgroundColor = (status?: darywinTypes.BookingStatus) => {
  switch (status) {
    case darywinTypes.BookingStatus.Void:
      return '#D9D9D9'

    case darywinTypes.BookingStatus.Pending:
      return '#FBDCC2'

    case darywinTypes.BookingStatus.Deposit:
      return '#CDECDA'

    case darywinTypes.BookingStatus.Paid:
      return '#D1F9D1'

    case darywinTypes.BookingStatus.Reserved:
      return '#D9E7F4'

    case darywinTypes.BookingStatus.Cancelled:
      return '#FBDFDE'

    default:
      return ''
  }
}

/**
 * Get booking status text color.
 *
 * @param {string} status
 * @returns {string}
 */
export const getBookingStatusTextColor = (status?: darywinTypes.BookingStatus) => {
  switch (status) {
    case darywinTypes.BookingStatus.Void:
      return '#6E7C86'

    case darywinTypes.BookingStatus.Pending:
      return '#EF6C00'

    case darywinTypes.BookingStatus.Deposit:
      return '#3CB371'

    case darywinTypes.BookingStatus.Paid:
      return '#77BC23'

    case darywinTypes.BookingStatus.Reserved:
      return '#1E88E5'

    case darywinTypes.BookingStatus.Cancelled:
      return '#E53935'

    default:
      return ''
  }
}

/**
 * Get booking status label.
 *
 * @param {string} status
 * @returns {string}
 */
export const getBookingStatus = (status?: darywinTypes.BookingStatus) => {
  switch (status) {
    case darywinTypes.BookingStatus.Void:
      return commonStrings.BOOKING_STATUS_VOID

    case darywinTypes.BookingStatus.Pending:
      return commonStrings.BOOKING_STATUS_PENDING

    case darywinTypes.BookingStatus.Deposit:
      return commonStrings.BOOKING_STATUS_DEPOSIT

    case darywinTypes.BookingStatus.Paid:
      return commonStrings.BOOKING_STATUS_PAID

    case darywinTypes.BookingStatus.Reserved:
      return commonStrings.BOOKING_STATUS_RESERVED

    case darywinTypes.BookingStatus.Cancelled:
      return commonStrings.BOOKING_STATUS_CANCELLED

    default:
      return ''
  }
}

/**
 * Get all booking statuses.
 *
 * @returns {darywinTypes.StatusFilterItem[]}
 */
export const getBookingStatuses = (): darywinTypes.StatusFilterItem[] => [
  {
    value: darywinTypes.BookingStatus.Void,
    label: commonStrings.BOOKING_STATUS_VOID,
  },
  {
    value: darywinTypes.BookingStatus.Pending,
    label: commonStrings.BOOKING_STATUS_PENDING,
  },
  {
    value: darywinTypes.BookingStatus.Deposit,
    label: commonStrings.BOOKING_STATUS_DEPOSIT,
  },
  {
    value: darywinTypes.BookingStatus.Paid,
    label: commonStrings.BOOKING_STATUS_PAID,
  },
  {
    value: darywinTypes.BookingStatus.Reserved,
    label: commonStrings.BOOKING_STATUS_RESERVED,
  },
  {
    value: darywinTypes.BookingStatus.Cancelled,
    label: commonStrings.BOOKING_STATUS_CANCELLED,
  },
]

/**
 * Get bedrooms tooltip.
 *
 * @param {number} bedrooms
 * @param {?boolean} [fr]
 * @returns {string}
 */
export const getBedroomsTooltip = (bedrooms: number, fr?: boolean) =>
  `${strings.TOOLTIP_1}${bedrooms} ${fr
    ? bedrooms > 1 ? strings.BEDROOMS_TOOLTIP_2 : strings.BEDROOMS_TOOLTIP_1
    : strings.BEDROOMS_TOOLTIP_1 + (bedrooms > 1 ? 's' : '')}`

/**
 * Get bathrooms tooltip.
 *
 * @param {number} bathrooms
 * @param {?boolean} [fr]
 * @returns {string}
 */
export const getBathroomsTooltip = (bathrooms: number, fr?: boolean) =>
  `${strings.TOOLTIP_1}${bathrooms} ${fr
    ? bathrooms > 1 ? strings.BATHROOMS_TOOLTIP_2 : strings.BATHROOMS_TOOLTIP_1
    : strings.BATHROOMS_TOOLTIP_1 + (bathrooms > 1 ? 's' : '')}`

/**
 * Get kitchens tooltip.
 *
 * @param {number} bathrooms
 * @returns {string}
 */
export const getKitchensTooltip = (bathrooms: number) =>
  `${strings.TOOLTIP_1}${bathrooms} ${strings.KITCHENS_TOOLTIP_1 + (bathrooms > 1 ? 's' : '')}`

/**
 * Get parking spaces tooltip.
 *
 * @param {number} parkingSpaces
 * @param {?boolean} [fr]
 * @returns {string}
 */
export const getKParkingSpacesTooltip = (parkingSpaces: number, fr?: boolean) =>
  `${strings.TOOLTIP_1}${parkingSpaces} ${fr
    ? parkingSpaces > 1 ? strings.PARKING_SPACES_TOOLTIP_2 : strings.PARKING_SPACES_TOOLTIP_1
    : strings.PARKING_SPACES_TOOLTIP_1 + (parkingSpaces > 1 ? 's' : '')}`

/**
 * Get all user types.
 *
 * @returns {{}}
 */
export const getUserTypes = () => [
  {
    value: darywinTypes.UserType.Admin,
    label: commonStrings.RECORD_TYPE_ADMIN
  },
  {
    value: darywinTypes.UserType.Agency,
    label: commonStrings.RECORD_TYPE_AGENCY,
  },
  {
    value: darywinTypes.UserType.User,
    label: commonStrings.RECORD_TYPE_USER
  },
]

/**
 * Get user type label.
 *
 * @param {string} type
 * @returns {string}
 */
export const getUserType = (type?: darywinTypes.UserType) => {
  switch (type) {
    case darywinTypes.UserType.Admin:
      return commonStrings.RECORD_TYPE_ADMIN

    case darywinTypes.UserType.Agency:
      return commonStrings.RECORD_TYPE_AGENCY

    case darywinTypes.UserType.User:
      return commonStrings.RECORD_TYPE_USER

    default:
      return ''
  }
}

/**
 * Get days label.
 *
 * @param {number} days
 * @returns {string}
 */
export const getDays = (days: number) =>
  `${strings.PRICE_DAYS_PART_1} ${days} ${strings.PRICE_DAYS_PART_2}${days > 1 ? 's' : ''}`

/**
 * Get short days label.
 *
 * @param {number} days
 * @returns {string}
 */
export const getDaysShort = (days: number) => `${days} ${strings.PRICE_DAYS_PART_2}${days > 1 ? 's' : ''}`

/**
 * Get cancellation label.
 *
 * @param {number} cancellation
 * @param {string} language
 * @returns {string}
 */
export const getCancellation = (cancellation: number, language: string) => {
  const fr = darywinHelper.isFrench(language)

  if (cancellation === -1) {
    return `${strings.CANCELLATION}${fr ? ' : ' : ': '}${strings.UNAVAILABLE}`
  } if (cancellation === 0) {
    return `${strings.CANCELLATION}${fr ? ' : ' : ': '}${strings.INCLUDED}${fr ? 'e' : ''}`
  }
  return `${strings.CANCELLATION}${fr ? ' : ' : ': '}${darywinHelper.formatPrice(cancellation, commonStrings.CURRENCY, language)}`
}

/**
 * Get cancellation option label.
 *
 * @param {number} cancellation
 * @param {string} language
 * @param {boolean} hidePlus
 * @returns {string}
 */
export const getCancellationOption = (cancellation: number, language: string, hidePlus: boolean) => {
  const fr = darywinHelper.isFrench(language)

  if (cancellation === -1) {
    return strings.UNAVAILABLE
  } if (cancellation === 0) {
    return `${strings.INCLUDED}${fr ? 'e' : ''}`
  }
  return `${hidePlus ? '' : '+ '}${darywinHelper.formatPrice(cancellation, commonStrings.CURRENCY, language)}`
}

/**
 * Get birthdate error message.
 *
 * @param {number} minimumAge
 * @returns {string}
 */
export const getBirthDateError = (minimumAge: number) =>
  `${commonStrings.BIRTH_DATE_NOT_VALID_PART1} ${minimumAge} ${commonStrings.BIRTH_DATE_NOT_VALID_PART2}`

/**
 * Check whether a property option is available or not.
 *
 * @param {(darywinTypes.Property | undefined)} property
 * @param {string} option
 * @returns {boolean}
 */
export const propertyOptionAvailable = (property: darywinTypes.Property | undefined, option: string) =>
  property && option in property && (property[option] as number) > -1

/**
 * Get all property types.
 *
 * @returns {darywinTypes.PropertyType[]}
 */
export const getAllPropertyTypes = () =>
  [
    darywinTypes.PropertyType.Apartment,
    darywinTypes.PropertyType.Commercial,
    darywinTypes.PropertyType.Farm,
    darywinTypes.PropertyType.House,
    darywinTypes.PropertyType.Industrial,
    darywinTypes.PropertyType.Plot,
    darywinTypes.PropertyType.Townhouse
  ]

/**
 * Get all rental terms.
 *
 * @returns {darywinTypes.RentalTerm[]}
 */
export const getAllRentalTerms = () =>
  [
    darywinTypes.RentalTerm.Monthly,
    darywinTypes.RentalTerm.Weekly,
    darywinTypes.RentalTerm.Daily,
    darywinTypes.RentalTerm.Yearly,
  ]

/**
 * Get rental term label.
 *
 * @param {darywinTypes.RentalTerm} term
 * @returns {string}
 */
export const rentalTerm = (term: darywinTypes.RentalTerm): string => {
  switch (term) {
    case darywinTypes.RentalTerm.Monthly:
      return rtStrings.MONTHLY
    case darywinTypes.RentalTerm.Weekly:
      return rtStrings.WEEKLY
    case darywinTypes.RentalTerm.Daily:
      return rtStrings.DAILY
    case darywinTypes.RentalTerm.Yearly:
      return rtStrings.YEARLY
    default:
      return ''
  }
}

/**
 * Get rental term unit.
 *
 * @param {darywinTypes.RentalTerm} term
 * @returns {string}
 */
export const rentalTermUnit = (term: darywinTypes.RentalTerm): string => {
  switch (term) {
    case darywinTypes.RentalTerm.Monthly:
      return rtStrings.MONTH
    case darywinTypes.RentalTerm.Weekly:
      return rtStrings.WEEK
    case darywinTypes.RentalTerm.Daily:
      return rtStrings.DAY
    case darywinTypes.RentalTerm.Yearly:
      return rtStrings.YEAR
    default:
      return ''
  }
}

/**
 * Get price label.
 *
 * @param {darywinTypes.Property} property
 * @param {string} language
 * @returns {string}
 */
export const priceLabel = (property: darywinTypes.Property, language: string): string =>
  `${darywinHelper.formatPrice(property.price, commonStrings.CURRENCY, language)}/${rentalTermUnit(property.rentalTerm)}`

/**
 * Validate URL string.
 *
 * @param {string} url
 * @returns {boolean}
 */
export const isValidURL = (url: string) => validator.isURL(url, { protocols: ['http', 'https'] })

/**
 * Verify reCAPTCHA token.
 *
 * @async
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export const verifyReCaptcha = async (token: string): Promise<boolean> => {
  try {
    const ip = await UserService.getIP()
    const status = await UserService.verifyRecaptcha(token, ip)
    const valid = status === 200
    return valid
  } catch (err) {
    error(err)
    return false
  }
}
