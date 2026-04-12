import React, { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Typography, Link as MuiLink } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/unauthorized'

interface UnauthorizedProps {
  style?: CSSProperties
}

const Unauthorized = ({ style }: UnauthorizedProps) => {
  const navigate = useNavigate()

  return (
    <Box
      component="main"
      role="main"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: { xs: 2, md: 4 },
        minHeight: '60vh',
        gap: 2,
        ...style,
      }}
    >
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
        {strings.UNAUTHORIZED}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
        {strings.UNAUTHORIZED_DESCRIPTION}
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/')} sx={{ mt: 1 }}>
        {commonStrings.GO_TO_HOME}
      </Button>
      <MuiLink
        component="button"
        type="button"
        onClick={() => navigate('/contact')}
        sx={{ mt: 1 }}
      >
        {strings.CONTACT_SUPPORT}
      </MuiLink>
    </Box>
  )
}

export default Unauthorized
