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
import { scoreRaceResult, scorePoleBonus, scoreFastestLapBonus } from '../lib/scoring'

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// ---- Players -------------------------------------------------------------

export async function addPlayer({ name, color, emoji }) {
  const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`
  await withTimeout(
    setDoc(doc(db, 'players', id), {
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
    }),
    10000,
  )
  return id
}

export async function updatePlayer(playerId, data) {
  await updateDoc(doc(db, 'players', playerId), data)
}

// A misconfigured deploy (e.g. a prod build accidentally pointed at a local
// emulator host) doesn't reject this write — it just never resolves, since
// the SDK keeps the request pending against an unreachable target instead
// of failing fast. Without a bound, PasscodeSetup's "Saving…" state would
// spin forever with nothing for the user to act on. Race against a plain
// timer so the caller always gets a settled promise either way; tagged
// `.code = 'timeout'` so the UI can show something more specific than a
// generic failure.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        const err = new Error('Timed out waiting for Firestore to respond.')
        err.code = 'timeout'
        reject(err)
      }, ms),
    ),
  ])
}

export async function setPlayerPasscode(playerId, passcodeHash) {
  await withTimeout(
    updateDoc(doc(db, 'players', playerId), {
      passcodeHash,
      passcodeSetAt: serverTimestamp(),
    }),
    10000,
  )
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

export async function upsertPrediction({
  raceId,
  playerId,
  p1,
  p2,
  p3,
  pole,
  fastestLap,
  sprintP1,
  sprintP2,
  sprintP3,
  isSprint,
}) {
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
      sprintPredictedP1: sprintP1 || null,
      sprintPredictedP2: sprintP2 || null,
      sprintPredictedP3: sprintP3 || null,
      submittedAt: serverTimestamp(),
    },
    { merge: true },
  )

  // A separate, content-free "did they finish their pick" flag that stays
  // readable before the race locks (unlike the prediction doc above, which
  // security rules hide from other players until then). This is what powers
  // the "who's still out" status without leaking anyone's actual picks.
  // On a sprint weekend, "finished" means both podiums are filled in — both
  // lock at the same moment (see the sprint-locking note in PredictionForm),
  // so there's no benefit to treating them as separately "submitted".
  const mainComplete = Boolean(p1 && p2 && p3)
  const sprintComplete = Boolean(sprintP1 && sprintP2 && sprintP3)
  const complete = mainComplete && (!isSprint || sprintComplete)
  const submissionRef = doc(db, 'races', raceId, 'submissions', playerId)
  if (complete) {
    await setDoc(submissionRef, { playerId, submittedAt: serverTimestamp() })
  } else {
    await deleteDoc(submissionRef).catch(() => {})
  }
}

// Marks this player's own pick as "revealed" — the moment they choose to
// view everyone else's picks before the race has actually locked. Security
// rules (see firestore.rules) then treat this exactly like a real lock for
// this one prediction: no further edits, from anyone but an admin, even
// though the race itself is still open. Not actually one-way — an admin can
// undo it, see resetRevealLock/resetAllRevealLocks below.
export async function revealPrediction(raceId, playerId) {
  await updateDoc(doc(db, 'predictions', predictionId(raceId, playerId)), {
    revealedAt: serverTimestamp(),
  })
}

// Admin action: undoes the reveal-lock from revealPrediction for one
// player's prediction on one race. Only clears the reveal state — their
// actual p1/p2/p3 pick is left untouched, so they can go back and edit the
// pick they already made rather than starting over. Doesn't touch the
// race's real lockAt: if the race has genuinely locked, the update rule's
// isRaceLocked() clause still blocks their next edit regardless of this —
// this only undoes the early "you peeked" lock, not real lock enforcement.
// Stamped the same way adminOverridePrediction stamps its writes (a flag +
// timestamp, not a specific admin identity) — RacePage surfaces this to the
// affected player directly so a reset isn't a silent, invisible edit.
export async function resetRevealLock(raceId, playerId) {
  await updateDoc(doc(db, 'predictions', predictionId(raceId, playerId)), {
    revealedAt: null,
    revealLockReset: true,
    revealLockResetAt: serverTimestamp(),
  })
}

// Same reset, batched across every player who has actually revealed for
// this race — a whole-race do-over. Returns how many predictions were
// touched (for the confirming admin's own feedback, not the count shown in
// the confirmation modal itself — that's a separate read the UI does before
// the admin ever commits to the action).
export async function resetAllRevealLocks(raceId) {
  const predictionsSnap = await getDocs(query(collection(db, 'predictions'), where('raceId', '==', raceId)))
  const revealed = predictionsSnap.docs.filter((d) => d.data().revealedAt)
  if (revealed.length === 0) return 0

  const batch = writeBatch(db)
  for (const predDoc of revealed) {
    batch.update(predDoc.ref, {
      revealedAt: null,
      revealLockReset: true,
      revealLockResetAt: serverTimestamp(),
    })
  }
  await batch.commit()
  return revealed.length
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

// Recomputes the derived `points`/`breakdown`/`correctPodiumCount`/
// `guessCount` fields from a prediction's three independent main-race-family
// sections — race podium, pole bonus, fastest-lap bonus (sprint stays
// entirely separate; see sprintPoints/sprintBreakdown in submitSprintResults
// below). Called after any *one* of the three is (re)scored, reading
// whatever the *other* two currently hold on the prediction doc, so the
// total is always a fresh sum — never an increment — meaning a correction to
// one section can never double-count or stack on top of a stale total.
function deriveMainTotals(prediction) {
  return {
    points: (prediction.racePoints || 0) + (prediction.poleBonusPoints || 0) + (prediction.fastestLapBonusPoints || 0),
    breakdown: [
      ...(prediction.raceBreakdown || []),
      ...(prediction.poleBreakdown || []),
      ...(prediction.fastestLapBreakdown || []),
    ],
    correctPodiumCount: prediction.raceCorrectPodiumCount || 0,
    guessCount: prediction.raceGuessCount || 0,
  }
}

/**
 * Admin action: save the pole position result for a race and immediately
 * recalculate every player's pole bonus — independent of the sprint result,
 * the race result, and fastest lap, since pole is usually known right after
 * qualifying, often a day or more before any of the others. Uses a
 * dot-notation field path (`results.pole`, not `results`) so this only ever
 * touches the pole slice of the race's results map, never clobbering
 * whatever else has (or hasn't) been entered yet. Re-saving a corrected pole
 * pick replaces this section's contribution cleanly — see deriveMainTotals.
 */
export async function submitPoleResult(raceId, poleDriverId, scoringSettings) {
  const predictionsSnap = await getDocs(query(collection(db, 'predictions'), where('raceId', '==', raceId)))
  const batch = writeBatch(db)

  batch.update(doc(db, 'races', raceId), {
    'results.pole': poleDriverId,
    'results.poleEnteredAt': serverTimestamp(),
  })

  for (const predDoc of predictionsSnap.docs) {
    const prediction = predDoc.data()
    const { points: poleBonusPoints, breakdown: poleBreakdown } = scorePoleBonus(prediction, { pole: poleDriverId }, scoringSettings)
    batch.update(predDoc.ref, {
      poleBonusPoints,
      poleBreakdown,
      poleScoredAt: serverTimestamp(),
      ...deriveMainTotals({ ...prediction, poleBonusPoints, poleBreakdown }),
    })
  }

  await batch.commit()
  return predictionsSnap.size
}

/**
 * Admin action: save the fastest-lap result and recalculate every player's
 * fastest-lap bonus — independent of everything else, same reasoning as
 * submitPoleResult above (usually known only once the race itself is over,
 * sometimes revised shortly after if the timing gets corrected).
 */
export async function submitFastestLapResult(raceId, fastestLapDriverId, scoringSettings) {
  const predictionsSnap = await getDocs(query(collection(db, 'predictions'), where('raceId', '==', raceId)))
  const batch = writeBatch(db)

  batch.update(doc(db, 'races', raceId), {
    'results.fastestLap': fastestLapDriverId,
    'results.fastestLapEnteredAt': serverTimestamp(),
  })

  for (const predDoc of predictionsSnap.docs) {
    const prediction = predDoc.data()
    const { points: fastestLapBonusPoints, breakdown: fastestLapBreakdown } = scoreFastestLapBonus(
      prediction,
      { fastestLap: fastestLapDriverId },
      scoringSettings,
    )
    batch.update(predDoc.ref, {
      fastestLapBonusPoints,
      fastestLapBreakdown,
      fastestLapScoredAt: serverTimestamp(),
      ...deriveMainTotals({ ...prediction, fastestLapBonusPoints, fastestLapBreakdown }),
    })
  }

  await batch.commit()
  return predictionsSnap.size
}

/**
 * Admin action: save the Grand Prix's own P1/P2/P3 and recalculate every
 * player's race points (exact position + correct-podium-wrong-slot + winner
 * bonus) — independent of pole, fastest lap, and the sprint. This is what
 * flips a race to "completed" status (see isMainRaceComplete in
 * lib/raceStatus.js) — the other three sections can be entered well before
 * or after this one without affecting that.
 */
export async function submitRaceResult(raceId, results, scoringSettings) {
  const predictionsSnap = await getDocs(query(collection(db, 'predictions'), where('raceId', '==', raceId)))
  const batch = writeBatch(db)

  batch.update(doc(db, 'races', raceId), {
    'results.p1': results.p1,
    'results.p2': results.p2,
    'results.p3': results.p3,
    'results.raceEnteredAt': serverTimestamp(),
  })

  for (const predDoc of predictionsSnap.docs) {
    const prediction = predDoc.data()
    const { points: racePoints, breakdown: raceBreakdown, correctPodiumCount: raceCorrectPodiumCount, guessCount: raceGuessCount } =
      scoreRaceResult(prediction, results, scoringSettings)
    batch.update(predDoc.ref, {
      racePoints,
      raceBreakdown,
      raceCorrectPodiumCount,
      raceGuessCount,
      raceScoredAt: serverTimestamp(),
      ...deriveMainTotals({ ...prediction, racePoints, raceBreakdown, raceCorrectPodiumCount, raceGuessCount }),
    })
  }

  await batch.commit()
  return predictionsSnap.size
}

/**
 * Admin action: save the sprint's own P1/P2/P3 and recalculate every
 * player's sprint points — entirely separate from the main race family
 * above (its own `sprintPoints`/`sprintBreakdown` fields, never folded into
 * `points`, matching how the rest of the app already treats sprint vs. main
 * scoring as two parallel totals rather than one combined number).
 */
export async function submitSprintResults(raceId, sprintResults, scoringSettings) {
  const predictionsSnap = await getDocs(query(collection(db, 'predictions'), where('raceId', '==', raceId)))
  const batch = writeBatch(db)

  batch.update(doc(db, 'races', raceId), {
    'results.sprintP1': sprintResults.p1,
    'results.sprintP2': sprintResults.p2,
    'results.sprintP3': sprintResults.p3,
    'results.sprintEnteredAt': serverTimestamp(),
  })

  for (const predDoc of predictionsSnap.docs) {
    const prediction = predDoc.data()
    const sprintPrediction = {
      p1: prediction.sprintPredictedP1,
      p2: prediction.sprintPredictedP2,
      p3: prediction.sprintPredictedP3,
    }
    const raw = scoreRaceResult(sprintPrediction, sprintResults, scoringSettings)
    batch.update(predDoc.ref, {
      sprintPoints: raw.points * (scoringSettings.sprintPointsMultiplier ?? 0.5),
      sprintBreakdown: raw.breakdown,
      sprintCorrectPodiumCount: raw.correctPodiumCount,
      sprintGuessCount: raw.guessCount,
      sprintScoredAt: serverTimestamp(),
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
  sprintP1,
  sprintP2,
  sprintP3,
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
    sprintPredictedP1: sprintP1 || null,
    sprintPredictedP2: sprintP2 || null,
    sprintPredictedP3: sprintP3 || null,
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

  // The picks write above has already landed by the time we get here — if
  // *this* write fails, the override itself still took effect, just without
  // updated points. Tagged with `.phase` so the caller (PredictionOverride)
  // can say so specifically instead of a blanket "failed to save" that would
  // wrongly imply the pick change itself didn't go through. Race/pole/
  // fastest-lap fold into one combined write (they share the same derived
  // points/breakdown total — see deriveMainTotals — so there's nothing to
  // gain from splitting them the way sprint is split below); sprint rescores
  // in its own write since it's genuinely independent, and either one
  // failing shouldn't block the other from landing.
  const existingData = existing.exists() ? existing.data() : {}
  const mainUpdate = {}

  if (raceResults?.p1 && raceResults?.p2 && raceResults?.p3) {
    const { points, breakdown, correctPodiumCount, guessCount } = scoreRaceResult(picks, raceResults, scoringSettings)
    Object.assign(mainUpdate, {
      racePoints: points,
      raceBreakdown: breakdown,
      raceCorrectPodiumCount: correctPodiumCount,
      raceGuessCount: guessCount,
      raceScoredAt: serverTimestamp(),
    })
  }
  if (raceResults?.pole) {
    const { points, breakdown } = scorePoleBonus(picks, raceResults, scoringSettings)
    Object.assign(mainUpdate, { poleBonusPoints: points, poleBreakdown: breakdown, poleScoredAt: serverTimestamp() })
  }
  if (raceResults?.fastestLap) {
    const { points, breakdown } = scoreFastestLapBonus(picks, raceResults, scoringSettings)
    Object.assign(mainUpdate, { fastestLapBonusPoints: points, fastestLapBreakdown: breakdown, fastestLapScoredAt: serverTimestamp() })
  }
  if (Object.keys(mainUpdate).length > 0) {
    try {
      Object.assign(mainUpdate, deriveMainTotals({ ...existingData, ...mainUpdate }))
      await updateDoc(ref, mainUpdate)
    } catch (err) {
      err.phase = 'rescore'
      throw err
    }
  }

  if (raceResults?.sprintP1 && raceResults?.sprintP2 && raceResults?.sprintP3) {
    try {
      const sprintPrediction = { p1: picks.sprintPredictedP1, p2: picks.sprintPredictedP2, p3: picks.sprintPredictedP3 }
      const sprintResultShape = { p1: raceResults.sprintP1, p2: raceResults.sprintP2, p3: raceResults.sprintP3 }
      const raw = scoreRaceResult(sprintPrediction, sprintResultShape, scoringSettings)
      await updateDoc(ref, {
        sprintPoints: raw.points * (scoringSettings.sprintPointsMultiplier ?? 0.5),
        sprintBreakdown: raw.breakdown,
        sprintCorrectPodiumCount: raw.correctPodiumCount,
        sprintGuessCount: raw.guessCount,
        sprintScoredAt: serverTimestamp(),
      })
    } catch (err) {
      err.phase = 'sprint-rescore'
      throw err
    }
  }
}

// Nuclear option — clears every section at once (race, pole, sprint,
// fastest lap), unlike the four submit* functions above which each only
// ever touch their own slice. Still whole-object here (not dot-notation)
// since wiping everything is exactly the point.
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
      racePoints: null,
      raceBreakdown: null,
      raceCorrectPodiumCount: null,
      raceGuessCount: null,
      raceScoredAt: null,
      poleBonusPoints: null,
      poleBreakdown: null,
      poleScoredAt: null,
      fastestLapBonusPoints: null,
      fastestLapBreakdown: null,
      fastestLapScoredAt: null,
      sprintPoints: null,
      sprintBreakdown: null,
      sprintCorrectPodiumCount: null,
      sprintGuessCount: null,
      sprintScoredAt: null,
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
