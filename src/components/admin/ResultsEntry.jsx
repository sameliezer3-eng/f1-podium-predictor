import { useEffect, useState } from 'react'
import DriverSelect from '../ui/DriverSelect'
import Modal from '../ui/Modal'
import {
  clearRaceResults,
  submitPoleResult,
  submitFastestLapResult,
  submitRaceResult,
  submitSprintResults,
} from '../../firebase/api'
import { getRaceStatus } from '../../lib/raceStatus'

// A single-driver bonus pick (pole, fastest lap) — its own value, its own
// dirty check, its own save action. Saving one of these never requires or
// touches the other sections; see the submit* functions in firebase/api.js.
function SingleDriverSection({ title, drivers, savedValue, onSave }) {
  const [value, setValue] = useState(savedValue)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    setValue(savedValue)
    setStatus(null)
  }, [savedValue])

  const dirty = value !== savedValue

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      await onSave(value)
      setStatus('Saved.')
    } catch (err) {
      console.error(`${title} save failed:`, err.code, err.message, err)
      setStatus(err.code === 'permission-denied' ? "Couldn't save — permissions issue." : "Couldn't save — try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-track-700 bg-track-950 p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</span>
      <DriverSelect drivers={drivers} value={value} onChange={setValue} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="rounded-lg bg-race-red px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
        >
          {saving ? 'Saving…' : savedValue ? 'Update' : 'Save'}
        </button>
        {status && <span className="text-xs text-slate-400">{status}</span>}
      </div>
    </div>
  )
}

// A P1/P2/P3 podium result (sprint, race) — same independence as above, just
// three slots that all need filling before this section's save enables.
function PodiumResultSection({ title, drivers, savedValues, onSave }) {
  const [values, setValues] = useState(savedValues)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    setValues(savedValues)
    setStatus(null)
  }, [savedValues.p1, savedValues.p2, savedValues.p3]) // eslint-disable-line react-hooks/exhaustive-deps

  const podiumIds = [values.p1, values.p2, values.p3].filter(Boolean)
  const complete = Boolean(values.p1 && values.p2 && values.p3)
  const dirty = values.p1 !== savedValues.p1 || values.p2 !== savedValues.p2 || values.p3 !== savedValues.p3

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      await onSave(values)
      setStatus('Saved.')
    } catch (err) {
      console.error(`${title} save failed:`, err.code, err.message, err)
      setStatus(err.code === 'permission-denied' ? "Couldn't save — permissions issue." : "Couldn't save — try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-track-700 bg-track-950 p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {['p1', 'p2', 'p3'].map((slot, i) => (
          <DriverSelect
            key={slot}
            drivers={drivers}
            label={`P${i + 1}`}
            value={values[slot]}
            excludeIds={podiumIds.filter((id) => id !== values[slot])}
            onChange={(v) => setValues((s) => ({ ...s, [slot]: v }))}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!complete || !dirty || saving}
          className="rounded-lg bg-race-red px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
        >
          {saving ? 'Saving…' : savedValues.p1 ? 'Update' : 'Save'}
        </button>
        {status && <span className="text-xs text-slate-400">{status}</span>}
      </div>
    </div>
  )
}

export default function ResultsEntry({ races, drivers, scoringSettings }) {
  const eligible = races.filter((r) => getRaceStatus(r) !== 'open')
  const [raceId, setRaceId] = useState('')
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState(null)

  const race = races.find((r) => r.id === raceId)

  const handleClear = async () => {
    setClearing(true)
    setClearError(null)
    try {
      await clearRaceResults(raceId)
      setConfirmingClear(false)
    } catch (err) {
      console.error('Clear results failed:', err.code, err.message, err)
      setClearError(err.code === 'permission-denied' ? "Couldn't clear — a permissions issue on our end, not yours." : "Couldn't clear — try again in a moment.")
    } finally {
      setClearing(false)
    }
  }

  const enteredSummary = (r) => {
    if (!r.results) return ''
    const parts = []
    if (r.sprint && r.results.sprintP1 && r.results.sprintP2 && r.results.sprintP3) parts.push('sprint')
    if (r.results.p1 && r.results.p2 && r.results.p3) parts.push('race')
    if (r.results.pole) parts.push('pole')
    if (r.results.fastestLap) parts.push('f.lap')
    return parts.length ? ` (${parts.join(', ')} in)` : ''
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500">
        Pole, sprint, race, and fastest lap each save (and score) on their own — enter whichever one you know first,
        the rest can follow later as the weekend unfolds.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Race</span>
        <select
          value={raceId}
          onChange={(e) => setRaceId(e.target.value)}
          className="rounded-lg border border-track-600 bg-track-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-race-red"
        >
          <option value="">Select a locked or completed race…</option>
          {eligible.map((r) => (
            <option key={r.id} value={r.id}>
              Round {r.order} · {r.name}{enteredSummary(r)}
            </option>
          ))}
        </select>
        {eligible.length === 0 && (
          <span className="text-xs text-slate-500">No races are locked yet — results can be entered once a weekend starts.</span>
        )}
      </label>

      {race && (
        <div className="flex flex-col gap-4">
          {scoringSettings.bonusPicksEnabled && (
            <SingleDriverSection
              title="Pole position"
              drivers={drivers}
              savedValue={race.results?.pole || null}
              onSave={(pole) => submitPoleResult(race.id, pole, scoringSettings)}
            />
          )}

          {race.sprint && (
            <PodiumResultSection
              title="Sprint result"
              drivers={drivers}
              savedValues={{
                p1: race.results?.sprintP1 || null,
                p2: race.results?.sprintP2 || null,
                p3: race.results?.sprintP3 || null,
              }}
              onSave={(values) => submitSprintResults(race.id, values, scoringSettings)}
            />
          )}

          <PodiumResultSection
            title="Grand Prix result"
            drivers={drivers}
            savedValues={{
              p1: race.results?.p1 || null,
              p2: race.results?.p2 || null,
              p3: race.results?.p3 || null,
            }}
            onSave={(values) => submitRaceResult(race.id, values, scoringSettings)}
          />

          {scoringSettings.bonusPicksEnabled && (
            <SingleDriverSection
              title="Fastest lap"
              drivers={drivers}
              savedValue={race.results?.fastestLap || null}
              onSave={(fastestLap) => submitFastestLapResult(race.id, fastestLap, scoringSettings)}
            />
          )}

          {race.results && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setClearError(null)
                  setConfirmingClear(true)
                }}
                className="rounded-lg border border-track-600 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-race-red hover:text-race-red"
              >
                Clear all results
              </button>
            </div>
          )}
        </div>
      )}

      {confirmingClear && (
        <Modal title="Clear all results" onClose={() => !clearing && setConfirmingClear(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">
              Clear every result for <strong>{race?.name}</strong> — pole, sprint, race, and fastest lap all at once —
              and un-score every prediction for this race? Players keep their picks — only the results and everyone's
              points are removed. You can re-enter results later to re-score.
            </p>
            {clearError && (
              <p className="rounded-lg border border-race-red/30 bg-race-red/10 px-3 py-2 text-sm text-race-red">
                {clearError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClear}
                disabled={clearing}
                className="rounded-lg bg-race-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
              >
                {clearing ? 'Clearing…' : 'Clear all results'}
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                disabled={clearing}
                className="text-sm text-slate-400 hover:text-slate-200 disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
