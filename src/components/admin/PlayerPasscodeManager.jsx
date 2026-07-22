import { useState } from 'react'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'
import Modal from '../ui/Modal'
import { deletePlayer, resetPlayerPasscode } from '../../firebase/api'

export default function PlayerPasscodeManager({ players }) {
  const [resettingPlayer, setResettingPlayer] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState(null)

  const [deletingPlayer, setDeletingPlayer] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  if (players.length === 0) {
    return <EmptyState icon="🧑‍🤝‍🧑" title="No players yet" subtitle="Players show up here once someone joins the grid." />
  }

  const openReset = (player) => {
    setResetError(null)
    setResettingPlayer(player)
  }

  const handleReset = async () => {
    setResetting(true)
    setResetError(null)
    try {
      await resetPlayerPasscode(resettingPlayer.id)
      setResettingPlayer(null)
    } catch (err) {
      console.error('Passcode reset failed:', err.code, err.message, err)
      setResetError("Couldn't reset the passcode — try again in a moment.")
    } finally {
      setResetting(false)
    }
  }

  const openDelete = (player) => {
    setDeleteError(null)
    setDeletingPlayer(player)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deletePlayer(deletingPlayer.id)
      setDeletingPlayer(null)
    } catch (err) {
      console.error('Player delete failed:', err.code, err.message, err)
      setDeleteError("Couldn't delete this player — try again in a moment.")
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
            onClick={() => openReset(p)}
            disabled={!p.passcodeHash}
            className="rounded-lg border border-track-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-race-red hover:text-race-red disabled:opacity-40"
          >
            Reset passcode
          </button>
          <button
            onClick={() => openDelete(p)}
            className="rounded-lg border border-track-600 px-3 py-1.5 text-xs font-semibold text-race-red/80 transition hover:border-race-red hover:text-race-red"
          >
            Delete
          </button>
        </div>
      ))}

      {resettingPlayer && (
        <Modal title="Reset passcode" onClose={() => !resetting && setResettingPlayer(null)}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar player={resettingPlayer} size="md" />
              <span className="font-semibold text-slate-100">{resettingPlayer.name}</span>
            </div>
            <p className="text-sm text-slate-300">
              Reset <strong>{resettingPlayer.name}</strong>'s passcode? They'll need to set a new one next time they
              log in — this doesn't touch their predictions or history, just clears the old passcode.
            </p>
            {resetError && (
              <p className="rounded-lg border border-race-red/30 bg-race-red/10 px-3 py-2 text-sm text-race-red">
                {resetError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="rounded-lg bg-race-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
              >
                {resetting ? 'Resetting…' : `Reset ${resettingPlayer.name}'s passcode`}
              </button>
              <button
                onClick={() => setResettingPlayer(null)}
                disabled={resetting}
                className="text-sm text-slate-400 hover:text-slate-200 disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deletingPlayer && (
        <Modal title="Delete player" onClose={() => !deleting && setDeletingPlayer(null)}>
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
            {deleteError && (
              <p className="rounded-lg border border-race-red/30 bg-race-red/10 px-3 py-2 text-sm text-race-red">
                {deleteError}
              </p>
            )}
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
                disabled={deleting}
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
