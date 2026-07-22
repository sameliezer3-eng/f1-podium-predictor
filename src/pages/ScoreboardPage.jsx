import { useMemo, useState } from 'react'
import { useDrivers, usePlayers, useRaces, useSeasonPredictions } from '../hooks/useAppData'
import { aggregatePlayerStats } from '../lib/scoring'
import Podium from '../components/scoreboard/Podium'
import StandingsTable from '../components/scoreboard/StandingsTable'
import TrendChart from '../components/scoreboard/TrendChart'
import RacePodiumMini from '../components/scoreboard/RacePodiumMini'
import PredictionsGrid from '../components/race/PredictionsGrid'
import EmptyState from '../components/ui/EmptyState'
import LoadingScreen from '../components/ui/LoadingScreen'

export default function ScoreboardPage() {
  const { data: races, loading: racesLoading } = useRaces()
  const { data: players } = usePlayers()
  const { data: drivers } = useDrivers()
  const { data: seasonPredictions } = useSeasonPredictions(races)

  const completedRaces = useMemo(
    () => races.filter((r) => r.results).sort((a, b) => a.order - b.order),
    [races],
  )
  const driversById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers])

  const standings = useMemo(() => {
    const byPlayer = new Map(players.map((p) => [p.id, []]))
    for (const pred of seasonPredictions) {
      if (!byPlayer.has(pred.playerId)) continue
      byPlayer.get(pred.playerId).push(pred)
    }
    return players
      .map((player) => ({ player, ...aggregatePlayerStats(byPlayer.get(player.id) ?? []) }))
      .sort((a, b) => b.totalPoints - a.totalPoints || b.accuracy - a.accuracy)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))
  }, [players, seasonPredictions])

  const trendData = useMemo(() => {
    const running = new Map(players.map((p) => [p.id, 0]))
    return completedRaces.map((race) => {
      const point = { label: `R${race.order}` }
      for (const player of players) {
        const pred = seasonPredictions.find((p) => p.raceId === race.id && p.playerId === player.id)
        running.set(player.id, running.get(player.id) + (pred?.points || 0))
        point[player.id] = running.get(player.id)
      }
      return point
    })
  }, [completedRaces, players, seasonPredictions])

  const [selectedRaceId, setSelectedRaceId] = useState('')
  const selectedRace = completedRaces.find((r) => r.id === selectedRaceId)
  const selectedRacePredictions = seasonPredictions.filter((p) => p.raceId === selectedRaceId)

  if (racesLoading) return <LoadingScreen message="Loading standings…" />

  if (players.length === 0) {
    return <EmptyState icon="🏆" title="No players yet" subtitle="Add players from the profile picker to start a season." />
  }

  if (completedRaces.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          icon="🏁"
          title="No results in yet — be the first on the grid!"
          subtitle="Once an admin enters results for a race, the podium and standings will come alive here."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <Podium standings={standings} />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-slate-100">Full standings</h2>
        <StandingsTable standings={standings} />
      </section>

      <section>
        <TrendChart data={trendData} players={players} />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-slate-100">Race-by-race breakdown</h2>
          <select
            value={selectedRaceId}
            onChange={(e) => setSelectedRaceId(e.target.value)}
            className="rounded-lg border border-track-600 bg-track-800 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-race-red"
          >
            <option value="">Pick a race…</option>
            {completedRaces.map((r) => (
              <option key={r.id} value={r.id}>
                Round {r.order} · {r.name}
              </option>
            ))}
          </select>
        </div>

        {selectedRace ? (
          <div className="flex flex-col gap-4">
            <RacePodiumMini
              race={selectedRace}
              players={players}
              predictions={selectedRacePredictions}
              driversById={driversById}
            />
            <PredictionsGrid
              players={players}
              predictions={selectedRacePredictions}
              driversById={driversById}
              results={selectedRace.results}
              bonusEnabled
            />
          </div>
        ) : (
          <EmptyState icon="🔍" title="Pick a race above" subtitle="See exactly who called it right, round by round." />
        )}
      </section>
    </div>
  )
}
