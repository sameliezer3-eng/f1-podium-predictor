import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRaces, usePlayers, useAllSubmissions } from '../hooks/useAppData'
import { usePlayerContext } from '../context/PlayerContext'
import { nextUpcomingRace, formatDateRange, toDate, getRaceStatus } from '../lib/raceStatus'
import { useLiveNow } from '../hooks/useLiveNow'
import RaceCard from '../components/race/RaceCard'
import LockCountdown from '../components/race/LockCountdown'
import EmptyState from '../components/ui/EmptyState'
import LoadingScreen from '../components/ui/LoadingScreen'

export default function HomePage() {
  const { data: races, loading } = useRaces()
  const { data: players } = usePlayers()
  const { data: submissions } = useAllSubmissions()
  const { activePlayerId, activePlayer } = usePlayerContext()

  // `now` ticks relative to whichever race is *currently* featured as "up
  // next" — fine-grained as that race's own lock approaches. Re-deriving
  // "up next" as its own state (rather than a plain useMemo off races+now)
  // means once that race locks and a *different* race becomes next, this
  // effect swaps upNext, which changes useLiveNow's target, which restarts
  // the fine-grained ticking around the new race's lockAt — without this,
  // the countdown for whichever race replaces it would be stuck updating
  // only as often as the now-locked original race needed.
  const [upNext, setUpNext] = useState(() => nextUpcomingRace(races))
  const now = useLiveNow(upNext ? toDate(upNext.lockAt) : null)
  useEffect(() => {
    setUpNext(nextUpcomingRace(races, now))
  }, [races, now])

  const submittedByRace = useMemo(() => {
    const map = new Map()
    for (const s of submissions) {
      if (!map.has(s.parentId)) map.set(s.parentId, new Set())
      map.get(s.parentId).add(s.playerId)
    }
    return map
  }, [submissions])

  // Race Hub's main list is deliberately just what's ahead — completed
  // races pile up as the season goes (results in, nothing left to act on
  // here), and the full breakdown for any of them is already one click away
  // via Scoreboard's race-by-race section, so this is purely a display
  // filter, not a data change; nothing about a completed race's
  // predictions/scores/results is touched. A locked-but-not-yet-scored race
  // (just happened, admin hasn't entered results yet) still shows here —
  // it's still current, just not editable anymore.
  const upcomingRaces = useMemo(() => races.filter((r) => getRaceStatus(r) !== 'completed'), [races])

  if (loading) return <LoadingScreen message="Loading the calendar…" />

  if (races.length === 0) {
    return (
      <EmptyState
        icon="🏁"
        title="No races on the calendar yet"
        subtitle="Run `npm run seed` to load the 2026 season, then refresh."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {upNext && (
        <section className="relative overflow-hidden rounded-2xl border border-track-700 bg-gradient-to-br from-track-900 to-track-800 p-6">
          <div className="checkered-bg pointer-events-none absolute -right-8 -top-8 h-32 w-32 rotate-12 opacity-[0.06]" />
          <p className="text-xs font-bold uppercase tracking-widest text-race-red">Up next</p>
          <h2 className="mt-1 font-display text-2xl font-black text-slate-50">{upNext.name}</h2>
          <p className="text-sm text-slate-400">
            {upNext.circuit} · {formatDateRange(upNext.dateStart, upNext.dateEnd)}
            {upNext.sprint && <span className="ml-2 text-race-gold">Sprint weekend</span>}
          </p>
          {!upNext.results && (
            <div className="mt-2">
              <LockCountdown lockAt={upNext.lockAt} now={now} />
            </div>
          )}
          <Link
            to={`/race/${upNext.id}`}
            className="mt-4 inline-flex rounded-lg bg-race-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600"
          >
            {activePlayer ? 'Make your pick →' : 'View race →'}
          </Link>
        </section>
      )}

      {!activePlayerId && (
        <div className="rounded-xl border border-race-gold/40 bg-race-gold/10 px-4 py-3 text-sm text-race-gold">
          You haven't picked who you are yet — tap the profile button up top to join the grid.
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-slate-100">Upcoming races</h2>
          <Link to="/scoreboard" className="text-xs font-semibold text-slate-500 hover:text-slate-300">
            Past races & results →
          </Link>
        </div>
        {upcomingRaces.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="That's the season!"
            subtitle="Every race has been run — check Scoreboard for the final standings and every race's breakdown."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {upcomingRaces.map((race) => {
              const submitted = submittedByRace.get(race.id) ?? new Set()
              return (
                <RaceCard
                  key={race.id}
                  race={race}
                  totalPlayers={players.length}
                  submittedCount={submitted.size}
                  hasSubmitted={activePlayerId ? submitted.has(activePlayerId) : false}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
