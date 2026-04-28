import React, { useEffect, useState } from 'react'
import {
  Button,
  Paper,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import { strings as mStrings } from '@/lang/master'
import { strings } from '@/lang/confirm-email'
import { useUserContext, UserContextType } from '@/context/UserContext'
import NoMatch from './NoMatch'
import * as helper from '@/utils/helper'
import Footer from '@/components/Footer'

import '@/assets/css/confirm-email.css'

const ConfirmEmail = () => {
  const navigate = useNavigate()
  const { user, setUser } = useUserContext() as UserContextType

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [expired, setExpired] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const _email = params.get('e')
    const _token = params.get('t')

    if (!_email || !_token) {
      setNoMatch(true)
      setLoading(false)
      return
    }

    setEmail(_email)

    const confirm = async () => {
      try {
        const status = await UserService.confirmEmail(_email, _token)
        if (status === 200) {
          setSuccess(true)

          // Refresh user context if logged in
          const currentUser = UserService.getCurrentUser()
          if (currentUser) {
            const freshUser = await UserService.getUser(currentUser._id)
            if (freshUser) {
              setUser(freshUser)
            }
          }

          // Auto-redirect after 5 seconds
          setTimeout(() => {
            navigate('/')
          }, 5000)
        } else {
          setNoMatch(true)
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number } }
        if (axiosError.response?.status === 400) {
          setExpired(true)
        } else {
          setNoMatch(true)
        }
      } finally {
        setLoading(false)
      }
    }

    confirm()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async () => {
    try {
      const currentUser = UserService.getCurrentUser()
      if (!currentUser) {
        helper.info(strings.CONFIRM_EMAIL_ERROR)
        navigate('/sign-in')
        return
      }

      const status = await UserService.resendLink({ email })
      if (status === 200) {
        helper.info(mStrings.VALIDATION_EMAIL_SENT)
      } else {
        helper.error(null, mStrings.VALIDATION_EMAIL_ERROR)
      }
    } catch (err) {
      helper.error(err, mStrings.VALIDATION_EMAIL_ERROR)
    }
  }

  return (
    <Layout strict={false}>
      {loading && null}

      {success && (
        <div className="confirm-email">
          <Paper className="confirm-email-form" elevation={10}>
            <h1>{strings.CONFIRM_EMAIL_HEADING}</h1>
            <div className="confirm-email-form-content">
              <span>{strings.CONFIRM_EMAIL_SUCCESS}</span>
              <span className="redirect-message">{strings.REDIRECT_MESSAGE}</span>
              <p className="go-to-home">
                <Button variant="text" onClick={() => navigate('/')} className="btn-lnk">
                  {commonStrings.GO_TO_HOME}
                </Button>
              </p>
            </div>
          </Paper>
        </div>
      )}

      {expired && (
        <div className="confirm-email">
          <Paper className="confirm-email-form" elevation={10}>
            <h1>{strings.CONFIRM_EMAIL_HEADING}</h1>
            <div className="confirm-email-form-content">
              <span>{strings.CONFIRM_EMAIL_EXPIRED}</span>
              <Button type="button" variant="contained" className="btn-primary btn-resend" onClick={handleResend}>
                {mStrings.RESEND}
              </Button>
              <p className="go-to-home">
                <Button variant="text" onClick={() => navigate('/')} className="btn-lnk">
                  {commonStrings.GO_TO_HOME}
                </Button>
              </p>
            </div>
          </Paper>
        </div>
      )}

      {!loading && noMatch && <NoMatch hideHeader />}

      {(success || expired) && <Footer />}
    </Layout>
  )
}

export default ConfirmEmail
