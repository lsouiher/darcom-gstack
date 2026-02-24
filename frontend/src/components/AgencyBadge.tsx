import React from 'react'
import * as darywinTypes from ':darywin-types'
import * as darywinHelper from ':darywin-helper'
import env from '@/config/env.config'

import '@/assets/css/agency-badge.css'

interface AgencyBadgeProps {
  agency: darywinTypes.User
  style?: React.CSSProperties
}

const AgencyBadge = ({ agency, style }: AgencyBadgeProps) => (agency
  ? (
    <div className="agency-badge" style={style || {}}>
      <span className="agency-badge-logo">
        <img
          src={darywinHelper.joinURL(env.CDN_USERS, agency.avatar)}
          alt={agency.fullName}
        />
      </span>
      <span className="agency-badge-text">{agency.fullName}</span>
    </div>
  )
  : <></>)

export default AgencyBadge
