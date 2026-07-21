import { useState } from 'react'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'
import { resetPlayerPasscode } from '../../firebase/api'

export default function PlayerPasscodeManager({ players }) {
  const [resettingId, setResettingId] = useState(null)

  if (players.length === 0) {
    return <EmptyState icon="🧑‍🤝‍🧑" title="No players yet" subtitle="Players show up here once someone joins the grid." />
  }

  const handleReset = async (player) => {
    if (!confirm(`Reset ${player.name}'s passcode? They'll set a new one next time they log in.`)) return
    setResettingId(player.id)
    try {
      await resetPlayerPasscode(player.id)
    } finally {
      setResettingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500">
        Only real recovery path — a player who forgot their passcode asks whoever's here to clear it below.
      </p>
      {players.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-xl border border-track-700 bg-track-900 p-3">
          <Avatar player={p} size="md" />
          <span className="flex-1 font-medium text-slate-100">{p.name}</span>
          {p.passcodeHash ? (
            <>
              <span className="text-xs text-race-green">Passcode set</span>
              <button
                onClick={() => handleReset(p)}
                disabled={resettingId === p.id}
                className="rounded-lg border border-track-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-race-red hover:text-race-red disabled:opacity-40"
              >
                {resettingId === p.id ? 'Resetting…' : 'Reset passcode'}
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500">Not set yet</span>
          )}
        </div>
      ))}
    </div>
  )
}
