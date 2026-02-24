import React, { useState } from 'react'
import * as darywinTypes from ':darywin-types'
import Layout from '@/components/Layout'
import NotificationList from '@/components/NotificationList'

const Notifications = () => {
  const [user, setUser] = useState<darywinTypes.User>()

  const onLoad = async (_user?: darywinTypes.User) => {
    setUser(_user)
  }

  return (
    <Layout onLoad={onLoad} strict>
      <NotificationList user={user} />
    </Layout>
  )
}

export default Notifications
