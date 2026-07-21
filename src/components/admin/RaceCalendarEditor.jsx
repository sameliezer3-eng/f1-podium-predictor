import { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { updateRace } from '../../firebase/api'
import { toDate } from '../../lib/raceStatus'

const toInputDate = (value) => {
  const d = toDate(value)
  return d ? d.toISOString().slice(0, 10) : ''
}

function RaceRow({ race }) {
  const [form, setForm] = useState({
    dateStart: toInputDate(race.dateStart),
    dateEnd: toInputDate(race.dateEnd),
    sprint: race.sprint,
  })
  const [saving, setSaving] = useState(false)

  const dirty =
    form.dateStart !== toInputDate(race.dateStart) ||
    form.dateEnd !== toInputDate(race.dateEnd) ||
    form.sprint !== race.sprint

  const save = async () => {
    setSaving(true)
    try {
      await updateRace(race.id, {
        dateStart: Timestamp.fromDate(new Date(`${form.dateStart}T00:00:00Z`)),
        dateEnd: Timestamp.fromDate(new Date(`${form.dateEnd}T23:59:59Z`)),
        sprint: form.sprint,
        lockAt: Timestamp.fromDate(new Date(`${form.dateStart}T00:00:00Z`)),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 items-center gap-2 rounded-xl border border-track-700 bg-track-900 p-3 sm:grid-cols-[2rem_1fr_auto_auto_auto_auto]">
      <span className="font-display text-sm font-bold text-slate-400">{race.order}</span>
      <span className="truncate text-sm font-medium text-slate-100">{race.name}</span>
      <input
        type="date"
        value={form.dateStart}
        onChange={(e) => setForm((f) => ({ ...f, dateStart: e.target.value }))}
        className="rounded-lg border border-track-600 bg-track-800 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-race-red"
      />
      <input
        type="date"
        value={form.dateEnd}
        onChange={(e) => setForm((f) => ({ ...f, dateEnd: e.target.value }))}
        className="rounded-lg border border-track-600 bg-track-800 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-race-red"
      />
      <label className="flex items-center gap-1.5 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={form.sprint}
          onChange={(e) => setForm((f) => ({ ...f, sprint: e.target.checked }))}
          className="h-3.5 w-3.5 accent-race-red"
        />
        Sprint
      </label>
      <button
        onClick={save}
        disabled={!dirty || saving}
        className="rounded-lg bg-race-red/90 px-3 py-1.5 text-xs font-bold uppercase text-white transition hover:bg-race-red disabled:opacity-30"
      >
        Save
      </button>
    </div>
  )
}

export default function RaceCalendarEditor({ races }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500">
        Editing dates also moves the prediction lockout (weekend start = the moment picks close).
      </p>
      {races.map((r) => (
        <RaceRow key={r.id} race={r} />
      ))}
    </div>
  )
}
