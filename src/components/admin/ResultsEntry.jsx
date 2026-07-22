import { useEffect, useState } from 'react'
import DriverSelect from '../ui/DriverSelect'
import Modal from '../ui/Modal'
import { clearRaceResults, submitRaceResults } from '../../firebase/api'
import { getRaceStatus } from '../../lib/raceStatus'

export default function ResultsEntry({ races, drivers, scoringSettings }) {
  const eligible = races.filter((r) => getRaceStatus(r) !== 'open')
  const [raceId, setRaceId] = useState('')
  const [form, setForm] = useState({ p1: null, p2: null, p3: null, pole: null, fastestLap: null })
  const [status, setStatus] = useState('idle')
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState(null)

  const race = races.find((r) => r.id === raceId)

  useEffect(() => {
    if (race?.results) {
      setForm({
        p1: race.results.p1 || null,
        p2: race.results.p2 || null,
        p3: race.results.p3 || null,
        pole: race.results.pole || null,
        fastestLap: race.results.fastestLap || null,
      })
    } else {
      setForm({ p1: null, p2: null, p3: null, pole: null, fastestLap: null })
    }
  }, [raceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const podiumIds = [form.p1, form.p2, form.p3].filter(Boolean)
  const complete = form.p1 && form.p2 && form.p3

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!raceId || !complete) return
    setStatus('saving')
    try {
      const count = await submitRaceResults(raceId, form, scoringSettings)
      setStatus(`Scored ${count} prediction${count === 1 ? '' : 's'}.`)
    } catch (err) {
      console.error('Results save failed:', err.code, err.message, err)
      setStatus(err.code === 'permission-denied' ? "Couldn't save — a permissions issue on our end, not yours." : 'Failed to save — see console.')
    }
  }

  const handleClear = async () => {
    setClearing(true)
    setClearError(null)
    try {
      await clearRaceResults(raceId)
      setForm({ p1: null, p2: null, p3: null, pole: null, fastestLap: null })
      setStatus('Cleared.')
      setConfirmingClear(false)
    } catch (err) {
      console.error('Clear results failed:', err.code, err.message, err)
      setClearError(err.code === 'permission-denied' ? "Couldn't clear — a permissions issue on our end, not yours." : "Couldn't clear — try again in a moment.")
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Race</span>
        <select
          value={raceId}
          onChange={(e) => {
            setRaceId(e.target.value)
            setStatus('idle')
          }}
          className="rounded-lg border border-track-600 bg-track-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-race-red"
        >
          <option value="">Select a locked or completed race…</option>
          {eligible.map((r) => (
            <option key={r.id} value={r.id}>
              Round {r.order} · {r.name} {r.results ? '(results entered)' : ''}
            </option>
          ))}
        </select>
        {eligible.length === 0 && (
          <span className="text-xs text-slate-500">No races are locked yet — results can be entered once a weekend starts.</span>
        )}
      </label>

      {race && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-track-700 bg-track-950 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {['p1', 'p2', 'p3'].map((slot, i) => (
              <DriverSelect
                key={slot}
                drivers={drivers}
                label={`P${i + 1}`}
                value={form[slot]}
                excludeIds={podiumIds.filter((id) => id !== form[slot])}
                onChange={(v) => setForm((f) => ({ ...f, [slot]: v }))}
              />
            ))}
          </div>
          {scoringSettings.bonusPicksEnabled && (
            <div className="grid grid-cols-1 gap-3 border-t border-track-700 pt-4 sm:grid-cols-2">
              <DriverSelect
                drivers={drivers}
                label="Pole position"
                value={form.pole}
                onChange={(v) => setForm((f) => ({ ...f, pole: v }))}
              />
              <DriverSelect
                drivers={drivers}
                label="Fastest lap"
                value={form.fastestLap}
                onChange={(v) => setForm((f) => ({ ...f, fastestLap: v }))}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!complete || status === 'saving'}
              className="rounded-lg bg-race-red px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
            >
              {race.results ? 'Update & rescore' : 'Save results & score'}
            </button>
            {race.results && (
              <button
                type="button"
                onClick={() => {
                  setClearError(null)
                  setConfirmingClear(true)
                }}
                className="rounded-lg border border-track-600 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-race-red hover:text-race-red"
              >
                Clear results
              </button>
            )}
            {status !== 'idle' && status !== 'saving' && <span className="text-sm text-slate-400">{status}</span>}
          </div>
        </form>
      )}

      {confirmingClear && (
        <Modal title="Clear results" onClose={() => !clearing && setConfirmingClear(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">
              Clear the results for <strong>{race?.name}</strong> and un-score every prediction for this race? Players
              keep their picks — only the actual result and everyone's points are removed. You can re-enter results
              later to re-score.
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
                {clearing ? 'Clearing…' : 'Clear results'}
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
