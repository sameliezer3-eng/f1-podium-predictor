import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { adminOverridePrediction, predictionId } from '../../firebase/api'
import DriverSelect from '../ui/DriverSelect'
import { toDate } from '../../lib/raceStatus'

const EMPTY_PICKS = { p1: null, p2: null, p3: null, pole: null, fastestLap: null, sprintP1: null, sprintP2: null, sprintP3: null }

export default function PredictionOverride({ players, races, drivers, scoringSettings }) {
  const [playerId, setPlayerId] = useState('')
  const [raceId, setRaceId] = useState('')
  const [picks, setPicks] = useState(EMPTY_PICKS)
  const [existing, setExisting] = useState(null)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('idle')

  const race = races.find((r) => r.id === raceId)

  useEffect(() => {
    if (!playerId || !raceId) {
      setExisting(null)
      setPicks(EMPTY_PICKS)
      return
    }
    setLoadingExisting(true)
    setStatus('idle')
    getDoc(doc(db, 'predictions', predictionId(raceId, playerId)))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setExisting(data)
          setPicks({
            p1: data.p1 || null,
            p2: data.p2 || null,
            p3: data.p3 || null,
            pole: data.pole || null,
            fastestLap: data.fastestLap || null,
            sprintP1: data.sprintPredictedP1 || null,
            sprintP2: data.sprintPredictedP2 || null,
            sprintP3: data.sprintPredictedP3 || null,
          })
        } else {
          setExisting(null)
          setPicks(EMPTY_PICKS)
        }
      })
      .finally(() => setLoadingExisting(false))
  }, [playerId, raceId])

  const podiumIds = [picks.p1, picks.p2, picks.p3].filter(Boolean)
  const sprintPodiumIds = [picks.sprintP1, picks.sprintP2, picks.sprintP3].filter(Boolean)
  // Saveable in two states: a normal complete pick, or a deliberate full
  // clear back to "Select driver..." on all three — a mixed/partial state
  // (e.g. two filled, one empty) is neither and stays disabled.
  const allFilled = picks.p1 && picks.p2 && picks.p3
  const allCleared = !picks.p1 && !picks.p2 && !picks.p3
  const complete = allFilled || allCleared

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatus('idle')
    try {
      await adminOverridePrediction({
        raceId,
        playerId,
        ...picks,
        raceResults: race?.results ?? null,
        scoringSettings,
      })
      setStatus(race?.results ? 'Saved and rescored.' : 'Saved.')
    } catch (err) {
      // Log the real code/message on its own line — the raw error object
      // alone is easy to miss in the console, and "see console" is only
      // useful if what's there actually says something.
      console.error('Admin override failed:', err.name, err.code, err.message, err)
      if (err.phase === 'rescore') {
        setStatus('Pick saved, but re-scoring failed — try saving again to retry just the points.')
      } else if (err.phase === 'sprint-rescore') {
        setStatus('Pick saved, but sprint re-scoring failed — try saving again to retry just the sprint points.')
      } else if (err.code === 'permission-denied') {
        setStatus("Couldn't save — a permissions issue on our end, not yours.")
      } else {
        setStatus('Failed to save — see console.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500">
        Directly set any player's pick for any race, locked or not. Every override is stamped and shown publicly —
        this isn't a quiet edit.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Player</span>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="rounded-lg border border-track-600 bg-track-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-race-red"
          >
            <option value="">Select a player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Race</span>
          <select
            value={raceId}
            onChange={(e) => setRaceId(e.target.value)}
            className="rounded-lg border border-track-600 bg-track-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-race-red"
          >
            <option value="">Select a race…</option>
            {races.map((r) => (
              <option key={r.id} value={r.id}>
                Round {r.order} · {r.name} {r.results ? '(scored)' : toDate(r.lockAt) <= new Date() ? '(locked)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {playerId && raceId && (
        <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-xl border border-track-700 bg-track-950 p-4">
          {loadingExisting ? (
            <p className="text-sm text-slate-500">Loading current pick…</p>
          ) : (
            <>
              {existing?.adminOverride && (
                <p className="rounded-lg border border-race-gold/30 bg-race-gold/10 px-3 py-2 text-xs text-race-gold">
                  This pick was already admin-overridden {existing.overriddenAt ? 'previously' : ''}. Saving again
                  updates the record and marker.
                </p>
              )}

              {race?.sprint && (
                <div className="flex flex-col gap-3 rounded-lg border border-track-700 bg-track-900 p-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-race-gold">Sprint pick</span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {['sprintP1', 'sprintP2', 'sprintP3'].map((slot, i) => (
                      <DriverSelect
                        key={slot}
                        drivers={drivers}
                        label={`Sprint P${i + 1}`}
                        value={picks[slot]}
                        excludeIds={sprintPodiumIds.filter((id) => id !== picks[slot])}
                        onChange={(v) => setPicks((p) => ({ ...p, [slot]: v }))}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {race?.sprint && <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Grand Prix pick</span>}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {['p1', 'p2', 'p3'].map((slot, i) => (
                    <DriverSelect
                      key={slot}
                      drivers={drivers}
                      label={`P${i + 1}`}
                      value={picks[slot]}
                      excludeIds={podiumIds.filter((id) => id !== picks[slot])}
                      onChange={(v) => setPicks((p) => ({ ...p, [slot]: v }))}
                    />
                  ))}
                </div>
              </div>

              {scoringSettings.bonusPicksEnabled && (
                <div className="grid grid-cols-1 gap-3 border-t border-track-700 pt-4 sm:grid-cols-2">
                  <DriverSelect
                    drivers={drivers}
                    label="Pole position"
                    value={picks.pole}
                    onChange={(v) => setPicks((p) => ({ ...p, pole: v }))}
                  />
                  <DriverSelect
                    drivers={drivers}
                    label="Fastest lap"
                    value={picks.fastestLap}
                    onChange={(v) => setPicks((p) => ({ ...p, fastestLap: v }))}
                  />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!complete || saving}
                  className="rounded-lg bg-race-red px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save override'}
                </button>
                {status !== 'idle' && <span className="text-sm text-slate-400">{status}</span>}
              </div>
            </>
          )}
        </form>
      )}
    </div>
  )
}
