import axiosInstance from './axiosInstance'
import * as darywinTypes from ':darywin-types'

export const getOnboardingChecklist = () =>
  axiosInstance
    .get<darywinTypes.OnboardingChecklistResponse>('/api/host/onboarding', { withCredentials: true })
    .then((r) => r.data)
