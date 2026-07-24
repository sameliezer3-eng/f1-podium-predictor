import { useState } from 'react'
import { deleteDriver, upsertDriver } from '../../firebase/api'
import { TEAMS } from '../../data/seedData'
import TeamChip from '../ui/TeamChip'

function DriverRow({ driver }) {
  const [form, setForm] = useState(driver)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const dirty = JSON.stringify(form) !== JSON.stringify(driver)

  const handleTeamChange = (team) => {
    const known = TEAMS.find((t) => t.name === team)
    setForm((f) => ({ ...f, team, teamColor: known?.color || f.teamColor }))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await upsertDriver(driver.id, {
        name: form.name,
        team: form.team,
        teamColor: form.teamColor,
        active: form.active,
        code: form.code?.trim().toUpperCase() || null,
      })
    } catch (err) {
      console.error('Driver save failed:', err.code, err.message, err)
      setError(err.code === 'permission-denied' ? "Couldn't save — permissions issue." : "Couldn't save — try again.")
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm(`Remove ${driver.name} from the grid?`)) return
    setError(null)
    try {
      await deleteDriver(driver.id)
    } catch (err) {
      console.error('Driver remove failed:', err.code, err.message, err)
      setError(err.code === 'permission-denied' ? "Couldn't remove — permissions issue." : "Couldn't remove — try again.")
    }
  }

  return (
    <div className="grid grid-cols-1 items-center gap-2 rounded-xl border border-track-700 bg-track-900 p-3 sm:grid-cols-[1fr_1fr_5rem_auto_auto_auto]">
      <input
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="rounded-lg border border-track-600 bg-track-800 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-race-red"
      />
      <input
        value={form.team}
        list="team-names"
        onChange={(e) => handleTeamChange(e.target.value)}
        className="rounded-lg border border-track-600 bg-track-800 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-race-red"
      />
      <input
        value={form.code || ''}
        onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
        placeholder="COD"
        maxLength={3}
        title="3-letter code used in the compact picks comparison"
        className="rounded-lg border border-track-600 bg-track-800 px-2.5 py-1.5 text-center text-sm uppercase tracking-widest text-slate-100 outline-none focus:border-race-red"
      />
      <input
        type="color"
        value={form.teamColor}
        onChange={(e) => setForm((f) => ({ ...f, teamColor: e.target.value }))}
        className="h-8 w-10 rounded border border-track-600 bg-track-800"
      />
      <TeamChip team={form.team} color={form.teamColor} className="justify-self-start" />
      <div className="flex items-center gap-2 justify-self-end">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="rounded-lg bg-race-red/90 px-3 py-1.5 text-xs font-bold uppercase text-white transition hover:bg-race-red disabled:opacity-30"
        >
          Save
        </button>
        <button onClick={remove} className="rounded-lg border border-track-600 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-race-red hover:text-race-red">
          Remove
        </button>
      </div>
      {error && <p className="text-xs text-race-red sm:col-span-5">{error}</p>}
    </div>
  )
}

export default function DriverGridEditor({ drivers }) {
  const [newDriver, setNewDriver] = useState({ name: '', team: TEAMS[0].name, teamColor: TEAMS[0].color, code: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newDriver.name.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      await upsertDriver(null, {
        ...newDriver,
        name: newDriver.name.trim(),
        code: newDriver.code.trim().toUpperCase() || null,
        active: true,
      })
      setNewDriver({ name: '', team: TEAMS[0].name, teamColor: TEAMS[0].color, code: '' })
    } catch (err) {
      console.error('Add driver failed:', err.code, err.message, err)
      setAddError(err.code === 'permission-denied' ? "Couldn't add — permissions issue." : "Couldn't add — try again.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <datalist id="team-names">
        {TEAMS.map((t) => (
          <option key={t.name} value={t.name} />
        ))}
      </datalist>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-track-600 p-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">New driver</span>
          <input
            value={newDriver.name}
            onChange={(e) => setNewDriver((d) => ({ ...d, name: e.target.value }))}
            placeholder="Driver name"
            className="rounded-lg border border-track-600 bg-track-800 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-race-red"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Team</span>
          <select
            value={newDriver.team}
            onChange={(e) => {
              const team = TEAMS.find((t) => t.name === e.target.value)
              setNewDriver((d) => ({ ...d, team: team.name, teamColor: team.color }))
            }}
            className="rounded-lg border border-track-600 bg-track-800 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-race-red"
          >
            {TEAMS.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Code</span>
          <input
            value={newDriver.code}
            onChange={(e) => setNewDriver((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
            placeholder="COD"
            maxLength={3}
            title="3-letter code used in the compact picks comparison"
            className="w-16 rounded-lg border border-track-600 bg-track-800 px-2.5 py-1.5 text-center text-sm uppercase tracking-widest text-slate-100 outline-none focus:border-race-red"
          />
        </label>
        <button
          type="submit"
          disabled={!newDriver.name.trim() || adding}
          className="rounded-lg bg-race-red px-4 py-1.5 text-sm font-bold uppercase text-white transition hover:bg-red-600 disabled:opacity-40"
        >
          Add driver
        </button>
        {addError && <span className="text-xs text-race-red">{addError}</span>}
      </form>

      <div className="flex flex-col gap-2">
        {drivers.map((d) => (
          <DriverRow key={d.id} driver={d} />
        ))}
      </div>
    </div>
  )
}
