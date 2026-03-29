import 'dotenv/config'
import * as darywinTypes from ':darywin-types'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import User from '../models/User'
import Country from '../models/Country'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'
import Property from '../models/Property'
import * as logger from '../utils/logger'
import * as authHelper from '../utils/authHelper'

async function createCountry(nameEn: string, nameFr: string) {
  const countryValueEn = new LocationValue({ language: 'en', value: nameEn })
  await countryValueEn.save()

  const countryValueFr = new LocationValue({ language: 'fr', value: nameFr })
  await countryValueFr.save()

  const country = new Country({ values: [countryValueEn._id, countryValueFr._id] })
  await country.save()

  return country._id.toString()
}

async function createLocation(
  countryId: string,
  nameEn: string,
  nameFr: string,
  latitude?: number,
  longitude?: number,
) {
  const locationValueEn = new LocationValue({ language: 'en', value: nameEn })
  await locationValueEn.save()

  const locationValueFr = new LocationValue({ language: 'fr', value: nameFr })
  await locationValueFr.save()

  const location = new Location({
    country: countryId,
    values: [locationValueEn._id, locationValueFr._id],
    latitude,
    longitude,
  })
  await location.save()

  return location._id.toString()
}

async function seedLocations() {
  // Check if locations already exist
  const existingLocations = await Location.countDocuments()
  if (existingLocations > 0) {
    logger.info('Locations already exist, skipping seeding')
    return
  }

  logger.info('Seeding countries and locations...')

  // Create France
  const franceId = await createCountry('France', 'France')
  await createLocation(franceId, 'Paris', 'Paris', 48.8566, 2.3522)
  await createLocation(franceId, 'Lyon', 'Lyon', 45.764, 4.8357)
  await createLocation(franceId, 'Marseille', 'Marseille', 43.2965, 5.3698)

  // Create United States
  const usaId = await createCountry('United States', 'États-Unis')
  await createLocation(usaId, 'New York', 'New York', 40.7128, -74.006)
  await createLocation(usaId, 'Los Angeles', 'Los Angeles', 34.0522, -118.2437)
  await createLocation(usaId, 'Chicago', 'Chicago', 41.8781, -87.6298)

  // Create United Kingdom
  const ukId = await createCountry('United Kingdom', 'Royaume-Uni')
  await createLocation(ukId, 'London', 'Londres', 51.5074, -0.1278)
  await createLocation(ukId, 'Manchester', 'Manchester', 53.4808, -2.2426)
  await createLocation(ukId, 'Birmingham', 'Birmingham', 52.4862, -1.8904)

  // Create Algeria
  const algeriaId = await createCountry('Algeria', 'Algérie')
  await createLocation(algeriaId, 'Algiers', 'Alger', 36.7538, 3.0588)
  await createLocation(algeriaId, 'Oran', 'Oran', 35.6969, -0.6331)
  await createLocation(algeriaId, 'Constantine', 'Constantine', 36.365, 6.6147)
  await createLocation(algeriaId, 'Annaba', 'Annaba', 36.9, 7.7667)
  await createLocation(algeriaId, 'Setif', 'Sétif', 36.191, 5.4117)
  await createLocation(algeriaId, 'Blida', 'Blida', 36.4722, 2.8278)

  logger.info('Countries and locations seeded successfully')
}

async function seedAgenciesAndProperties() {
  const existingProperties = await Property.countDocuments()
  if (existingProperties > 0) {
    logger.info('Properties already exist, skipping seeding')
    return
  }

  const existingAgencies = await User.countDocuments({ type: darywinTypes.UserType.Agency })
  if (existingAgencies > 0) {
    logger.info('Agencies already exist, skipping seeding')
    return
  }

  logger.info('Seeding agencies and properties...')

  const passwordHash = await authHelper.hashPassword('M00vinin')

  // Find Algeria locations
  const countries = await Country.find().populate('values')
  const algeria = countries.find((c) => c.values.some((v: env.LocationValue) => v.value === 'Algeria'))

  if (!algeria) {
    logger.info('Algeria not found, skipping agency/property seeding')
    return
  }

  const algeriaLocations = await Location.find({ country: algeria._id })
  const algiers = algeriaLocations.find((l) => l.latitude === 36.7538)
  const oran = algeriaLocations.find((l) => l.latitude === 35.6969)
  const constantine = algeriaLocations.find((l) => l.latitude === 36.365)

  if (!algiers || !oran || !constantine) {
    logger.info('Algeria locations not found, skipping agency/property seeding')
    return
  }

  // Create Agency 1 - Algiers
  const agency1 = new User({
    fullName: 'Immobilier Alger',
    email: 'agency-algiers@darywin.com',
    password: passwordHash,
    language: env.DEFAULT_LANGUAGE,
    type: darywinTypes.UserType.Agency,
    active: true,
    verified: true,
    bio: 'Leading rental agency in Algiers with premium apartments and houses.',
    location: 'Algiers, Algeria',
  })
  await agency1.save()

  // Create Agency 2 - Oran
  const agency2 = new User({
    fullName: 'Oran Immobilier',
    email: 'agency-oran@darywin.com',
    password: passwordHash,
    language: env.DEFAULT_LANGUAGE,
    type: darywinTypes.UserType.Agency,
    active: true,
    verified: true,
    bio: 'Trusted property rentals in Oran and surrounding areas.',
    location: 'Oran, Algeria',
  })
  await agency2.save()

  // Properties in Algiers
  const properties = [
    {
      name: 'Modern Apartment in Hydra',
      type: darywinTypes.PropertyType.Apartment,
      agency: agency1._id,
      description: 'Spacious 3-bedroom apartment in the upscale Hydra neighborhood with panoramic views of the Bay of Algiers.',
      bedrooms: 3,
      bathrooms: 2,
      kitchens: 1,
      parkingSpaces: 1,
      size: 120,
      petsAllowed: false,
      furnished: true,
      minimumAge: 21,
      location: algiers._id,
      address: 'Rue des Frères Bouadou, Hydra, Algiers',
      latitude: 36.7471,
      longitude: 3.0308,
      price: 80000,
      rentalTerm: darywinTypes.RentalTerm.Monthly,
      aircon: true,
      available: true,
    },
    {
      name: 'Cozy Studio in Bab El Oued',
      type: darywinTypes.PropertyType.Apartment,
      agency: agency1._id,
      description: 'Affordable furnished studio near the sea, ideal for students or young professionals.',
      bedrooms: 1,
      bathrooms: 1,
      kitchens: 1,
      parkingSpaces: 0,
      size: 40,
      petsAllowed: false,
      furnished: true,
      minimumAge: 21,
      location: algiers._id,
      address: 'Boulevard Colonel Lotfi, Bab El Oued, Algiers',
      latitude: 36.7900,
      longitude: 3.0456,
      price: 35000,
      rentalTerm: darywinTypes.RentalTerm.Monthly,
      aircon: false,
      available: true,
    },
    {
      name: 'Family Villa in El Biar',
      type: darywinTypes.PropertyType.House,
      agency: agency1._id,
      description: 'Beautiful 4-bedroom villa with garden, swimming pool, and garage in the quiet El Biar district.',
      bedrooms: 4,
      bathrooms: 3,
      kitchens: 2,
      parkingSpaces: 2,
      size: 250,
      petsAllowed: true,
      furnished: true,
      minimumAge: 25,
      location: algiers._id,
      address: 'Chemin Poirson, El Biar, Algiers',
      latitude: 36.7650,
      longitude: 3.0350,
      price: 200000,
      rentalTerm: darywinTypes.RentalTerm.Monthly,
      aircon: true,
      available: true,
    },
    // Properties in Oran
    {
      name: 'Seaside Apartment in Ain El Turk',
      type: darywinTypes.PropertyType.Apartment,
      agency: agency2._id,
      description: 'Bright 2-bedroom apartment with sea view, just steps from the beach in Ain El Turk.',
      bedrooms: 2,
      bathrooms: 1,
      kitchens: 1,
      parkingSpaces: 1,
      size: 85,
      petsAllowed: false,
      furnished: true,
      minimumAge: 21,
      location: oran._id,
      address: 'Boulevard Front de Mer, Ain El Turk, Oran',
      latitude: 35.7344,
      longitude: -0.7689,
      price: 8000,
      rentalTerm: darywinTypes.RentalTerm.Daily,
      aircon: true,
      available: true,
    },
    {
      name: 'Downtown Oran Apartment',
      type: darywinTypes.PropertyType.Apartment,
      agency: agency2._id,
      description: 'Well-located 2-bedroom apartment in central Oran, close to shops and restaurants.',
      bedrooms: 2,
      bathrooms: 1,
      kitchens: 1,
      parkingSpaces: 0,
      size: 75,
      petsAllowed: false,
      furnished: true,
      minimumAge: 21,
      location: oran._id,
      address: 'Rue Larbi Ben M\'hidi, Oran Centre',
      latitude: 35.6971,
      longitude: -0.6308,
      price: 55000,
      rentalTerm: darywinTypes.RentalTerm.Monthly,
      aircon: true,
      available: true,
    },
    // Property in Constantine
    {
      name: 'Traditional House in Old City',
      type: darywinTypes.PropertyType.House,
      agency: agency1._id,
      description: 'Charming renovated traditional house in the old quarter of Constantine with rooftop terrace overlooking the gorges.',
      bedrooms: 3,
      bathrooms: 2,
      kitchens: 1,
      parkingSpaces: 0,
      size: 150,
      petsAllowed: false,
      furnished: true,
      minimumAge: 21,
      location: constantine._id,
      address: 'Vieille Ville, Constantine',
      latitude: 36.3650,
      longitude: 6.6147,
      price: 45000,
      rentalTerm: darywinTypes.RentalTerm.Monthly,
      aircon: false,
      available: true,
    },
  ]

  for (const propertyData of properties) {
    const property = new Property(propertyData)
    await property.save()
  }

  logger.info('Agencies and properties seeded successfully')
}

try {
  const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)

  if (!connected) {
    logger.error('Failed to connect to the database')
    process.exit(1)
  }

  // create admin user if it doesn't exist
  const adminUser = await User.findOne({ email: env.ADMIN_EMAIL })

  if (!adminUser) {
    const password = 'M00vinin'
    const passwordHash = await authHelper.hashPassword(password)

    const newAdmin = new User({
      fullName: 'admin',
      email: env.ADMIN_EMAIL,
      password: passwordHash,
      language: env.DEFAULT_LANGUAGE,
      type: darywinTypes.UserType.Admin,
      active: true,
      verified: true,
    })
    await newAdmin.save()
    logger.info('Admin user created successfully')
  } else {
    logger.info('Admin user already exists')
  }

  // Seed Countries and Locations
  await seedLocations()

  // Seed Agencies and Properties
  await seedAgenciesAndProperties()

  process.exit(0)
} catch (err) {
  logger.error('Error during setup:', err)
  process.exit(1)
}
