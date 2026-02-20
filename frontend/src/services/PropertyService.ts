import * as darywinTypes from ':darywin-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Get properties.
 *
 * @param {darywinTypes.GetPropertiesPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<darywinTypes.Result<darywinTypes.Property>>}
 */
export const getProperties = (data: darywinTypes.GetPropertiesPayload, page: number, size: number): Promise<darywinTypes.Result<darywinTypes.Property>> =>
  axiosInstance
    .post(
      `/api/frontend-properties/${page}/${size}`,
      data
    ).then((res) => res.data)

/**
 * Get a Property by ID.
 *
 * @param {string} id
 * @returns {Promise<darywinTypes.Property>}
 */
export const getProperty = (id: string): Promise<darywinTypes.Property> =>
  axiosInstance
    .get(
      `/api/property/${encodeURIComponent(id)}/${UserService.getLanguage()}`
    )
    .then((res) => res.data)

/**
 * Get properties by agency and location.
 *
 * @param {string} keyword
 * @param {darywinTypes.GetBookingPropertiesPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<darywinTypes.Property[]>}
 */
export const getBookingProperties = (keyword: string, data: darywinTypes.GetBookingPropertiesPayload, page: number, size: number): Promise<darywinTypes.Property[]> =>
  axiosInstance
    .post(
      `/api/booking-properties/${page}/${size}/?s=${encodeURIComponent(keyword)}`,
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)
