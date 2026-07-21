import { useEffect, useState } from 'react'
import { updateScoringSettings } from '../../firebase/api'

const FIELDS = [
  { key: 'exactPosition', label: 'Exact position match', hint: 'Driver guessed in the exact slot' },
  { key: 'correctPodiumWrongSlot', label: 'Correct podium, wrong slot', hint: 'Driver was top 3, just not there' },
  { key: 'winnerBonus', label: 'Race winner bonus', hint: 'Extra points for calling P1 correctly' },
]

const BONUS_FIELDS = [
  { key: 'poleBonus', label: 'Pole position bonus' },
  { key: 'fastestLapBonus', label: 'Fastest lap bonus' },
]

export default function ScoringSettings({ settings }) {
  const [form, setForm] = useState(settings)
  const [status, setStatus] = useState('idle')

  useEffect(() => setForm(settings), [settings])

  const dirty = JSON.stringify(form) !== JSON.stringify(settings)

  const handleSave = async (e) => {
    e.preventDefault()
    setStatus('saving')
    await updateScoringSettings(form)
    setStatus('Saved.')
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1.5 rounded-xl border border-track-700 bg-track-900 p-4">
            <span className="text-sm font-semibold text-slate-100">{f.label}</span>
            <span className="text-xs text-slate-500">{f.hint}</span>
            <input
              type="number"
              min={0}
              value={form[f.key]}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: Number(e.target.value) }))}
              className="mt-1 w-24 rounded-lg border border-track-600 bg-track-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-race-red"
            />
          </label>
        ))}
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-track-700 bg-track-900 p-4">
        <input
          type="checkbox"
          checked={form.bonusPicksEnabled}
          onChange={(e) => setForm((s) => ({ ...s, bonusPicksEnabled: e.target.checked }))}
          className="h-4 w-4 accent-race-red"
        />
        <span className="text-sm font-semibold text-slate-100">Enable pole position / fastest lap bonus picks</span>
      </label>

      {form.bonusPicksEnabled && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BONUS_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5 rounded-xl border border-track-700 bg-track-900 p-4">
              <span className="text-sm font-semibold text-slate-100">{f.label}</span>
              <input
                type="number"
                min={0}
                value={form[f.key]}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: Number(e.target.value) }))}
                className="mt-1 w-24 rounded-lg border border-track-600 bg-track-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-race-red"
              />
            </label>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!dirty || status === 'saving'}
          className="rounded-lg bg-race-red px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
        >
          Save scoring rules
        </button>
        {status !== 'idle' && !dirty && <span className="text-sm text-slate-400">{status}</span>}
      </div>
      <p className="text-xs text-slate-500">
        Changes only affect races scored from now on — already-scored predictions keep their points until that race's
        results are re-entered.
      </p>
    </form>
  )
}
