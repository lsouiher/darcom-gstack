import * as darywinTypes from ':darywin-types'
import axiosInstance from './axiosInstance'

/**
 * Get all agencies.
 *
 * @returns {Promise<darywinTypes.User[]>}
 */
export const getAllAgencies = (): Promise<darywinTypes.User[]> =>
  axiosInstance
    .get(
      '/api/all-agencies',
      { withCredentials: true }
)
    .then((res) => res.data)

/**
 * Get agencies.
 *
 * @param {string} keyword
 * @param {number} page
 * @param {number} size
 * @returns {Promise<darywinTypes.Result<darywinTypes.User>>}
 */
export const getAgencies = (keyword: string, page: number, size: number): Promise<darywinTypes.Result<darywinTypes.User>> =>
  axiosInstance
    .get(
      `/api/agencies/${page}/${size}/?s=${encodeURIComponent(keyword)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)
