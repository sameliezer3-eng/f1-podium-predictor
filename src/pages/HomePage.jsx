import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRaces, usePlayers, useAllSubmissions } from '../hooks/useAppData'
import { usePlayerContext } from '../context/PlayerContext'
import { nextUpcomingRace, formatDateRange } from '../lib/raceStatus'
import RaceCard from '../components/race/RaceCard'
import EmptyState from '../components/ui/EmptyState'

export default function HomePage() {
  const { data: races, loading } = useRaces()
  const { data: players } = usePlayers()
  const { data: submissions } = useAllSubmissions()
  const { activePlayerId, activePlayer } = usePlayerContext()

  const upNext = useMemo(() => nextUpcomingRace(races), [races])

  const submittedByRace = useMemo(() => {
    const map = new Map()
    for (const s of submissions) {
      if (!map.has(s.parentId)) map.set(s.parentId, new Set())
      map.get(s.parentId).add(s.playerId)
    }
    return map
  }, [submissions])

  if (loading) return <p className="py-16 text-center text-slate-500">Loading the calendar…</p>

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
        <h2 className="mb-3 font-display text-lg font-bold text-slate-100">2026 Calendar</h2>
        <div className="flex flex-col gap-2.5">
          {races.map((race) => {
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
      </section>
    </div>
  )
}
