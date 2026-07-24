import { useState } from 'react'
import { addPlayer } from '../../firebase/api'

const COLORS = [
  '#e10600', '#ffd23f', '#3671C6', '#00D7B6', '#FF8000',
  '#229971', '#FF87BC', '#6C98FF', '#17d67b', '#c7ccd6',
]
const EMOJIS = ['🏎️', '🏁', '🔧', '⚡', '🚀', '🔥', '🏆', '🎯', '👑', '🍀']

export default function PlayerForm({ onCreated }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [emoji, setEmoji] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const trimmedName = name.trim()
      const id = await addPlayer({ name: trimmedName, color, emoji })
      setName('')
      setEmoji('')
      onCreated?.(id, { name: trimmedName, color, emoji })
    } catch (err) {
      console.error('Adding player failed:', err.code, err.message, err)
      if (err.code === 'timeout') {
        setError("Couldn't reach the server — check your connection and try again.")
      } else if (err.code === 'permission-denied') {
        setError("Couldn't save — a permissions issue on our end, not yours.")
      } else {
        setError("Couldn't add you to the grid — try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-track-700 bg-track-900 p-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Your name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jamie"
          maxLength={24}
          className="w-full rounded-lg border border-track-600 bg-track-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-race-red"
        />
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Avatar color</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-track-900 transition ${color === c ? 'ring-2 ring-white' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Emoji (optional)
        </span>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(emoji === e ? '' : e)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                emoji === e ? 'border-race-red bg-race-red/10' : 'border-track-600 bg-track-800'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full font-display text-xl font-bold text-track-950"
          style={{ backgroundColor: color }}
        >
          {emoji || name[0]?.toUpperCase() || '?'}
        </div>
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="flex-1 rounded-lg bg-race-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
        >
          {saving ? 'Adding…' : 'Add to the grid'}
        </button>
      </div>
      {error && <p className="text-sm font-medium text-race-red">{error}</p>}
    </form>
  )
}
