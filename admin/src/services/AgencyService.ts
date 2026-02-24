import * as darywinTypes from ':darywin-types'
import axiosInstance from './axiosInstance'

/**
 * Validate an Agency name.
 *
 * @param {darywinTypes.ValidateAgencyPayload} data
 * @returns {Promise<number>}
 */
export const validate = (data: darywinTypes.ValidateAgencyPayload): Promise<number> =>
  axiosInstance
    .post(
      '/api/validate-agency',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Update an Agency.
 *
 * @param {darywinTypes.UpdateAgencyPayload} data
 * @returns {Promise<number>}
 */
export const update = (data: darywinTypes.UpdateAgencyPayload): Promise<number> =>
  axiosInstance
    .put(
      '/api/update-agency',
      data,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Delete an Agency.
 *
 * @param {string} id
 * @returns {Promise<number>}
 */
export const deleteAgency = (id: string): Promise<number> =>
  axiosInstance
    .delete(
      `/api/delete-agency/${encodeURIComponent(id)}`,
      { withCredentials: true }
    )
    .then((res) => res.status)

/**
 * Get an Agency by ID.
 *
 * @param {string} id
 * @returns {Promise<darywinTypes.User>}
 */
export const getAgency = (id: string): Promise<darywinTypes.User> =>
  axiosInstance
    .get(
      `/api/agency/${encodeURIComponent(id)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get Agencies.
 *
 * @param {string} keyword
 * @param {number} page
 * @param {number} size
 * @returns {Promise<darywinTypes.Result<darywinTypes.User>>}
 */
export const getAgencies = (keyword: string, page: number, size: number)
  : Promise<darywinTypes.Result<darywinTypes.User>> =>
  axiosInstance
    .get(
      `/api/agencies/${page}/${size}/?s=${encodeURIComponent(keyword)}`,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get all Agencies.
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
