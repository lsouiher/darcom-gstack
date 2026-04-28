import axiosInstance from './axiosInstance'
import * as darywinTypes from ':darywin-types'

export const listPendingReview = () =>
  axiosInstance
    .get<darywinTypes.PendingReviewAgency[]>('/api/admin/agencies/pending-review', { withCredentials: true })
    .then((r) => r.data)

export const approveFirstPayout = (agencyId: string) =>
  axiosInstance
    .patch<{ _id: string; firstPayoutApproved: boolean }>(
      `/api/admin/agencies/${agencyId}/approve-first-payout`,
      {},
      { withCredentials: true },
    )
    .then((r) => r.data)
