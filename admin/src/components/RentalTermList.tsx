import React, { useState, useEffect } from 'react'
import {
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import * as darywinTypes from ':darywin-types'
import { strings } from '@/lang/rental-term'

interface RentalTermListProps {
  value?: string
  required?: boolean
  label?: string
  variant?: 'filled' | 'standard' | 'outlined'
  onChange?: (value: string) => void
}

const RentalTermList = ({
  value: rentalTermValue,
  required,
  label,
  variant,
  onChange
}: RentalTermListProps) => {
  const [value, setValue] = useState(rentalTermValue || '')
  useEffect(() => {
    setValue(rentalTermValue || '')
  }, [rentalTermValue])

  const handleChange = (e: SelectChangeEvent<string>) => {
    const _value = e.target.value || ''
    setValue(_value)

    if (onChange) {
      onChange(_value)
    }
  }

  return (
    <div>
      <InputLabel className={required ? 'required' : ''}>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={handleChange}
        variant={variant || 'standard'}
        required={required}
        fullWidth
      >
        <MenuItem value={darywinTypes.RentalTerm.Monthly}>{strings.MONTHLY}</MenuItem>
        <MenuItem value={darywinTypes.RentalTerm.Weekly}>{strings.WEEKLY}</MenuItem>
        <MenuItem value={darywinTypes.RentalTerm.Daily}>{strings.DAILY}</MenuItem>
        <MenuItem value={darywinTypes.RentalTerm.Yearly}>{strings.YEARLY}</MenuItem>
      </Select>
    </div>
  )
}

export default RentalTermList
