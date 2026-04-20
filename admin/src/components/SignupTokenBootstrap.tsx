import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'

const FLAG = 'bridged'

const stripFlag = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete(FLAG)
  const search = url.searchParams.toString()
  window.history.replaceState({}, '', url.pathname + (search ? `?${search}` : '') + url.hash)
}

const readAndStripFlag = (): boolean => {
  const params = new URLSearchParams(window.location.search)
  const present = params.get(FLAG) === '1'
  if (present) {
    stripFlag()
  }
  return present
}

const SignupTokenBootstrap = () => {
  const navigate = useNavigate()
  const ctx = useUserContext() as UserContextType | null
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current || !ctx) {
      return
    }
    // Strip the flag synchronously on first read so a re-mount can't replay
    // and analytics scripts can't see it. The flag carries no credentials —
    // the bridge token is in an httpOnly cookie sent with the POST below.
    if (!readAndStripFlag()) {
      return
    }
    ranRef.current = true

    UserService.consumeSignupToken()
      .then((res) => {
        ctx.setUser(res.data)
        ctx.setUserLoaded(true)
        navigate('/', { replace: true })
      })
      .catch(() => {
        navigate('/sign-in?expired=signup', { replace: true })
      })
  }, [ctx, navigate])

  return null
}

export default SignupTokenBootstrap
