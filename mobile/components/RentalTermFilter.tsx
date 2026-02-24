import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import * as darywinTypes from ':darywin-types'
import * as darywinHelper from ':darywin-helper'

import i18n from '@/lang/i18n'
import Accordion from './Accordion'
import Link from './Link'
import Switch from './Switch'

interface RentalTermFilterProps {
  visible?: boolean
  style?: object
  onChange?: (values: darywinTypes.RentalTerm[]) => void
}

const allRentalTerms = darywinHelper.getAllRentalTerms()

const RentalTermFilter = ({
  visible,
  style,
  onChange
}: RentalTermFilterProps) => {
  const [values, setValues] = useState<darywinTypes.RentalTerm[]>([])
  const [monthly, setMonthly] = useState(false)
  const [weekly, setWeekly] = useState(false)
  const [daily, setDaily] = useState(false)
  const [yearly, setYearly] = useState(false)

  const [allChecked, setAllChecked] = useState(false)

  const handleChange = (_values: darywinTypes.RentalTerm[]) => {
    if (onChange) {
      onChange(_values.length === 0 ? allRentalTerms : darywinHelper.clone(_values))
    }
  }

  const onValueChangeMonthly = (checked: boolean) => {
    if (checked) {
      values.push(darywinTypes.RentalTerm.Monthly)

      if (values.length === 4) {
        setAllChecked(true)
      }
    } else {
      values.splice(
        values.findIndex((v) => v === darywinTypes.RentalTerm.Monthly),
        1,
      )

      if (values.length === 0) {
        setAllChecked(false)
      }
    }

    setMonthly(checked)
    setValues(values)
    handleChange(values)
  }

  const onValueChangeWeekly = (checked: boolean) => {
    if (checked) {
      values.push(darywinTypes.RentalTerm.Weekly)

      if (values.length === 4) {
        setAllChecked(true)
      }
    } else {
      values.splice(
        values.findIndex((v) => v === darywinTypes.RentalTerm.Weekly),
        1,
      )

      if (values.length === 0) {
        setAllChecked(false)
      }
    }

    setWeekly(checked)
    setValues(values)
    handleChange(values)
  }

  const onValueChangeDaily = (checked: boolean) => {
    if (checked) {
      values.push(darywinTypes.RentalTerm.Daily)

      if (values.length === 4) {
        setAllChecked(true)
      }
    } else {
      values.splice(
        values.findIndex((v) => v === darywinTypes.RentalTerm.Daily),
        1,
      )

      if (values.length === 0) {
        setAllChecked(false)
      }
    }

    setDaily(checked)
    setValues(values)
    handleChange(values)
  }

  const onValueChangeYearly = (checked: boolean) => {
    if (checked) {
      values.push(darywinTypes.RentalTerm.Yearly)

      if (values.length === 4) {
        setAllChecked(true)
      }
    } else {
      values.splice(
        values.findIndex((v) => v === darywinTypes.RentalTerm.Yearly),
        1,
      )

      if (values.length === 0) {
        setAllChecked(false)
      }
    }

    setYearly(checked)
    setValues(values)
    handleChange(values)
  }

  return (
    visible && (
      <View style={{ ...styles.container, ...style }}>
        <Accordion style={styles.accordion} title={i18n.t('RENTAL_TERM')}>
          <View style={styles.contentContainer}>
            <Switch
              style={styles.component}
              textStyle={styles.text}
              value={monthly}
              label={i18n.t('MONTHLY')}
              onValueChange={onValueChangeMonthly}
            />
            <Switch
              style={styles.component}
              textStyle={styles.text}
              value={weekly}
              label={i18n.t('WEEKLY')}
              onValueChange={onValueChangeWeekly}
            />
            <Switch
              style={styles.component}
              textStyle={styles.text}
              value={daily}
              label={i18n.t('DAILY')}
              onValueChange={onValueChangeDaily}
            />
            <Switch
              style={styles.component}
              textStyle={styles.text}
              value={yearly}
              label={i18n.t('YEARLY')}
              onValueChange={onValueChangeYearly}
            />
          </View>
          <Link
            style={styles.link}
            textStyle={styles.linkText}
            label={allChecked ? i18n.t('UNCHECK_ALL') : i18n.t('CHECK_ALL')}
            onPress={() => {
              if (allChecked) {
                setMonthly(false)
                setWeekly(false)
                setDaily(false)
                setYearly(false)
                setValues([])
                setAllChecked(false)
              } else {
                setMonthly(true)
                setWeekly(true)
                setDaily(true)
                setYearly(true)
                setValues(allRentalTerms)
                setAllChecked(true)
                if (onChange) {
                  onChange(darywinHelper.clone(allRentalTerms))
                }
              }
            }}
          />
        </Accordion>
      </View>
    )
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  accordion: {
    width: '100%',
    maxWidth: 480,
  },
  component: {
    marginTop: 0,
  },
  text: {
    fontSize: 12,
  },
  link: {
    marginTop: 10,
  },
  linkText: {
    fontSize: 12,
  },
})

export default RentalTermFilter
