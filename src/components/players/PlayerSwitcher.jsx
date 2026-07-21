import { useState } from 'react'
import { usePlayerContext } from '../../context/PlayerContext'
import Avatar from '../ui/Avatar'
import PlayerForm from './PlayerForm'

export default function PlayerSwitcher({ onDone }) {
  const { players, activePlayerId, setActivePlayerId } = usePlayerContext()
  const [showForm, setShowForm] = useState(players.length === 0)

  return (
    <div className="flex flex-col gap-5">
      {players.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePlayerId(p.id)
                onDone?.()
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                p.id === activePlayerId
                  ? 'border-race-red bg-race-red/10'
                  : 'border-track-700 bg-track-900 hover:border-track-500'
              }`}
            >
              <Avatar player={p} size="lg" />
              <span className="truncate text-sm font-semibold text-slate-100">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {showForm ? (
        <PlayerForm
          onCreated={(id) => {
            setActivePlayerId(id)
            setShowForm(false)
            onDone?.()
          }}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg border border-dashed border-track-600 py-2.5 text-sm font-medium text-slate-400 transition hover:border-race-red hover:text-race-red"
        >
          + New player
        </button>
      )}
    </div>
  )
}
