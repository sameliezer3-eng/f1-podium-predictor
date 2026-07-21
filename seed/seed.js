// One-time (or re-runnable) seed script. Loads the 2026 calendar, driver
// grid, and default scoring settings into Firestore via the Admin SDK.
//
// Usage:
//   npm run seed              seeds your live Firebase project
//                              (needs GOOGLE_APPLICATION_CREDENTIALS pointing
//                              at a service account key, see .env.example)
//   npm run seed:emulator     seeds the local Firestore emulator instead
//                              (start `npm run emulators` in another
//                              terminal first — no credentials needed)
//
// Safe to re-run: races/drivers/settings are upserted by deterministic ID,
// so re-seeding won't create duplicates. It never touches players or
// predictions.

import 'dotenv/config'
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'node:fs'
import { RACES, DRIVERS, DEFAULT_SCORING } from '../src/data/seedData.js'

const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST

function initAdmin() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'paddock-predictor-dev'

  if (usingEmulator) {
    return initializeApp({ projectId })
  }

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (keyPath && existsSync(keyPath)) {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
    return initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id })
  }

  // Falls back to ADC (e.g. `gcloud auth application-default login`)
  return initializeApp({ credential: applicationDefault(), projectId })
}

const app = initAdmin()
const db = getFirestore(app)

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function seedDrivers() {
  const batch = db.batch()
  for (const driver of DRIVERS) {
    const id = slugify(driver.name)
    batch.set(db.collection('drivers').doc(id), driver, { merge: true })
  }
  await batch.commit()
  console.log(`Seeded ${DRIVERS.length} drivers.`)
}

async function seedRaces() {
  const batch = db.batch()
  for (const race of RACES) {
    const id = `r${String(race.order).padStart(2, '0')}-${slugify(race.name)}`
    const lockAt = Timestamp.fromDate(new Date(`${race.dateStart}T00:00:00Z`))
    batch.set(
      db.collection('races').doc(id),
      {
        ...race,
        dateStart: Timestamp.fromDate(new Date(`${race.dateStart}T00:00:00Z`)),
        dateEnd: Timestamp.fromDate(new Date(`${race.dateEnd}T23:59:59Z`)),
        lockAt,
        results: null,
        resultsEnteredAt: null,
      },
      { merge: true },
    )
  }
  await batch.commit()
  console.log(`Seeded ${RACES.length} races.`)
}

async function seedSettings() {
  await db.collection('settings').doc('scoring').set(DEFAULT_SCORING, { merge: true })
  console.log('Seeded default scoring settings.')
}

async function main() {
  console.log(`Seeding ${usingEmulator ? 'the local emulator' : 'your live Firebase project'}...`)
  await seedDrivers()
  await seedRaces()
  await seedSettings()
  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
