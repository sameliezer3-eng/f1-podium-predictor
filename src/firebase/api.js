import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db, auth, authReady } from './config'
import { scorePrediction } from '../lib/scoring'

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// ---- Players -------------------------------------------------------------

export async function addPlayer({ name, color, emoji }) {
  const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`
  await setDoc(doc(db, 'players', id), {
    name,
    color,
    emoji: emoji || null,
    createdAt: serverTimestamp(),
  })
  return id
}

export async function updatePlayer(playerId, data) {
  await updateDoc(doc(db, 'players', playerId), data)
}

// ---- Predictions -----------------------------------------------------------

export function predictionId(raceId, playerId) {
  return `${raceId}_${playerId}`
}

export async function upsertPrediction({ raceId, playerId, p1, p2, p3, pole, fastestLap }) {
  await authReady
  if (!auth?.currentUser) {
    throw new Error('Firebase isn\'t configured yet — add your project keys to .env (see .env.example).')
  }
  const id = predictionId(raceId, playerId)
  await setDoc(
    doc(db, 'predictions', id),
    {
      raceId,
      playerId,
      authUid: auth.currentUser.uid,
      p1: p1 || null,
      p2: p2 || null,
      p3: p3 || null,
      pole: pole || null,
      fastestLap: fastestLap || null,
      submittedAt: serverTimestamp(),
    },
    { merge: true },
  )

  // A separate, content-free "did they finish their pick" flag that stays
  // readable before the race locks (unlike the prediction doc above, which
  // security rules hide from other players until then). This is what powers
  // the "who's still out" status without leaking anyone's actual picks.
  const complete = Boolean(p1 && p2 && p3)
  const submissionRef = doc(db, 'races', raceId, 'submissions', playerId)
  if (complete) {
    await setDoc(submissionRef, { playerId, submittedAt: serverTimestamp() })
  } else {
    await deleteDoc(submissionRef).catch(() => {})
  }
}

// ---- Drivers (grid editing) -------------------------------------------------

export async function upsertDriver(driverId, data) {
  const id = driverId || slugify(data.name)
  await setDoc(doc(db, 'drivers', id), data, { merge: true })
  return id
}

export async function deleteDriver(driverId) {
  await deleteDoc(doc(db, 'drivers', driverId))
}

// ---- Races (calendar editing + results entry) -------------------------------

export async function updateRace(raceId, data) {
  await updateDoc(doc(db, 'races', raceId), data)
}

export async function setRaceLockAt(raceId, dateStringUTC) {
  await updateDoc(doc(db, 'races', raceId), {
    lockAt: Timestamp.fromDate(new Date(`${dateStringUTC}T00:00:00Z`)),
  })
}

/**
 * Admin action: write the actual P1/P2/P3 (+ optional pole/fastest lap) for
 * a race, then score every submitted prediction for that race in one batch.
 */
export async function submitRaceResults(raceId, results, scoringSettings) {
  const predictionsSnap = await getDocs(query(collection(db, 'predictions'), where('raceId', '==', raceId)))

  const batch = writeBatch(db)

  batch.update(doc(db, 'races', raceId), {
    results,
    resultsEnteredAt: serverTimestamp(),
  })

  for (const predDoc of predictionsSnap.docs) {
    const prediction = predDoc.data()
    const { points, breakdown, correctPodiumCount, guessCount } = scorePrediction(
      prediction,
      results,
      scoringSettings,
    )
    batch.update(predDoc.ref, {
      points,
      breakdown,
      correctPodiumCount,
      guessCount,
      scoredAt: serverTimestamp(),
    })
  }

  await batch.commit()
  return predictionsSnap.size
}

export async function clearRaceResults(raceId) {
  const predictionsSnap = await getDocs(query(collection(db, 'predictions'), where('raceId', '==', raceId)))
  const batch = writeBatch(db)
  batch.update(doc(db, 'races', raceId), { results: null, resultsEnteredAt: null })
  for (const predDoc of predictionsSnap.docs) {
    batch.update(predDoc.ref, {
      points: null,
      breakdown: null,
      correctPodiumCount: null,
      guessCount: null,
      scoredAt: null,
    })
  }
  await batch.commit()
}

// ---- Settings ----------------------------------------------------------------

export async function updateScoringSettings(data) {
  await setDoc(doc(db, 'settings', 'scoring'), data, { merge: true })
}
