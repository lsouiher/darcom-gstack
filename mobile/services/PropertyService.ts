import axiosInstance from './axiosInstance'
import * as UserService from './UserService'
import * as axiosHelper from '@/utils/axiosHelper'
import * as darywinTypes from ':darywin-types'

axiosHelper.init(axiosInstance)

/**
 * Get Properties.
 *
 * @async
 * @param {darywinTypes.GetPropertiesPayload} data
 * @param {number} page
 * @param {number} size
 * @returns {Promise<darywinTypes.Result<darywinTypes.Property>>}
 */
export const getProperties = async (data: darywinTypes.GetPropertiesPayload, page: number, size: number): Promise<darywinTypes.Result<darywinTypes.Property>> =>
  axiosInstance
    .post(
      `/api/frontend-properties/${page}/${size}`,
      data
    )
    .then((res) => res.data)

/**
 * Get a Property by ID.
 *
 * @async
 * @param {string} id
 * @returns {Promise<darywinTypes.Property>}
 */
export const getProperty = async (id: string): Promise<darywinTypes.Property> => {
  const language = await UserService.getLanguage()
  return axiosInstance
    .get(
      `/api/property/${encodeURIComponent(id)}/${language}`
    )
    .then((res) => res.data)
}
