import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import * as env from '../config/env.config'

export interface ParsedPhone {
  e164: string
  country: CountryCode
}

export class PhoneError extends Error {
  code: 'UNPARSEABLE' | 'COUNTRY_BLOCKED' | 'INVALID'
  constructor(code: PhoneError['code'], message: string) {
    super(message)
    this.code = code
  }
}

const allowedCountryCodes = (): string[] => {
  const raw = env.SIGNUP_ALLOWED_COUNTRY_CODES
  if (!raw) {
    return []
  }
  return raw.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
}

export const parseAndValidate = (input: string): ParsedPhone => {
  if (!input) {
    throw new PhoneError('UNPARSEABLE', 'phone is required')
  }
  const parsed = parsePhoneNumberFromString(input.trim())
  if (!parsed || !parsed.isValid()) {
    throw new PhoneError('UNPARSEABLE', 'phone could not be parsed')
  }
  const country = parsed.country
  if (!country) {
    throw new PhoneError('INVALID', 'phone has no country')
  }
  const allow = allowedCountryCodes()
  if (allow.length > 0 && !allow.includes(country)) {
    throw new PhoneError('COUNTRY_BLOCKED', `country ${country} is not supported`)
  }
  return { e164: parsed.number, country }
}

export const normalise = (input: string): string => parseAndValidate(input).e164
