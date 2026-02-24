import React, { useEffect, useState } from 'react'
import { FormControl, FormControlLabel, Switch } from '@mui/material'
import { EventSeat as BookingIcon, } from '@mui/icons-material'
import * as darywinTypes from ':darywin-types'
import * as darywinHelper from ':darywin-helper'
import { strings as csStrings } from '@/lang/properties'
import { strings } from '@/lang/checkout'
import * as helper from '@/utils/helper'
import * as PaymentService from '@/services/PaymentService'

import '@/assets/css/checkout-options.css'

interface CheckoutOptionsProps {
  property: darywinTypes.Property
  from: Date
  to: Date
  language: string
  clientSecret: string | null
  payPalLoaded: boolean
  onPriceChange: (value: number) => void
  onCancellationChange: (value: boolean) => void
}

const CheckoutOptions = ({
  property,
  from,
  to,
  language,
  clientSecret,
  payPalLoaded,
  onPriceChange,
  onCancellationChange,
}: CheckoutOptionsProps) => {
  const [cancellation, setCancellation] = useState(false)
  const [cancellationOption, setCancellationOption] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrices = async () => {
      setCancellationOption(await helper.getCancellationOption(property.cancellation, language))
      setLoading(false)
    }

    fetchPrices()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return null
  }

  const handleCancellationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (property && from && to) {
      const _cancellation = e.target.checked
      const options: darywinTypes.PropertyOptions = {
        cancellation: _cancellation
      }
      const _price = await PaymentService.convertPrice(darywinHelper.calculateTotalPrice(property, from, to, options))

      setCancellation(_cancellation)
      onCancellationChange(_cancellation)
      onPriceChange(_price)
    }
  }

  return (
    <div className="checkout-options-container">
      <div className="checkout-info">
        <BookingIcon />
        <span>{strings.BOOKING_OPTIONS}</span>
      </div>
      <div className="checkout-options">
        <FormControl fullWidth margin="dense">
          <FormControlLabel
            disabled={property.cancellation === -1 || property.cancellation === 0 || !!clientSecret || payPalLoaded}
            control={<Switch checked={cancellation} onChange={handleCancellationChange} color="primary" />}
            label={(
              <span>
                <span className="checkout-option-label">{csStrings.CANCELLATION}</span>
                <span className="checkout-option-value">{cancellationOption}</span>
              </span>
            )}
          />
        </FormControl>

      </div>
    </div>
  )
}

export default CheckoutOptions
