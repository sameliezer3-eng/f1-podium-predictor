import { useEffect, useState } from 'react'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// A `Date` that updates itself over time, so status/countdown UI derived
// from it (getRaceStatus, formatCountdown) re-renders live without a
// reload or a Firestore round-trip. `target` (typically a race's lockAt) is
// used only to pick how *often* to tick — ticking every second for a race
// that's days away would just churn re-renders across every open race card
// on the calendar for no visible change, so this ticks faster the closer
// `target` gets and falls back to a slow, indefinite heartbeat once it's
// passed (or if there's no target at all) rather than stopping outright —
// callers like HomePage's "up next" pick still need *some* ongoing tick to
// notice when the featured race itself locks and swap to the next one.
export function useLiveNow(target) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timeoutId
    const tick = () => {
      const current = new Date()
      setNow(current)
      const msRemaining = target ? target.getTime() - current.getTime() : null
      const delay =
        msRemaining !== null && msRemaining > 0 && msRemaining <= HOUR
          ? 1000
          : msRemaining !== null && msRemaining > 0 && msRemaining <= DAY
            ? 30 * 1000
            : MINUTE
      timeoutId = setTimeout(tick, delay)
    }
    tick()
    return () => clearTimeout(timeoutId)
    // Deliberately keyed on the timestamp value, not `target` itself — a
    // new Date object referencing the same instant is a new reference on
    // every render, which would restart this effect (and the timer inside
    // it) every render instead of only when the instant actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.getTime()])

  return now
}
