import { useEffect, useState } from 'react'
import DriverSelect from '../ui/DriverSelect'
import { upsertPrediction } from '../../firebase/api'
import { useRestoreStatus } from '../../hooks/useAppData'

const EMPTY_PICKS = { p1: null, p2: null, p3: null, pole: null, fastestLap: null, sprintP1: null, sprintP2: null, sprintP3: null }

function shapeFromPrediction(prediction) {
  return {
    p1: prediction?.p1 || null,
    p2: prediction?.p2 || null,
    p3: prediction?.p3 || null,
    pole: prediction?.pole || null,
    fastestLap: prediction?.fastestLap || null,
    sprintP1: prediction?.sprintPredictedP1 || null,
    sprintP2: prediction?.sprintPredictedP2 || null,
    sprintP3: prediction?.sprintPredictedP3 || null,
  }
}

export default function PredictionForm({ race, player, drivers, existingPrediction, scoringSettings }) {
  const [picks, setPicks] = useState(EMPTY_PICKS)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState(null)
  const restoreInProgress = useRestoreStatus()

  useEffect(() => {
    if (existingPrediction) setPicks(shapeFromPrediction(existingPrediction))
  }, [existingPrediction?.id])

  const mainPodiumIds = [picks.p1, picks.p2, picks.p3].filter(Boolean)
  const sprintPodiumIds = [picks.sprintP1, picks.sprintP2, picks.sprintP3].filter(Boolean)
  const mainComplete = Boolean(picks.p1 && picks.p2 && picks.p3)
  const sprintComplete = Boolean(picks.sprintP1 && picks.sprintP2 && picks.sprintP3)
  // On a sprint weekend both podiums lock at the same moment (see the
  // simplification note below), so there's nothing to gain from letting one
  // half submit without the other — require both before enabling submit,
  // same as the plain-race form already requires all 3 main slots.
  const complete = mainComplete && (!race.sprint || sprintComplete)

  const dirty = existingPrediction
    ? JSON.stringify(picks) !== JSON.stringify(shapeFromPrediction(existingPrediction))
    : Object.values(picks).some(Boolean)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await upsertPrediction({ raceId: race.id, playerId: player.id, ...picks, isSprint: race.sprint })
      setSavedAt(new Date())
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 rounded-2xl border border-track-700 bg-track-900 p-5">
      {race.sprint ? (
        <>
          <div>
            <h3 className="font-display text-base font-bold text-slate-100">Your picks for this weekend</h3>
            <p className="text-xs text-slate-500">
              Sprint weekend — the sprint and the Grand Prix both count toward your score. Both lock at the same time
              (weekend start), so submit both together.
            </p>
          </div>

          <PredictionSection
            title="🏃 Sprint — Predict Top 3"
            complete={sprintComplete}
            picks={[picks.sprintP1, picks.sprintP2, picks.sprintP3]}
          >
            {['sprintP1', 'sprintP2', 'sprintP3'].map((key, i) => (
              <PodiumSlot key={key} label={`${['🥇', '🥈', '🥉'][i]} P${i + 1}`}>
                <DriverSelect
                  drivers={drivers}
                  value={picks[key]}
                  excludeIds={sprintPodiumIds.filter((id) => id !== picks[key])}
                  onChange={(v) => setPicks((p) => ({ ...p, [key]: v }))}
                />
              </PodiumSlot>
            ))}
          </PredictionSection>

          <PredictionSection
            title="🏆 Grand Prix — Predict Top 3"
            complete={mainComplete}
            picks={[picks.p1, picks.p2, picks.p3]}
          >
            {['p1', 'p2', 'p3'].map((key, i) => (
              <PodiumSlot key={key} label={`${['🥇', '🥈', '🥉'][i]} P${i + 1}`}>
                <DriverSelect
                  drivers={drivers}
                  value={picks[key]}
                  excludeIds={mainPodiumIds.filter((id) => id !== picks[key])}
                  onChange={(v) => setPicks((p) => ({ ...p, [key]: v }))}
                />
              </PodiumSlot>
            ))}
          </PredictionSection>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-slate-100">Your podium pick</h3>
            {!mainComplete && <span className="text-xs font-semibold text-race-gold">Pick all 3 to submit</span>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {['p1', 'p2', 'p3'].map((key, i) => (
              <PodiumSlot key={key} label={`${['🥇', '🥈', '🥉'][i]} P${i + 1}`}>
                <DriverSelect
                  drivers={drivers}
                  value={picks[key]}
                  excludeIds={mainPodiumIds.filter((id) => id !== picks[key])}
                  onChange={(v) => setPicks((p) => ({ ...p, [key]: v }))}
                />
              </PodiumSlot>
            ))}
          </div>
        </>
      )}

      {scoringSettings.bonusPicksEnabled && (
        <div className="grid grid-cols-1 gap-3 border-t border-track-700 pt-4 sm:grid-cols-2">
          <DriverSelect
            drivers={drivers}
            value={picks.pole}
            label={`Pole position (+${scoringSettings.poleBonus} bonus)`}
            onChange={(v) => setPicks((p) => ({ ...p, pole: v }))}
          />
          <DriverSelect
            drivers={drivers}
            value={picks.fastestLap}
            label={`Fastest lap (+${scoringSettings.fastestLapBonus} bonus)`}
            onChange={(v) => setPicks((p) => ({ ...p, fastestLap: v }))}
          />
        </div>
      )}

      {restoreInProgress && (
        <p className="rounded-lg border border-race-gold/30 bg-race-gold/10 px-3 py-2 text-sm text-race-gold">
          Data is being restored — try again in a moment.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!complete || saving || !dirty || restoreInProgress}
          className="rounded-lg bg-race-red px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving…' : existingPrediction ? 'Update pick' : 'Submit pick'}
        </button>
        {!dirty && existingPrediction && (
          <span className="text-xs text-race-green">✓ Submitted — you can change this until lockout</span>
        )}
        {savedAt && dirty === false && (
          <span className="text-xs text-slate-500">Saved {savedAt.toLocaleTimeString()}</span>
        )}
      </div>
      {error && <p className="text-sm text-race-red">{error}</p>}
    </form>
  )
}

function PredictionSection({ title, complete, picks, children }) {
  const anyFilled = picks.some(Boolean)
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-track-700 bg-track-950 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm font-bold text-slate-100">{title}</h4>
        {complete ? (
          <span className="text-xs font-semibold text-race-green">✓ Ready</span>
        ) : anyFilled ? (
          <span className="text-xs font-semibold text-race-gold">Pick all 3</span>
        ) : (
          <span className="text-xs text-slate-500">Not started</span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{children}</div>
    </div>
  )
}

function PodiumSlot({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {children}
    </div>
  )
}
