import { useEffect, useState } from 'react'
import DriverSelect from '../ui/DriverSelect'
import { upsertPrediction } from '../../firebase/api'

export default function PredictionForm({ race, player, drivers, existingPrediction, scoringSettings }) {
  const [picks, setPicks] = useState({ p1: null, p2: null, p3: null, pole: null, fastestLap: null })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (existingPrediction) {
      setPicks({
        p1: existingPrediction.p1 || null,
        p2: existingPrediction.p2 || null,
        p3: existingPrediction.p3 || null,
        pole: existingPrediction.pole || null,
        fastestLap: existingPrediction.fastestLap || null,
      })
    }
  }, [existingPrediction?.id])

  const podiumIds = [picks.p1, picks.p2, picks.p3].filter(Boolean)
  const complete = picks.p1 && picks.p2 && picks.p3
  const dirty = existingPrediction
    ? JSON.stringify(picks) !== JSON.stringify({
        p1: existingPrediction.p1 || null,
        p2: existingPrediction.p2 || null,
        p3: existingPrediction.p3 || null,
        pole: existingPrediction.pole || null,
        fastestLap: existingPrediction.fastestLap || null,
      })
    : Boolean(picks.p1 || picks.p2 || picks.p3 || picks.pole || picks.fastestLap)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await upsertPrediction({ raceId: race.id, playerId: player.id, ...picks })
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
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-slate-100">Your podium pick</h3>
        {!complete && <span className="text-xs font-semibold text-race-gold">Pick all 3 to submit</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PodiumSlot label="🥇 P1" value={picks.p1}>
          <DriverSelect
            drivers={drivers}
            value={picks.p1}
            excludeIds={podiumIds.filter((id) => id !== picks.p1)}
            onChange={(v) => setPicks((p) => ({ ...p, p1: v }))}
          />
        </PodiumSlot>
        <PodiumSlot label="🥈 P2" value={picks.p2}>
          <DriverSelect
            drivers={drivers}
            value={picks.p2}
            excludeIds={podiumIds.filter((id) => id !== picks.p2)}
            onChange={(v) => setPicks((p) => ({ ...p, p2: v }))}
          />
        </PodiumSlot>
        <PodiumSlot label="🥉 P3" value={picks.p3}>
          <DriverSelect
            drivers={drivers}
            value={picks.p3}
            excludeIds={podiumIds.filter((id) => id !== picks.p3)}
            onChange={(v) => setPicks((p) => ({ ...p, p3: v }))}
          />
        </PodiumSlot>
      </div>

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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!complete || saving || !dirty}
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

function PodiumSlot({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {children}
    </div>
  )
}
