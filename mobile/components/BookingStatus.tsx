import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import * as darywinTypes from ':darywin-types'

import * as helper from '@/utils/helper'

interface BookingStatusProps {
  style: object
  status: darywinTypes.BookingStatus
}

const BookingStatus = ({
  style,
  status
}: BookingStatusProps) => {
  const styles = StyleSheet.create({
    container: {
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 18,
    },
    text: {
      color: status === darywinTypes.BookingStatus.Void
        ? '#6E7C86'
        : status === darywinTypes.BookingStatus.Pending
          ? '#EF6C00'
          : status === darywinTypes.BookingStatus.Deposit
            ? '#3CB371'
            : status === darywinTypes.BookingStatus.Paid
              ? '#77BC23'
              : status === darywinTypes.BookingStatus.Reserved
                ? '#1E88E5'
                : status === darywinTypes.BookingStatus.Cancelled
                  ? '#E53935'
                  : 'transparent',
      fontSize: 13,
      fontWeight: '400',
    },
  })

  return (
    <View
      style={{
        ...styles.container,
        ...style,
        backgroundColor:
          status === darywinTypes.BookingStatus.Void
            ? '#D9D9D9'
            : status === darywinTypes.BookingStatus.Pending
              ? '#FBDCC2'
              : status === darywinTypes.BookingStatus.Deposit
                ? '#CDECDA'
                : status === darywinTypes.BookingStatus.Paid
                  ? '#D1F9D1'
                  : status === darywinTypes.BookingStatus.Reserved
                    ? '#D9E7F4'
                    : status === darywinTypes.BookingStatus.Cancelled
                      ? '#FBDFDE'
                      : 'transparent',
      }}
    >
      <Text style={styles.text}>{helper.getBookingStatus(status)}</Text>
    </View>
  )
}

export default BookingStatus
