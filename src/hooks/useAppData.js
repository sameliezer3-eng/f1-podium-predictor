import { useMemo } from 'react'
import { orderBy, where } from 'firebase/firestore'
import { useCollection, useCollectionGroup, useDocument } from './useFirestore'
import { predictionId } from '../firebase/api'
import { DEFAULT_SCORING } from '../data/seedData'

export function useRaces() {
  return useCollection('races', [orderBy('order', 'asc')])
}

export function useDrivers() {
  return useCollection('drivers', [orderBy('team', 'asc')])
}

export function usePlayers() {
  return useCollection('players', [orderBy('name', 'asc')])
}

export function useScoringSettings() {
  const { data, loading, error } = useDocument('settings', 'scoring')
  return { data: data ?? DEFAULT_SCORING, loading, error }
}

/** Live "is a restore currently running" flag — see restoreDatabaseSnapshot in api.js. */
export function useRestoreStatus() {
  const { data } = useDocument('settings', 'restoreStatus')
  return data?.restoreInProgress ?? false
}

/**
 * A single player's own prediction for a race. Reading it by its
 * deterministic doc ID (rather than a `where` query) means Firestore
 * evaluates the rule against that exact document — always allowed for the
 * author, lock status doesn't matter. Safe to call before a race locks.
 */
export function useMyPrediction(raceId, playerId) {
  return useDocument('predictions', raceId && playerId ? predictionId(raceId, playerId) : null)
}

/**
 * Every player's prediction for one race. Security rules only allow this
 * *unfiltered* query once the race has locked (see firestore.rules) — pass
 * `enabled: false` while a race is still open for picks, or Firestore will
 * reject the whole query. RacePage decides `enabled` from the race's own
 * status, which it already has loaded.
 */
export function usePredictionsForRace(raceId, enabled = true) {
  return useCollection('predictions', [where('raceId', '==', raceId)], raceId ?? '', enabled && !!raceId)
}

/**
 * Scored predictions for every *completed* race this season, for standings
 * and the trend chart. Constrained to `raceId in [...]` so the rules engine
 * can prove every one of those races is locked — an unfiltered `predictions`
 * read would be rejected the moment any race is still open.
 */
export function useSeasonPredictions(races) {
  const completedRaceIds = useMemo(
    () => races.filter((r) => r.results).map((r) => r.id).slice(0, 30),
    [races],
  )
  const key = completedRaceIds.join(',')
  return useCollection(
    'predictions',
    [where('raceId', 'in', completedRaceIds.length ? completedRaceIds : ['__none__'])],
    key,
    completedRaceIds.length > 0,
  )
}

/** Lightweight "did this player finish their pick" flags for one race — no pick content, so readable pre-lock. */
export function useRaceSubmissions(raceId) {
  return useCollection(['races', raceId ?? '__none__', 'submissions'], [], raceId ?? '', !!raceId)
}

/** Same, but across every race at once (for the calendar's "x/y predicted" counts). */
export function useAllSubmissions() {
  return useCollectionGroup('submissions')
}
