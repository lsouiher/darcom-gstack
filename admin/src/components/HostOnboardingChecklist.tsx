import React, { useEffect, useState } from 'react'
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  CircularProgress,
  Box,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { Link } from 'react-router-dom'
import * as darywinTypes from ':darywin-types'
import { strings } from '@/lang/host-onboarding'
import * as OnboardingService from '@/services/OnboardingService'

const itemLabel = (key: darywinTypes.OnboardingChecklistItem['key']): string => ({
  phone: strings.ITEM_PHONE,
  email: strings.ITEM_EMAIL,
  property: strings.ITEM_PROPERTY,
  payout: strings.ITEM_PAYOUT,
  booking: strings.ITEM_BOOKING,
} as const)[key]

const itemCta = (item: darywinTypes.OnboardingChecklistItem): { label: string; to: string } | null => {
  if (item.done || !item.cta) return null
  if (item.key === 'property') return { label: strings.CTA_ADD_PROPERTY, to: item.cta }
  if (item.key === 'payout') return { label: strings.CTA_SETUP_PAYOUT, to: item.cta }
  return null
}

const HostOnboardingChecklist = () => {
  const [data, setData] = useState<darywinTypes.OnboardingChecklistResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true); setError(false)
    try {
      setData(await OnboardingService.getOnboardingChecklist())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error" sx={{ mb: 2 }}>{strings.CHECKLIST_LOAD_ERROR}</Typography>
        <Button onClick={load} variant="outlined">{strings.RETRY}</Button>
      </Paper>
    )
  }

  if (!data || data.step === darywinTypes.OnboardingStep.Done) return null

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{strings.CHECKLIST_TITLE}</Typography>
      <List>
        {data.items.map((item) => {
          const cta = itemCta(item)
          return (
            <ListItem
              key={item.key}
              secondaryAction={cta && (
                <Button component={Link} to={cta.to} size="small" variant="outlined">{cta.label}</Button>
              )}
            >
              <ListItemIcon>
                {item.done
                  ? <CheckCircleIcon color="success" />
                  : <RadioButtonUncheckedIcon color="disabled" />}
              </ListItemIcon>
              <ListItemText primary={itemLabel(item.key)} />
            </ListItem>
          )
        })}
      </List>
    </Paper>
  )
}

export default HostOnboardingChecklist
