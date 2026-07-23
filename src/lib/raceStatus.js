// Firestore Timestamps have a .toDate() method; plain JS Dates (e.g. from
// seed data before a round trip) don't. Normalize both.
export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

// Known simplification for sprint weekends: `lockAt` is a single timestamp
// per race (weekend start), so the sprint prediction and the Grand Prix
// prediction both lock at that same moment — even though the real sprint
// (Saturday) and the real race (Sunday) happen on different days. A more
// realistic version would lock the sprint prediction separately, earlier
// than the main race, but that needs a second per-race date field the data
// model doesn't have; out of scope for making sprint scoring functional.
export function isRaceLocked(race, now = new Date()) {
  const lockAt = toDate(race.lockAt)
  return lockAt ? now >= lockAt : false
}

/**
 * 'open'      — predictions can still be submitted/edited
 * 'locked'    — weekend has started, results not in yet
 * 'completed' — results have been entered and scored
 */
export function getRaceStatus(race, now = new Date()) {
  if (race.results) return 'completed'
  if (isRaceLocked(race, now)) return 'locked'
  return 'open'
}

export function formatDateRange(dateStart, dateEnd) {
  const start = toDate(dateStart)
  const end = toDate(dateEnd)
  if (!start || !end) return ''
  const sameMonth = start.getUTCMonth() === end.getUTCMonth()
  const startFmt = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const endFmt = end.toLocaleDateString('en-US', {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return `${startFmt}–${endFmt}`
}

export function nextUpcomingRace(races, now = new Date()) {
  return races
    .filter((r) => !isRaceLocked(r, now))
    .sort((a, b) => toDate(a.dateStart) - toDate(b.dateStart))[0]
}
