import React from 'react'
import { Button, Box, Typography, Stack, Container } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { strings } from '@/lang/host-signup'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'

const steps = [
  { n: '01', tKey: 'STEP_01' },
  { n: '02', tKey: 'STEP_02' },
  { n: '03', tKey: 'STEP_03' },
] as const

const BecomeAHost = () => {
  const navigate = useNavigate()

  return (
    <Layout strict={false}>
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
              {strings.LANDING_HEADLINE}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              {strings.LANDING_SUB}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/signup/host')}
                sx={{ minWidth: 200 }}
              >
                {strings.PRIMARY_CTA}
              </Button>
              <Button component={Link} to="/sign-in" variant="text" size="large">
                {strings.ALREADY_A_HOST}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              {strings.HOW_IT_WORKS}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 3, md: 4 }}>
              {steps.map((s) => (
                <Box key={s.n} sx={{ flex: 1 }}>
                  <Typography variant="overline" sx={{ fontFamily: 'monospace', color: 'primary.main', fontSize: '1rem' }}>
                    {s.n}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
                    {(strings as unknown as Record<string, string>)[`${s.tKey}_TITLE`]}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {(strings as unknown as Record<string, string>)[`${s.tKey}_BODY`]}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ bgcolor: 'action.hover', p: 3, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {strings.TRUST_LINE}
            </Typography>
          </Box>

          <noscript>
            <Typography>Email us to sign up.</Typography>
          </noscript>
        </Stack>
      </Container>
      <Footer />
    </Layout>
  )
}

export default BecomeAHost
