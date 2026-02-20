import * as darywinTypes from ':darywin-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Create a Booking.
 *
 * @param {darywinTypes.Booking} data
 * @returns {Promise<darywinTypes.Booking>}
 */
export const create = (data: darywinTypes.Booking): Promise<darywinTypes.Booking> =>
  axiosInstance
    .post(
      '/api/create-booking',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Update a Booking.
 *
 * @param {darywinTypes.Booking} data
 * @returns {Promise<number>}
 */
export const update = (data: darywinTypes.Booking): Promise<number> =>
  axiosInstance
    .put(
      '/api/update-booking',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Update a Booking status.
 *
 * @param {darywinTypes.UpdateStatusPayload} data
 * @returns {Promise<number>}
 */
export const updateStatus = (data: darywinTypes.UpdateStatusPayload): Promise<number> =>
  axiosInstance
    .post(
      '/api/update-booking-status',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Delete Bookings.
 *
 * @param {string[]} ids
 * @returns {Promise<number>}
 */
export const deleteBookings = (ids: string[]): Promise<number> =>
  axiosInstance
    .post(
      '/api/delete-bookings',
      ids,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Get a Booking by ID.
 *
 * @param {string} id
 * @returns {Promise<darywinTypes.Booking>}
 */
export const getBooking = (id: string): Promise<darywinTypes.Booking> =>
  axiosInstance
    .get(
      `/api/booking/${encodeURIComponent(id)}/${UserService.getLanguage()}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get Bookings.
 *
 * @param {darywinTypes.GetBookingsPayload} payload
 * @param {number} page
 * @param {number} size
 * @returns {Promise<darywinTypes.Result<darywinTypes.Booking>>}
 */
export const getBookings = (payload: darywinTypes.GetBookingsPayload, page: number, size: number): Promise<darywinTypes.Result<darywinTypes.Booking>> =>
  axiosInstance
    .post(
      `/api/bookings/${page}/${size}/${UserService.getLanguage()}`,
      payload,
      { withCredentials: true }
    )
    .then((res) => res.data)
