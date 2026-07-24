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

// Adaptive granularity so it stays readable at any distance from lock —
// days+hours far out, hours+minutes under a day, minutes+seconds under an
// hour (where useLiveNow is also ticking every second, so this is live).
// `msRemaining` is a plain duration (lockAt - now), not a wall-clock time,
// so no timezone handling belongs here at all — see formatLocalLockTime for
// the one place that actually needs the viewer's timezone.
export function formatCountdown(msRemaining) {
  if (msRemaining == null || msRemaining <= 0) return null
  const totalSeconds = Math.floor(msRemaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days >= 1) return `${days}d ${hours}h`
  if (hours >= 1) return `${hours}h ${minutes}m`
  return `${minutes}m ${seconds}s`
}

// The actual lock moment, in whoever's looking at it own timezone — unlike
// formatDateRange above (which deliberately pins to UTC so a date-only
// range reads the same for everyone), lockAt is a real instant, so this
// intentionally leaves `timeZone` unset and lets toLocaleString fall back
// to the browser's local zone.
export function formatLocalLockTime(lockAtValue) {
  const lockAt = toDate(lockAtValue)
  if (!lockAt) return ''
  return lockAt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
