import { formatCountdown, formatLocalLockTime, toDate } from '../../lib/raceStatus'

// Pure display — takes `now` as a prop rather than ticking its own timer,
// so a parent showing both a countdown and a live status badge for the same
// race (see RaceCard/HomePage/RacePage) only needs one useLiveNow, not one
// per piece of UI derived from it.
export default function LockCountdown({ lockAt, now, compact = false }) {
  const target = toDate(lockAt)
  if (!target) return null
  const msRemaining = target.getTime() - now.getTime()
  if (msRemaining <= 0) return null

  return (
    <div className={compact ? 'text-right' : ''}>
      <p className={compact ? 'text-xs font-semibold text-race-gold' : 'text-sm font-semibold text-race-gold'}>
        Locks in {formatCountdown(msRemaining)}
      </p>
      <p className={compact ? 'text-[10px] text-slate-500' : 'text-xs text-slate-500'}>
        {formatLocalLockTime(target)} your time
      </p>
    </div>
  )
}
