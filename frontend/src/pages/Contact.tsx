import React, { useState } from 'react'
import * as darywinTypes from ':darywin-types'
import Layout from '@/components/Layout'
import ContactForm from '@/components/ContactForm'
import Footer from '@/components/Footer'

import '@/assets/css/contact.css'

const Contact = () => {
  const [user, setUser] = useState<darywinTypes.User>()

  const onLoad = (_user?: darywinTypes.User) => {
    setUser(_user)
  }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="contact">
        <ContactForm user={user} className="form" />
      </div>
      <Footer />
    </Layout>
  )
}

export default Contact
