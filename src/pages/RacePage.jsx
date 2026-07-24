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
import { useLiveNow } from '../hooks/useLiveNow'
import { usePlayerContext } from '../context/PlayerContext'
import { getRaceStatus, formatDateRange, toDate } from '../lib/raceStatus'
import StatusPill from '../components/race/StatusPill'
import PredictionForm from '../components/race/PredictionForm'
import SubmissionStatus from '../components/race/SubmissionStatus'
import PredictionsGrid from '../components/race/PredictionsGrid'
import RevealGate from '../components/race/RevealGate'
import LockCountdown from '../components/race/LockCountdown'
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

  const now = useLiveNow(race ? toDate(race.lockAt) : null)
  const status = race ? getRaceStatus(race, now) : null
  const { data: myPrediction } = useMyPrediction(raceId, activePlayer?.id)
  const { data: submissions } = useRaceSubmissions(raceId)

  // "Submitted" here is deliberately just the main P1/P2/P3 (see
  // hasSubmittedMainPodium in firestore.rules, which this mirrors) — that's
  // the bar for unlocking the reveal option, independent of sprint/bonus
  // picks. Revealing (RevealGate → revealPrediction) locks this player's own
  // pick early, well before the race's actual lockAt — see the revealedAt
  // check in PredictionForm and the security rules' update clause.
  const hasSubmittedMain = Boolean(myPrediction?.p1 && myPrediction?.p2 && myPrediction?.p3)
  const hasRevealed = Boolean(myPrediction?.revealedAt)
  // revealLockResetAt sticks around permanently once an admin resets a
  // reveal-lock (see resetRevealLock) as a record of it having happened —
  // only relevant to *show* the player while they haven't re-revealed since
  // (once they do, hasRevealed covers that, so this stops being news).
  const wasResetByAdmin = Boolean(myPrediction?.revealLockResetAt) && !hasRevealed
  const canViewComparison = status === 'locked' || status === 'completed' || hasRevealed
  const { data: allPredictions } = usePredictionsForRace(raceId, canViewComparison)

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
        <>
          <LockCountdown lockAt={race.lockAt} now={now} />
          {activePlayer && wasResetByAdmin && (
            <p className="rounded-lg border border-race-gold/30 bg-race-gold/10 px-3 py-2 text-xs text-race-gold">
              An admin reset your early lock on this pick — you can edit it again below. Viewing everyone's picks
              will lock it in again, same as before.
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
            {activePlayer ? (
              <PredictionForm
                race={race}
                player={activePlayer}
                drivers={drivers}
                existingPrediction={myPrediction}
                scoringSettings={scoringSettings}
                revealed={hasRevealed}
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
          {activePlayer && hasSubmittedMain && !hasRevealed && (
            <RevealGate raceId={raceId} playerId={activePlayer.id} />
          )}
        </>
      )}

      {(status === 'locked' || status === 'completed' || (status === 'open' && hasRevealed)) && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-slate-100">
            {status === 'completed'
              ? "Everyone's picks vs. the result"
              : status === 'locked'
                ? "Everyone's picks (locked in)"
                : "Everyone's picks (before the race)"}
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
              isSprint={race.sprint}
            />
          )}
        </section>
      )}
    </div>
  )
}
