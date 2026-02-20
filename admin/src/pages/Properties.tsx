import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import * as darywinTypes from ':darywin-types'
import * as darywinHelper from ':darywin-helper'
import * as helper from '@/utils/helper'
import { strings } from '@/lang/properties'
import { strings as commonStrings } from '@/lang/common'
import Layout from '@/components/Layout'
import AgencyFilter from '@/components/AgencyFilter'
import Search from '@/components/Search'
import InfoBox from '@/components/InfoBox'
import PropertyTypeFilter from '@/components/PropertyTypeFilter'
import AvailabilityFilter from '@/components/AvailabilityFilter'
import PropertyList from '@/components/PropertyList'
import * as AgencyService from '@/services/AgencyService'
import RentalTermFilter from '@/components/RentalTermFilter'
import env from '@/config/env.config'

import '@/assets/css/properties.css'

const Properties = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState<darywinTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [allAgencies, setAllAgencies] = useState<darywinTypes.User[]>([])
  const [agencies, setAgencies] = useState<string[]>()
  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [propertyTypes, setPropertyTypes] = useState(darywinHelper.getAllPropertyTypes())
  const [rentalTerms, setRentalTerms] = useState(darywinHelper.getAllRentalTerms())
  const [availability, setAvailability] = useState(
    [
      darywinTypes.Availablity.Available,
      darywinTypes.Availablity.Unavailable
    ]
  )

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handlePropertyListLoad: darywinTypes.DataEvent<darywinTypes.Property> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  const handlePropertyDelete = (_rowCount: number) => {
    setRowCount(_rowCount)
  }

  const handleAgencyFilterChange = (newAgencies: string[]) => {
    setAgencies(newAgencies)
  }

  const handlePropertyTypeFilterChange = (values: darywinTypes.PropertyType[]) => {
    setPropertyTypes(values)
  }

  const handleRentalTermFilterChange = (values: darywinTypes.RentalTerm[]) => {
    setRentalTerms(values)
  }

  const handleAvailabilityFilterChange = (values: darywinTypes.Availablity[]) => {
    setAvailability(values)
  }

  const onLoad = async (_user?: darywinTypes.User) => {
    setUser(_user)
    const _isAdmin = helper.admin(_user)
    setAdmin(_isAdmin)
    if (_isAdmin) {
      const _allAgencies = await AgencyService.getAllAgencies()
      const _agencies = darywinHelper.flattenAgencies(_allAgencies)
      setAllAgencies(_allAgencies)
      setAgencies(_agencies)
    } else {
      const agencyId = (_user && _user._id) as string
      setAgencies([agencyId])
    }
    setLoading(false)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="properties">
          <div className="col-1">
            <div className="col-1-container">
              <Search onSubmit={handleSearch} className="search" />

              <Button type="submit" variant="contained" className="btn-primary new-property" size="small" onClick={() => navigate('/create-property')}>
                {strings.NEW_PROPERTY}
              </Button>

              {rowCount > 0 && <InfoBox value={`${rowCount} ${rowCount > 1 ? commonStrings.PROPERTIES : commonStrings.PROPERTY}`} className="property-count" />}

              {admin && (
                <AgencyFilter
                  agencies={allAgencies}
                  onChange={handleAgencyFilterChange}
                  className="filter"
                />
              )}

              {rowCount > -1 && (
                <>
                  <PropertyTypeFilter
                    className="property-filter"
                    onChange={handlePropertyTypeFilterChange}
                  />
                  <RentalTermFilter
                    className="rental-term-filter"
                    onChange={handleRentalTermFilterChange}
                  />
                  {
                    admin
                    && (
                      <AvailabilityFilter
                        className="property-filter"
                        onChange={handleAvailabilityFilterChange}
                      />
                    )
                  }
                </>
              )}
            </div>
          </div>
          <div className="col-2">
            <PropertyList
              user={user}
              agencies={agencies}
              types={propertyTypes}
              rentalTerms={rentalTerms}
              availability={availability}
              keyword={keyword}
              loading={loading}
              language={user.language || env.DEFAULT_LANGUAGE}
              onLoad={handlePropertyListLoad}
              onDelete={handlePropertyDelete}
            />
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Properties
