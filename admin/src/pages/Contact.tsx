import React, { useState } from 'react'
import * as darywinTypes from ':darywin-types'
import Layout from '@/components/Layout'
import ContactForm from '@/components/ContactForm'

import '@/assets/css/contact.css'

const Contact = () => {
  const [user, setUser] = useState<darywinTypes.User>()

  const onLoad = (_user?: darywinTypes.User) => {
    setUser(_user)
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="contact">
        <ContactForm user={user} className="form" />
      </div>
    </Layout>
  )
}

export default Contact
