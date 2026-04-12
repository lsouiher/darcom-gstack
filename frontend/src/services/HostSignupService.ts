import axiosInstance from './axiosInstance'
import * as darywinTypes from ':darywin-types'

const withCreds = { withCredentials: true }

export const start = (payload: darywinTypes.HostSignupStartPayload) =>
  axiosInstance.post<darywinTypes.HostSignupResponse>('/api/signup/host/start', payload, withCreds).then((r) => r.data)

export const verifyPhone = (payload: darywinTypes.VerifyPhonePayload) =>
  axiosInstance.post<darywinTypes.HostSignupResponse>('/api/signup/host/verify-phone', payload, withCreds).then((r) => r.data)

export const submitDetails = (payload: darywinTypes.HostSignupDetailsPayload) =>
  axiosInstance.post<darywinTypes.HostSignupResponse>('/api/signup/host/details', payload, withCreds).then((r) => r.data)

export const complete = (payload: darywinTypes.HostSignupCompletePayload) =>
  axiosInstance.post<darywinTypes.HostSignupResponse>('/api/signup/host/complete', payload, withCreds).then((r) => r.data)

export const current = () =>
  axiosInstance.get<darywinTypes.HostSignupResponse>('/api/signup/host/current', withCreds).then((r) => r.data)
