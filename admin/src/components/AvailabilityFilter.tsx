import React, { useState, useEffect, useRef } from 'react'
import * as darywinTypes from ':darywin-types'
import * as darywinHelper from ':darywin-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/properties'
import Accordion from './Accordion'
import * as helper from '@/utils/helper'

import '@/assets/css/availability-filter.css'

interface AvailabilityFilterProps {
  className?: string
  onChange?: (values: darywinTypes.Availablity[]) => void
}

const allValues = [
  darywinTypes.Availablity.Available,
  darywinTypes.Availablity.Unavailable
]

const AvailabilityFilter = ({
  className,
  onChange
}: AvailabilityFilterProps) => {
  const [allChecked, setAllChecked] = useState(false)
  const [values, setValues] = useState<darywinTypes.Availablity[]>([])

  const availableRef = useRef<HTMLInputElement>(null)
  const unavailableRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (allChecked && availableRef.current && unavailableRef.current) {
      availableRef.current.checked = true
      unavailableRef.current.checked = true
    }
  }, [allChecked])

  const handleChange = (_values: darywinTypes.Availablity[]) => {
    if (onChange) {
      onChange(_values.length === 0 ? allValues : darywinHelper.clone(_values))
    }
  }

  const handleAvailableChange = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement>) => {
    if (e.currentTarget instanceof HTMLInputElement) {
      if (e.currentTarget.checked) {
        values.push(darywinTypes.Availablity.Available)

        if (values.length === 2) {
          setAllChecked(true)
        }
      } else {
        values.splice(
          values.findIndex((v) => v === darywinTypes.Availablity.Available),
          1,
        )

        if (values.length === 0) {
          setAllChecked(false)
        }
      }

      setValues(values)

      handleChange(values)
    } else {
      helper.error()
    }
  }

  const handleAvailableClick = (e: React.MouseEvent<HTMLElement>) => {
    const checkbox = e.currentTarget.previousSibling as HTMLInputElement
    checkbox.checked = !checkbox.checked
    const event = e
    event.currentTarget = checkbox
    handleAvailableChange(event)
  }

  const handleUnavailableChange = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement>) => {
    if (e.currentTarget instanceof HTMLInputElement) {
      if (e.currentTarget.checked) {
        values.push(darywinTypes.Availablity.Unavailable)

        if (values.length === 2) {
          setAllChecked(true)
        }
      } else {
        values.splice(
          values.findIndex((v) => v === darywinTypes.Availablity.Unavailable),
          1,
        )

        if (values.length === 0) {
          setAllChecked(false)
        }
      }

      setValues(values)

      handleChange(values)
    } else {
      helper.error()
    }
  }

  const handleUnavailableClick = (e: React.MouseEvent<HTMLElement>) => {
    const checkbox = e.currentTarget.previousSibling as HTMLInputElement
    checkbox.checked = !checkbox.checked
    const event = e
    event.currentTarget = checkbox
    handleUnavailableChange(event)
  }

  const handleUncheckAllChange = () => {
    if (availableRef.current && unavailableRef.current) {
      if (allChecked) {
        // uncheck all
        availableRef.current.checked = false
        unavailableRef.current.checked = false

        setAllChecked(false)
        setValues([])
      } else {
        // check all
        availableRef.current.checked = true
        unavailableRef.current.checked = true

        const _values = [darywinTypes.Availablity.Available, darywinTypes.Availablity.Unavailable]

        setAllChecked(true)
        setValues(_values)

        if (onChange) {
          onChange(darywinHelper.clone(_values))
        }
      }
    } else {
      helper.error()
    }
  }

  return (
    <Accordion title={strings.AVAILABILITY} className={`${className ? `${className} ` : ''}availability-filter`}>
      <div className="filter-elements">
        <div className="filter-element">
          <input ref={availableRef} type="checkbox" className="availability-checkbox" onChange={handleAvailableChange} />
          <span role="button" tabIndex={0} onClick={handleAvailableClick}>{strings.AVAILABLE}</span>
        </div>
        <div className="filter-element">
          <input ref={unavailableRef} type="checkbox" className="availability-checkbox" onChange={handleUnavailableChange} />
          <span role="button" tabIndex={0} onClick={handleUnavailableClick}>{strings.UNAVAILABLE}</span>
        </div>
        <div className="filter-actions">
          <span role="button" tabIndex={0} onClick={handleUncheckAllChange} className="uncheckall">
            {allChecked ? commonStrings.UNCHECK_ALL : commonStrings.CHECK_ALL}
          </span>
        </div>
      </div>
    </Accordion>
  )
}

export default AvailabilityFilter
