import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  useDrivers,
  useMyPrediction,
  usePlayers,
  usePredictionsForRace,
  useRaceSubmissions,
  useScoringSettings,
} from '../hooks/useAppData'
import { useDocument } from '../hooks/useFirestore'
import { usePlayerContext } from '../context/PlayerContext'
import { getRaceStatus, formatDateRange } from '../lib/raceStatus'
import StatusPill from '../components/race/StatusPill'
import PredictionForm from '../components/race/PredictionForm'
import SubmissionStatus from '../components/race/SubmissionStatus'
import PredictionsGrid from '../components/race/PredictionsGrid'
import RacePodiumMini from '../components/scoreboard/RacePodiumMini'
import EmptyState from '../components/ui/EmptyState'
import LoadingScreen from '../components/ui/LoadingScreen'

export default function RacePage() {
  const { raceId } = useParams()
  const { data: race, loading } = useDocument('races', raceId)
  const { data: drivers } = useDrivers()
  const { data: players } = usePlayers()
  const { activePlayer } = usePlayerContext()
  const { data: scoringSettings } = useScoringSettings()

  const status = race ? getRaceStatus(race) : null
  const { data: myPrediction } = useMyPrediction(raceId, activePlayer?.id)
  const { data: submissions } = useRaceSubmissions(raceId)
  const { data: allPredictions } = usePredictionsForRace(raceId, status !== 'open')

  const driversById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers])

  if (loading) return <LoadingScreen message="Loading race…" />
  if (!race) {
    return <EmptyState icon="🚧" title="Can't find that race" subtitle="It may have been removed from the calendar." />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-300">← Back to calendar</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-black text-slate-50">
                Round {race.order} · {race.name}
              </h1>
              {race.sprint && (
                <span className="rounded bg-race-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-race-gold">
                  Sprint
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              {race.circuit} · {formatDateRange(race.dateStart, race.dateEnd)}
            </p>
          </div>
          <StatusPill status={status} />
        </div>
      </div>

      {status === 'completed' && (
        <RacePodiumMini race={race} players={players} predictions={allPredictions} driversById={driversById} />
      )}

      {status === 'open' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
          {activePlayer ? (
            <PredictionForm
              race={race}
              player={activePlayer}
              drivers={drivers}
              existingPrediction={myPrediction}
              scoringSettings={scoringSettings}
            />
          ) : (
            <EmptyState
              icon="👋"
              title="Pick who you are first"
              subtitle="Tap the profile button in the top bar to join the grid, then come back to predict this race."
            />
          )}
          <SubmissionStatus players={players} submissions={submissions} />
        </div>
      )}

      {(status === 'locked' || status === 'completed') && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-slate-100">
            {status === 'locked' ? "Everyone's picks (locked in)" : "Everyone's picks vs. the result"}
          </h2>
          {allPredictions.length === 0 ? (
            <EmptyState icon="🦗" title="Nobody predicted this one" subtitle="Radio silence from the whole grid." />
          ) : (
            <PredictionsGrid
              players={players}
              predictions={allPredictions}
              driversById={driversById}
              results={race.results}
              bonusEnabled={scoringSettings.bonusPicksEnabled}
            />
          )}
        </section>
      )}
    </div>
  )
}
