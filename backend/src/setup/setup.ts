import 'dotenv/config'
import * as darywinTypes from ':darywin-types'
import * as env from '../config/env.config'
import * as databaseHelper from '../utils/databaseHelper'
import User from '../models/User'
import Country from '../models/Country'
import Location from '../models/Location'
import LocationValue from '../models/LocationValue'
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

  process.exit(0)
} catch (err) {
  logger.error('Error during setup:', err)
  process.exit(1)
}
