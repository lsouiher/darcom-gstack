import React, { useEffect, useState } from 'react'
import {
  Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography,
  Button, Chip, Stack, CircularProgress, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, DialogContentText,
} from '@mui/material'
import * as darywinTypes from ':darywin-types'
import Layout from '@/components/Layout'
import { strings } from '@/lang/host-onboarding'
import * as HostAdminService from '@/services/HostAdminService'

const flagLabel = (flag: string): string => {
  if (flag === 'duplicate_address') return strings.FLAG_DUPLICATE_ADDRESS
  return flag
}

const PendingReviewAgencies = () => {
  const [rows, setRows] = useState<darywinTypes.PendingReviewAgency[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<darywinTypes.PendingReviewAgency | null>(null)
  const [approving, setApproving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setRows(await HostAdminService.listPendingReview())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const confirmApprove = async () => {
    if (!confirming) return
    setApproving(true)
    try {
      await HostAdminService.approveFirstPayout(confirming._id)
      setConfirming(null)
      await load()
    } finally {
      setApproving(false)
    }
  }

  return (
    <Layout strict>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>{strings.PENDING_REVIEW}</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : rows.length === 0 ? (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">{strings.PENDING_REVIEW_EMPTY}</Typography>
          </Paper>
        ) : (
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agency</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell>{r.fullName}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {(r.flags || []).map((f) => (
                          <Chip key={f} label={flagLabel(f)} color="warning" size="small" />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="contained" onClick={() => setConfirming(r)}>
                        {strings.APPROVE_FIRST_PAYOUT}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>

      <Dialog open={!!confirming} onClose={() => !approving && setConfirming(null)}>
        <DialogTitle>{strings.APPROVE_CONFIRM_TITLE}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirming ? (strings.formatString(strings.APPROVE_CONFIRM_BODY, confirming.fullName) as string) : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)} disabled={approving}>Cancel</Button>
          <Button onClick={confirmApprove} disabled={approving} variant="contained">{strings.APPROVE_CONFIRM}</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default PendingReviewAgencies
