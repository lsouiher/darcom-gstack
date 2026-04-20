import env from '@/config/env.config'

const base = () => env.ADMIN_HOST.replace(/\/$/, '')

export const adminUrl = (path: string = '/') =>
  `${base()}${path.startsWith('/') ? path : `/${path}`}`

export const adminSignInUrl = () => adminUrl('/sign-in')
