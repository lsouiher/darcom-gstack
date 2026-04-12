import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import * as darywinTypes from ':darywin-types'
import Layout from '@/components/Layout'
import { strings } from '@/lang/locations'
import Search from '@/components/Search'
import LocationList from '@/components/LocationList'
import InfoBox from '@/components/InfoBox'
import { useUserContext, UserContextType } from '@/context/UserContext'

import '@/assets/css/locations.css'

const Locations = () => {
  const navigate = useNavigate()
  const { user } = useUserContext() as UserContextType
  const isAdmin = user?.type === darywinTypes.UserType.Admin

  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(-1)

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handleLocationListLoad: darywinTypes.DataEvent<darywinTypes.Location> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  const handleLocationDelete = (_rowCount: number) => {
    setRowCount(_rowCount)
  }

  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="locations">
        <div className="col-1">
          <div className="col-1-container">
            <Search className="search" onSubmit={handleSearch} />

            {isAdmin && rowCount > -1 && (
              <Button variant="contained" className="btn-primary new-location" size="small" onClick={() => navigate('/create-location')}>
                {strings.NEW_LOCATION}
              </Button>
            )}

            {rowCount > 0
              && (
                <InfoBox
                  value={`${rowCount} ${rowCount > 1 ? strings.LOCATIONS : strings.LOCATION}`}
                  className="location-count"
                />
              )}
          </div>
        </div>
        <div className="col-2">
          <LocationList
            keyword={keyword}
            onLoad={handleLocationListLoad}
            onDelete={handleLocationDelete}
          />
        </div>
      </div>
    </Layout>
  )
}

export default Locations
