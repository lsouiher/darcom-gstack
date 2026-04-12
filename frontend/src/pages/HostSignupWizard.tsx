import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  LinearProgress,
  Alert,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import validator from 'validator'
import * as darywinTypes from ':darywin-types'
import { strings } from '@/lang/host-signup'
import * as HostSignupService from '@/services/HostSignupService'
import LocationSelectList from '@/components/LocationSelectList'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'

type Step = 'phone' | 'otp' | 'details' | 'teaser'

const TOTAL_STEPS = 4
const stepIndex: Record<Step, number> = { phone: 1, otp: 2, details: 3, teaser: 4 }

const mapError = (status: number): string => {
  if (status === 409) return strings.GENERIC_CONFLICT
  if (status === 429) return strings.RATE_LIMITED
  if (status === 400) return strings.SIGNUP_ERROR
  if (status === 503) return strings.SERVICE_UNAVAILABLE
  if (status === 410) return strings.SESSION_EXPIRED
  return strings.SIGNUP_ERROR
}

const HostSignupWizard = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [phone, setPhone] = useState('')
  const [channel, setChannel] = useState<darywinTypes.OtpChannel | null>(null)
  const [code, setCode] = useState('')
  const [otpRemaining, setOtpRemaining] = useState<number | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [locationId, setLocationId] = useState<string>('')

  const [teaserName, setTeaserName] = useState('')
  const [teaserAddress, setTeaserAddress] = useState('')
  const [teaserPrice, setTeaserPrice] = useState('')

  useEffect(() => {
    // Attempt resume: if server already has session cookie, advance.
    HostSignupService.current()
      .then((s) => {
        if (s.phoneVerified) setStep('details')
        if (s.channel) setChannel(s.channel)
      })
      .catch(() => { /* no session, start fresh */ })
  }, [])

  const handleStart = async () => {
    setError(null); setLoading(true)
    try {
      const r = await HostSignupService.start({ phone })
      setChannel(r.channel || null)
      setStep('otp')
    } catch (e: unknown) {
      const status = (e as { response?: { status: number } }).response?.status ?? 0
      setError(mapError(status))
    } finally { setLoading(false) }
  }

  const handleVerify = async () => {
    setError(null); setLoading(true)
    try {
      await HostSignupService.verifyPhone({ code })
      setStep('details')
    } catch (e: unknown) {
      const resp = (e as { response?: { status: number; data?: { code?: string; remaining?: number } } }).response
      if (resp?.data?.code === 'OTP_WRONG' && typeof resp.data.remaining === 'number') {
        setOtpRemaining(resp.data.remaining)
        setError(strings.formatString(strings.OTP_WRONG, String(resp.data.remaining)) as string)
      } else if (resp?.status === 429) {
        setError(strings.OTP_EXHAUSTED)
      } else {
        setError(mapError(resp?.status ?? 0))
      }
    } finally { setLoading(false) }
  }

  const handleDetails = async () => {
    setError(null)
    if (!validator.isEmail(email)) { setError(strings.SIGNUP_ERROR); return }
    if (password.length < 8) { setError(strings.WEAK_PASSWORD); return }
    if (!agencyName.trim() || !locationId) { setError(strings.SIGNUP_ERROR); return }
    setLoading(true)
    try {
      await HostSignupService.submitDetails({ email, password, agencyName, locationId })
      setStep('teaser')
    } catch (e: unknown) {
      setError(mapError((e as { response?: { status: number } }).response?.status ?? 0))
    } finally { setLoading(false) }
  }

  const handleComplete = async (withTeaser: boolean) => {
    setError(null); setLoading(true)
    try {
      const payload: darywinTypes.HostSignupCompletePayload = withTeaser && teaserName && teaserAddress && teaserPrice
        ? { teaserProperty: { name: teaserName, address: teaserAddress, price: Number(teaserPrice) } }
        : {}
      const r = await HostSignupService.complete(payload)
      // Redirect to admin app with the JWT — admin reads it via ?token=
      const adminHost = window.location.origin.replace(/:\d+/, ':3003')
      window.location.href = `${adminHost}/?signup-token=${encodeURIComponent(r.token || '')}`
    } catch (e: unknown) {
      setError(mapError((e as { response?: { status: number } }).response?.status ?? 0))
    } finally { setLoading(false) }
  }

  const progress = (stepIndex[step] / TOTAL_STEPS) * 100

  return (
    <Layout strict={false}>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {strings.formatString(strings.STEP_OF, String(stepIndex[step]), String(TOTAL_STEPS))}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            role="progressbar"
            aria-valuenow={stepIndex[step]}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} role="alert">{error}</Alert>}

        <Box aria-live="polite">
          {step === 'phone' && (
            <Stack spacing={2}>
              <Typography variant="h5">{strings.PHONE_LABEL}</Typography>
              <TextField
                label={strings.PHONE_LABEL}
                helperText={strings.PHONE_HELPER}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
                autoFocus
                inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
              />
              <Button variant="contained" size="large" onClick={handleStart} disabled={loading || !phone}>
                {strings.SEND_CODE}
              </Button>
            </Stack>
          )}

          {step === 'otp' && (
            <Stack spacing={2}>
              <Typography variant="h5">{strings.OTP_LABEL}</Typography>
              <Typography variant="body2" color="text.secondary">
                {channel === darywinTypes.OtpChannel.WhatsApp ? strings.OTP_HELPER_WA : strings.OTP_HELPER_SMS}
              </Typography>
              <TextField
                label={strings.OTP_LABEL}
                value={code}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(v)
                  if (v.length === 6) { /* auto-submit */ setTimeout(handleVerify, 0) }
                }}
                fullWidth
                autoFocus
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  autoComplete: 'one-time-code',
                  maxLength: 6,
                }}
              />
              <Stack direction="row" spacing={1}>
                <Button onClick={() => setStep('phone')}>{strings.BACK}</Button>
                <Button variant="contained" onClick={handleVerify} disabled={loading || code.length < 6}>
                  {strings.CONTINUE}
                </Button>
              </Stack>
              {otpRemaining !== null && otpRemaining > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {strings.formatString(strings.OTP_WRONG, String(otpRemaining))}
                </Typography>
              )}
            </Stack>
          )}

          {step === 'details' && (
            <Stack spacing={2}>
              <Typography variant="h5">{strings.EMAIL_LABEL}</Typography>
              <TextField label={strings.EMAIL_LABEL} value={email} onChange={(e) => setEmail(e.target.value)} fullWidth type="email" autoFocus />
              <TextField label={strings.PASSWORD_LABEL} value={password} onChange={(e) => setPassword(e.target.value)} fullWidth type="password" />
              <TextField label={strings.AGENCY_NAME_LABEL} value={agencyName} onChange={(e) => setAgencyName(e.target.value)} fullWidth />
              <LocationSelectList
                label={strings.LOCATION_LABEL}
                required
                onChange={(vals) => setLocationId(vals[0]?._id || '')}
              />
              <Typography variant="caption" color="text.secondary">{strings.OWNERSHIP_NOTICE}</Typography>
              <Stack direction="row" spacing={1}>
                <Button onClick={() => setStep('otp')}>{strings.BACK}</Button>
                <Button variant="contained" onClick={handleDetails} disabled={loading}>{strings.CONTINUE}</Button>
              </Stack>
            </Stack>
          )}

          {step === 'teaser' && (
            <Stack spacing={2}>
              <Typography variant="h5">{strings.TEASER_TITLE}</Typography>
              <Typography variant="body2" color="text.secondary">{strings.TEASER_HELPER}</Typography>
              <TextField label="Name" value={teaserName} onChange={(e) => setTeaserName(e.target.value)} fullWidth />
              <TextField label="Address" value={teaserAddress} onChange={(e) => setTeaserAddress(e.target.value)} fullWidth />
              <TextField label="Price" value={teaserPrice} onChange={(e) => setTeaserPrice(e.target.value)} fullWidth type="number" />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="outlined" size="large" onClick={() => handleComplete(false)} disabled={loading} sx={{ flex: 1 }}>
                  {strings.SKIP_FOR_LATER}
                </Button>
                <Button variant="contained" size="large" onClick={() => handleComplete(true)} disabled={loading || !teaserName || !teaserAddress || !teaserPrice} sx={{ flex: 1 }}>
                  {strings.ADD_PROPERTY_NOW}
                </Button>
              </Stack>
              <Button onClick={() => setStep('details')}>{strings.BACK}</Button>
            </Stack>
          )}
        </Box>
      </Container>
      <Footer />
    </Layout>
  )
}

export default HostSignupWizard
