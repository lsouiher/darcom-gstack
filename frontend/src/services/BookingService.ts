import * as darywinTypes from ':darywin-types'
import axiosInstance from './axiosInstance'
import * as UserService from './UserService'

/**
 * Complete the checkout process and create the booking.
 *
 * @param {darywinTypes.CheckoutPayload} data
 * @returns {Promise<number>}
 */
export const checkout = (data: darywinTypes.CheckoutPayload): Promise<{ status: number, bookingId: string }> =>
  axiosInstance
    .post(
      '/api/checkout',
      data
    )
    .then((res) => ({ status: res.status, bookingId: res.data.bookingId }))
/**
 * Get bookings.
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
 * Cancel a Booking.
 *
 * @param {string} id
 * @returns {Promise<number>}
 */
export const cancel = (id: string): Promise<number> =>
  axiosInstance
    .post(
      `/api/cancel-booking/${encodeURIComponent(id)}`,
      null,
      { withCredentials: true }
    ).then((res) => res.status)

/**
* Delete temporary Booking created from checkout session.
*
* @param {string} bookingId
* @param {string} sessionId
* @returns {Promise<number>}
*/
export const deleteTempBooking = (bookingId: string, sessionId: string): Promise<number> =>
  axiosInstance
    .delete(
      `/api/delete-temp-booking/${bookingId}/${sessionId}`,
    ).then((res) => res.status)

/**
* Get a Booking by sessionId.
*
* @param {string} id
* @returns {Promise<ohmjetTypes.Booking>}
*/
export const getBookingId = (sessionId: string): Promise<string> =>
  axiosInstance
    .get(
      `/api/booking-id/${encodeURIComponent(sessionId)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
