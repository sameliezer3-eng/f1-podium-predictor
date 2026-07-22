import { useState } from 'react'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'
import Modal from '../ui/Modal'
import { deletePlayer, resetPlayerPasscode } from '../../firebase/api'

export default function PlayerPasscodeManager({ players }) {
  const [resettingId, setResettingId] = useState(null)
  const [deletingPlayer, setDeletingPlayer] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deletePlayer(deletingPlayer.id)
      setDeletingPlayer(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500">
        Reset is the only real passcode-recovery path — a player who forgot theirs asks whoever's here to clear it.
      </p>
      {players.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-xl border border-track-700 bg-track-900 p-3">
          <Avatar player={p} size="md" />
          <span className="flex-1 font-medium text-slate-100">{p.name}</span>
          {p.passcodeHash ? (
            <span className="text-xs text-race-green">Passcode set</span>
          ) : (
            <span className="text-xs text-slate-500">Not set yet</span>
          )}
          <button
            onClick={() => handleReset(p)}
            disabled={resettingId === p.id || !p.passcodeHash}
            className="rounded-lg border border-track-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-race-red hover:text-race-red disabled:opacity-40"
          >
            {resettingId === p.id ? 'Resetting…' : 'Reset passcode'}
          </button>
          <button
            onClick={() => setDeletingPlayer(p)}
            className="rounded-lg border border-track-600 px-3 py-1.5 text-xs font-semibold text-race-red/80 transition hover:border-race-red hover:text-race-red"
          >
            Delete
          </button>
        </div>
      ))}

      {deletingPlayer && (
        <Modal title="Delete player" onClose={() => setDeletingPlayer(null)}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar player={deletingPlayer} size="md" />
              <span className="font-semibold text-slate-100">{deletingPlayer.name}</span>
            </div>
            <p className="text-sm text-slate-300">
              This permanently removes <strong>{deletingPlayer.name}</strong> and every prediction they've ever made —
              they'll disappear from the scoreboard, the podium, and any past race breakdowns. This can't be undone.
            </p>
            <p className="rounded-lg border border-race-gold/30 bg-race-gold/10 px-3 py-2 text-xs text-race-gold">
              Consider exporting a backup first (Admin → Backup) — restoring a deleted player later means re-adding
              them from scratch with no history, unless you've got a backup file to restore from.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-race-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : `Delete ${deletingPlayer.name}`}
              </button>
              <button
                onClick={() => setDeletingPlayer(null)}
                className="text-sm text-slate-400 hover:text-slate-200"
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
