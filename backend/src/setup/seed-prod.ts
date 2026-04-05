import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import axios from 'axios'
import { nanoid } from 'nanoid'
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface SeedProperty {
  name: string
  type: string
  description: string
  bedrooms: number
  bathrooms: number
  kitchens: number
  parkingSpaces: number
  size: number
  petsAllowed: boolean
  furnished: boolean
  minimumAge: number
  address: string
  latitude: number
  longitude: number
  price: number
  rentalTerm: string
  aircon: boolean
  imageUrl?: string
}

interface SeedAgency {
  fullName: string
  email: string
  phone: string
  bio: string
  locationLabel: string
  locationMatch: string
  logoColor: string
  properties: SeedProperty[]
}

interface SeedData {
  agencies: SeedAgency[]
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
    fs.writeFileSync(destPath, response.data)
    return true
  } catch (err) {
    logger.error(`Failed to download image: ${url}`, err)
    return false
  }
}

function generateLogoPng(text: string, bgColor: string): Buffer {
  const width = 60
  const height = 30

  const r = parseInt(bgColor.slice(1, 3), 16)
  const g = parseInt(bgColor.slice(3, 5), 16)
  const b = parseInt(bgColor.slice(5, 7), 16)

  const rawData = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    rawData[i * 4] = r
    rawData[i * 4 + 1] = g
    rawData[i * 4 + 2] = b
    rawData[i * 4 + 3] = 255
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8
  ihdrData[9] = 6
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = createPngChunk('IHDR', ihdrData)

  const filteredData = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    filteredData[y * (1 + width * 4)] = 0
    rawData.copy(
      filteredData,
      y * (1 + width * 4) + 1,
      y * width * 4,
      (y + 1) * width * 4,
    )
  }

  const compressed = deflateSync(filteredData)
  const idat = createPngChunk('IDAT', compressed)
  const iend = createPngChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function createPngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const typeBuffer = Buffer.from(type, 'ascii')
  const crcInput = Buffer.concat([typeBuffer, data])

  let crc = 0xFFFFFFFF
  for (let i = 0; i < crcInput.length; i++) {
    crc ^= crcInput[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  crc ^= 0xFFFFFFFF

  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc >>> 0, 0)

  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

const ALGERIA_LOCATIONS: Record<string, { fr: string, lat: number, lon: number }> = {
  Algiers: { fr: 'Alger', lat: 36.7538, lon: 3.0588 },
  Oran: { fr: 'Oran', lat: 35.6969, lon: -0.6331 },
  Constantine: { fr: 'Constantine', lat: 36.365, lon: 6.6147 },
  Annaba: { fr: 'Annaba', lat: 36.9, lon: 7.7667 },
  Setif: { fr: 'Sétif', lat: 36.191, lon: 5.4117 },
  Blida: { fr: 'Blida', lat: 36.4722, lon: 2.8278 },
}

async function ensureAlgeriaLocations() {
  // Check if Algeria country exists
  const countries = await Country.find().populate('values')
  let algeria = countries.find((c) => {
    const values = c.values as unknown as env.LocationValue[]
    return values.some((v) => v.value === 'Algeria')
  })

  if (!algeria) {
    logger.info('Creating Algeria country and locations...')
    const enVal = new LocationValue({ language: 'en', value: 'Algeria' })
    await enVal.save()
    const frVal = new LocationValue({ language: 'fr', value: 'Algérie' })
    await frVal.save()
    algeria = new Country({ values: [enVal._id, frVal._id] })
    await algeria.save()
  }

  for (const [nameEn, info] of Object.entries(ALGERIA_LOCATIONS)) {
    const existing = await findLocationByName(nameEn)
    if (!existing) {
      const enVal = new LocationValue({ language: 'en', value: nameEn })
      await enVal.save()
      const frVal = new LocationValue({ language: 'fr', value: info.fr })
      await frVal.save()
      const loc = new Location({
        country: algeria._id,
        values: [enVal._id, frVal._id],
        latitude: info.lat,
        longitude: info.lon,
      })
      await loc.save()
      logger.info(`Created location: ${nameEn}`)
    }
  }
}

async function findLocationByName(name: string) {
  const locations = await Location.find().populate('values')
  return locations.find((loc) => {
    const values = loc.values as unknown as env.LocationValue[]
    return values.some((v) => v.value === name)
  })
}

async function ensureCdnDirs() {
  const dirs = [env.CDN_USERS, env.CDN_PROPERTIES]
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      logger.info(`Created CDN directory: ${dir}`)
    }
  }
}

try {
  const connected = await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)

  if (!connected) {
    logger.error('Failed to connect to the database')
    process.exit(1)
  }

  // Load seed data (resolve from project root, not dist)
  const projectRoot = path.resolve(__dirname, '..', '..', '..')
  const seedDataPath = path.join(projectRoot, 'src', 'setup', 'prod-seed-data.json')
  const seedData: SeedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'))

  // Check if agencies already exist
  const existingAgencies = await User.countDocuments({ type: darywinTypes.UserType.Agency })
  if (existingAgencies > 0) {
    logger.info(`${existingAgencies} agencies already exist. Skipping seed.`)
    logger.info('To re-seed, delete existing agencies first.')
    process.exit(0)
  }

  await ensureCdnDirs()
  await ensureAlgeriaLocations()

  const passwordHash = await authHelper.hashPassword('M00vinin')

  let totalProperties = 0
  let totalImages = 0

  for (const agencyData of seedData.agencies) {
    // Find matching location
    const location = await findLocationByName(agencyData.locationMatch)
    if (!location) {
      logger.error(`Location "${agencyData.locationMatch}" not found, skipping agency "${agencyData.fullName}"`)
      continue
    }

    // Create agency
    const agency = new User({
      fullName: agencyData.fullName,
      email: agencyData.email,
      phone: agencyData.phone,
      password: passwordHash,
      language: env.DEFAULT_LANGUAGE,
      type: darywinTypes.UserType.Agency,
      active: true,
      verified: true,
      bio: agencyData.bio,
      location: agencyData.locationLabel,
    })
    await agency.save()

    // Generate and save logo
    const logoFilename = `${agency._id}_${Date.now()}.png`
    const logoPath = path.join(env.CDN_USERS, logoFilename)
    const logoPng = generateLogoPng(
      agencyData.fullName.split(' ').map((w) => w[0]).join('').slice(0, 3),
      agencyData.logoColor,
    )
    fs.writeFileSync(logoPath, logoPng)

    agency.avatar = logoFilename
    await agency.save()

    logger.info(`Created agency: ${agencyData.fullName} (${agencyData.email})`)

    // Create properties with images
    for (const propData of agencyData.properties) {
      const { imageUrl, ...propertyFields } = propData

      let imageFilename: string | undefined
      if (imageUrl) {
        const ext = '.jpeg'
        imageFilename = `${nanoid()}_${Date.now()}${ext}`
        const imagePath = path.join(env.CDN_PROPERTIES, imageFilename)

        const downloaded = await downloadImage(imageUrl, imagePath)
        if (downloaded) {
          totalImages++
          logger.info(`    Downloaded image: ${imageFilename}`)
        } else {
          imageFilename = undefined
        }
      }

      const property = new Property({
        ...propertyFields,
        agency: agency._id,
        location: location._id,
        available: true,
        ...(imageFilename && { image: imageFilename, images: [imageFilename] }),
      })
      await property.save()
      totalProperties++
    }

    logger.info(`  -> ${agencyData.properties.length} properties created`)
  }

  logger.info(`Seed complete: ${seedData.agencies.length} agencies, ${totalProperties} properties, ${totalImages} images downloaded`)
  process.exit(0)
} catch (err) {
  logger.error('Error during prod seed:', err)
  process.exit(1)
}
