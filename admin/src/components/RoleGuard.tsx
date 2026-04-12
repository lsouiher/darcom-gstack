import React from 'react'
import * as darywinTypes from ':darywin-types'
import { useUserContext, UserContextType } from '@/context/UserContext'
import Unauthorized from './Unauthorized'

interface RoleGuardProps {
  requires: darywinTypes.UserType[]
  children: React.ReactNode
}

const RoleGuard = ({ requires, children }: RoleGuardProps) => {
  const { user, userLoaded } = useUserContext() as UserContextType
  if (!userLoaded) return null
  if (!user || !requires.includes(user.type as darywinTypes.UserType)) {
    return <Unauthorized />
  }
  return <>{children}</>
}

export default RoleGuard
