import axiosInstance from './axiosInstance'
import * as axiosHelper from '@/utils/axiosHelper'
import * as darywinTypes from ':darywin-types'

axiosHelper.init(axiosInstance)

/**
 * Get all agencies.
 *
 * @returns {Promise<darywinTypes.User[]>}
 */
export const getAllAgencies = (): Promise<darywinTypes.User[]> =>
  axiosInstance
    .get(
      '/api/all-agencies'
    )
    .then((res) => res.data)
