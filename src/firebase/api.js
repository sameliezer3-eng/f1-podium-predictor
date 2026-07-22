import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db, auth, authReady, AuthUnavailableError } from './config'
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
    // Both required explicitly, not left to default to "missing": the create
    // rule requires isAdmin === false (nobody grants themselves admin), and
    // passcodeHash must exist as null for the "claiming an unset passcode"
    // rule check to see it rather than erroring on a missing field.
    isAdmin: false,
    passcodeHash: null,
    passcodeSetAt: null,
  })
  return id
}

export async function updatePlayer(playerId, data) {
  await updateDoc(doc(db, 'players', playerId), data)
}

export async function setPlayerPasscode(playerId, passcodeHash) {
  await updateDoc(doc(db, 'players', playerId), {
    passcodeHash,
    passcodeSetAt: serverTimestamp(),
  })
}

// Admin action: clears a player's passcode so their next login goes through
// first-time setup again — the only "recovery" path, by design (see brief).
export async function resetPlayerPasscode(playerId) {
  await updateDoc(doc(db, 'players', playerId), {
    passcodeHash: null,
    passcodeSetAt: null,
  })
}

// Binds this browser's anonymous-auth uid to the player who just passed
// their passcode challenge — the only way security rules can tell "which
// player is this browser allowed to act as" (see isAdmin()/isOwnPlayerDoc()
// in firestore.rules). Call right after a successful PasscodeSetup/Login;
// clear on logout so a stale claim doesn't outlive the UI session.
export async function setActiveSession(playerId) {
  await authReady
  if (!auth?.currentUser) {
    // Not silently skipped: this is called right after passcode
    // verification (see PlayerSwitcher.handleVerified), and a signed-out
    // browser here means the whole "you're logged in" state the caller is
    // about to set up would be a lie — Firestore rules key admin/ownership
    // checks off this same session. Thrown so the UI can show something
    // truthful instead of quietly proceeding as if it worked.
    throw new AuthUnavailableError()
  }
  await setDoc(doc(db, 'sessions', auth.currentUser.uid), {
    playerId,
    updatedAt: serverTimestamp(),
  })
}

export async function clearActiveSession() {
  await authReady
  if (!auth?.currentUser) return
  await deleteDoc(doc(db, 'sessions', auth.currentUser.uid)).catch(() => {})
}

// Admin action: permanently removes a player and every prediction they ever
// made (plus the matching per-race submission flags), so they fully vanish
// from standings, podiums, and race breakdowns. A season's worth of
// predictions for one player is at most ~44 docs (races × 2), nowhere near
// the 500-op batch limit, so this doesn't need chunking the way restore does.
export async function deletePlayer(playerId) {
  const predictionsSnap = await getDocs(query(collection(db, 'predictions'), where('playerId', '==', playerId)))

  const batch = writeBatch(db)
  batch.delete(doc(db, 'players', playerId))
  for (const predDoc of predictionsSnap.docs) {
    batch.delete(predDoc.ref)
    batch.delete(doc(db, 'races', predDoc.data().raceId, 'submissions', playerId))
  }
  await batch.commit()
}

// ---- Predictions -----------------------------------------------------------

export function predictionId(raceId, playerId) {
  return `${raceId}_${playerId}`
}

export async function upsertPrediction({ raceId, playerId, p1, p2, p3, pole, fastestLap }) {
  await authReady
  if (!auth?.currentUser) {
    throw new AuthUnavailableError()
  }

  // Defense in depth: PredictionForm already checks useRestoreStatus() and
  // disables submission proactively, but that's a locally-cached snapshot
  // that could be a moment stale. A fresh read here is the last line of
  // defense against a pick landing mid-restore, where it'd either get wiped
  // by the delete phase or written against a half-restored database.
  const restoreStatus = await getDoc(doc(db, 'settings', 'restoreStatus'))
  if (restoreStatus.exists() && restoreStatus.data().restoreInProgress) {
    throw new Error('Data is being restored — try again in a moment.')
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

/**
 * Admin action: write a player's P1/P2/P3 (+ optional pole/fastest lap)
 * directly, bypassing the normal "only the author, only before lock" rule —
 * works on any race, locked or not, and creates the doc fresh if that player
 * never predicted at all. Always stamps `adminOverride`/`overriddenAt` so
 * the change is visible wherever this prediction is shown (see the marker
 * in PredictionsGrid), never silent. If the race already has results,
 * immediately rescores just this one prediction so its points reflect the
 * corrected pick instead of going stale until the next full results edit.
 */
export async function adminOverridePrediction({
  raceId,
  playerId,
  p1,
  p2,
  p3,
  pole,
  fastestLap,
  raceResults,
  scoringSettings,
}) {
  await authReady
  if (!auth?.currentUser) {
    throw new AuthUnavailableError()
  }

  const ref = doc(db, 'predictions', predictionId(raceId, playerId))
  const existing = await getDoc(ref)

  const picks = {
    p1: p1 || null,
    p2: p2 || null,
    p3: p3 || null,
    pole: pole || null,
    fastestLap: fastestLap || null,
  }

  if (existing.exists()) {
    await updateDoc(ref, { ...picks, adminOverride: true, overriddenAt: serverTimestamp() })
  } else {
    await setDoc(ref, {
      raceId,
      playerId,
      authUid: auth.currentUser.uid,
      ...picks,
      submittedAt: serverTimestamp(),
      adminOverride: true,
      overriddenAt: serverTimestamp(),
    })
  }

  if (raceResults) {
    const { points, breakdown, correctPodiumCount, guessCount } = scorePrediction(picks, raceResults, scoringSettings)
    await updateDoc(ref, { points, breakdown, correctPodiumCount, guessCount, scoredAt: serverTimestamp() })
  }
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

export async function setRestoreInProgress(inProgress) {
  await setDoc(
    doc(db, 'settings', 'restoreStatus'),
    inProgress ? { restoreInProgress: true, startedAt: serverTimestamp() } : { restoreInProgress: false, finishedAt: serverTimestamp() },
  )
}

// ---- Database backup / restore ------------------------------------------------
//
// Deliberately scoped to exactly the 5 collections named in the brief:
// players, races, drivers, predictions, settings. Two things are pointedly
// left out:
//   - races/{id}/submissions — content-free "did they finish their pick"
//     flags, cheaply rebuilt the next time each player saves a prediction.
//     Not "league data" worth a restore slot.
//   - sessions — pure ephemeral browser↔player bindings. Restoring these
//     would be actively wrong (they'd point at whatever browser happened to
//     be exporting, not the browser that'll eventually restore).
//   - settings/restoreStatus specifically, *within* the settings collection
//     — it's operational state about the restore process itself, not app
//     data. Restoring over it mid-restore would stomp the in-progress flag
//     this very function is relying on. Excluded from both export and
//     restore so it never round-trips through a backup file.

const BACKUP_COLLECTIONS = ['players', 'races', 'drivers', 'predictions', 'settings']
const SETTINGS_INFRA_DOC_IDS = ['restoreStatus']

function isBackedUp(collectionName, docId) {
  return !(collectionName === 'settings' && SETTINGS_INFRA_DOC_IDS.includes(docId))
}

// Firestore Timestamps aren't valid JSON — round-trip them through a tagged
// plain object instead so a restored doc gets a real Timestamp back, not a
// string that every date-handling call site would need to special-case.
function serializeValue(value) {
  if (value instanceof Timestamp) {
    return { __timestamp: true, seconds: value.seconds, nanoseconds: value.nanoseconds }
  }
  if (Array.isArray(value)) return value.map(serializeValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serializeValue(v)]))
  }
  return value
}

function deserializeValue(value) {
  if (value && typeof value === 'object') {
    if (value.__timestamp) return new Timestamp(value.seconds, value.nanoseconds)
    if (Array.isArray(value)) return value.map(deserializeValue)
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deserializeValue(v)]))
  }
  return value
}

export async function exportDatabaseSnapshot() {
  const collections = {}
  for (const name of BACKUP_COLLECTIONS) {
    const snap = await getDocs(collection(db, name))
    collections[name] = snap.docs
      .filter((d) => isBackedUp(name, d.id))
      .map((d) => ({ id: d.id, data: serializeValue(d.data()) }))
  }
  return { exportedAt: new Date().toISOString(), collections }
}

export function downloadBackupFile(snapshot, filenamePrefix = 'fam1-backup') {
  const dateStr = snapshot.exportedAt.slice(0, 10)
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filenamePrefix}-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Headroom under Firestore's hard 500-operation batch limit.
const BATCH_CHUNK_SIZE = 450

async function commitInChunks(items, applyToBatch) {
  for (let i = 0; i < items.length; i += BATCH_CHUNK_SIZE) {
    const batch = writeBatch(db)
    for (const item of items.slice(i, i + BATCH_CHUNK_SIZE)) applyToBatch(batch, item)
    await batch.commit()
  }
}

/**
 * Wipes and rewrites all 5 backed-up collections from a previously exported
 * snapshot, preserving every original document ID (so a browser's stored
 * player session still points at something real afterward — see
 * PlayerContext's stale-session cleanup, which handles the case where it
 * doesn't). Sets `restoreInProgress` for the duration so in-flight
 * predictions elsewhere don't land mid-restore (see upsertPrediction).
 *
 * Deletes and (re)writes are deliberately interleaved into the *same*
 * chunked batches, not run as two separate delete-everything /
 * write-everything passes. That's not just an optimization: a doc that
 * exists in both the current DB and the backup gets a single atomic
 * overwrite rather than a delete-then-recreate — which matters a lot for
 * `players`, since the security rules' isAdmin() reads that very collection
 * to authorize every write *this restore is still in the middle of making*.
 * A separate delete-everything pass would, for one commit, leave the
 * restoring admin's own player doc genuinely absent — which the app's own
 * stale-session cleanup (PlayerContext) would react to by logging them out
 * and deleting their Firestore session, permission-denying every write for
 * the rest of the restore. (Caught by testing this exact restore against a
 * real admin session, not a hypothetical — this used to fail after the
 * players pass with an empty database.) Interleaving avoids the empty
 * window entirely for any collection whose ops fit in one chunk, which
 * `players` always will for a friend-group-sized league.
 *
 * Callers are expected to have already taken their own safety-net export
 * (see the brief / DatabaseBackup.jsx) before calling this — this function
 * only performs the destructive half.
 */
export async function restoreDatabaseSnapshot(snapshot) {
  await setRestoreInProgress(true)
  try {
    for (const name of BACKUP_COLLECTIONS) {
      const existingSnap = await getDocs(collection(db, name))
      const existingIds = new Set(existingSnap.docs.filter((d) => isBackedUp(name, d.id)).map((d) => d.id))

      const backupItems = (snapshot.collections[name] || []).filter((item) => isBackedUp(name, item.id))
      const backupIds = new Set(backupItems.map((item) => item.id))

      const ops = [
        ...[...existingIds].filter((id) => !backupIds.has(id)).map((id) => ({ type: 'delete', id })),
        ...backupItems.map((item) => ({ type: 'set', id: item.id, data: deserializeValue(item.data) })),
      ]

      await commitInChunks(ops, (batch, op) =>
        op.type === 'delete' ? batch.delete(doc(db, name, op.id)) : batch.set(doc(db, name, op.id), op.data),
      )
    }
  } finally {
    await setRestoreInProgress(false)
  }
}
