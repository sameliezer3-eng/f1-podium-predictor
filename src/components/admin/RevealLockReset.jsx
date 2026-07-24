import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { resetAllRevealLocks, resetRevealLock } from '../../firebase/api'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import { toDate } from '../../lib/raceStatus'

export default function RevealLockReset({ players, races }) {
  const [raceId, setRaceId] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [racePredictions, setRacePredictions] = useState([])
  const [loadingPredictions, setLoadingPredictions] = useState(false)

  const race = races.find((r) => r.id === raceId)
  const player = players.find((p) => p.id === playerId)

  const loadPredictions = () => {
    if (!raceId) {
      setRacePredictions([])
      return
    }
    setLoadingPredictions(true)
    getDocs(query(collection(db, 'predictions'), where('raceId', '==', raceId)))
      .then((snap) => setRacePredictions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoadingPredictions(false))
  }

  useEffect(loadPredictions, [raceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const revealedPredictions = racePredictions.filter((p) => p.revealedAt)
  const playerPrediction = racePredictions.find((p) => p.playerId === playerId)

  // --- Reset all ---
  const [confirmingAll, setConfirmingAll] = useState(false)
  const [resettingAll, setResettingAll] = useState(false)
  const [resetAllError, setResetAllError] = useState(null)
  const [resetAllStatus, setResetAllStatus] = useState(null)

  const handleResetAll = async () => {
    setResettingAll(true)
    setResetAllError(null)
    try {
      const count = await resetAllRevealLocks(raceId)
      setResetAllStatus(`Reset ${count} player${count === 1 ? '' : 's'}.`)
      setConfirmingAll(false)
      loadPredictions()
    } catch (err) {
      console.error('Reset all reveal locks failed:', err.code, err.message, err)
      setResetAllError(err.code === 'permission-denied' ? "Couldn't reset — permissions issue." : "Couldn't reset — try again.")
    } finally {
      setResettingAll(false)
    }
  }

  // --- Reset one player ---
  const [confirmingPlayer, setConfirmingPlayer] = useState(false)
  const [resettingPlayer, setResettingPlayer] = useState(false)
  const [resetPlayerError, setResetPlayerError] = useState(null)
  const [resetPlayerStatus, setResetPlayerStatus] = useState(null)

  const handleResetPlayer = async () => {
    setResettingPlayer(true)
    setResetPlayerError(null)
    try {
      await resetRevealLock(raceId, playerId)
      setResetPlayerStatus(`Reset ${player.name}.`)
      setConfirmingPlayer(false)
      loadPredictions()
    } catch (err) {
      console.error('Reset reveal lock failed:', err.code, err.message, err)
      setResetPlayerError(err.code === 'permission-denied' ? "Couldn't reset — permissions issue." : "Couldn't reset — try again.")
    } finally {
      setResettingPlayer(false)
    }
  }

  const raceActuallyLocked = race ? toDate(race.lockAt) <= new Date() : false

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500">
        Undoes the "viewing everyone's picks locks your own in" penalty from the picks-comparison feature — a
        do-over for someone who revealed by mistake. This only clears that early lock; it never touches the race's
        actual lock time, and a race that's genuinely past its lock stays locked no matter what you reset here.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Race</span>
        <select
          value={raceId}
          onChange={(e) => {
            setRaceId(e.target.value)
            setPlayerId('')
            setResetAllStatus(null)
            setResetPlayerStatus(null)
          }}
          className="rounded-lg border border-track-600 bg-track-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-race-red"
        >
          <option value="">Select a race…</option>
          {races.map((r) => (
            <option key={r.id} value={r.id}>
              Round {r.order} · {r.name} {r.results ? '(scored)' : toDate(r.lockAt) <= new Date() ? '(locked)' : ''}
            </option>
          ))}
        </select>
      </label>

      {raceId && (
        <>
          {raceActuallyLocked && (
            <p className="rounded-lg border border-race-gold/30 bg-race-gold/10 px-3 py-2 text-xs text-race-gold">
              This race's actual lock time has already passed. Resetting a reveal-lock below won't make it editable
              again — normal lock rules still apply on top of this.
            </p>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-track-700 bg-track-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-100">Reset for all players</h3>
                <p className="text-xs text-slate-500">
                  {loadingPredictions
                    ? 'Checking who\'s revealed…'
                    : revealedPredictions.length === 0
                      ? 'Nobody has revealed the comparison for this race yet.'
                      : `${revealedPredictions.length} player${revealedPredictions.length === 1 ? '' : 's'} currently revealed for this race.`}
                </p>
              </div>
              <button
                onClick={() => {
                  setResetAllError(null)
                  setConfirmingAll(true)
                }}
                disabled={loadingPredictions || revealedPredictions.length === 0}
                className="shrink-0 rounded-lg border border-track-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-race-red hover:text-race-red disabled:opacity-40"
              >
                Reset all
              </button>
            </div>
            {resetAllStatus && <p className="text-xs text-race-green">{resetAllStatus}</p>}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Player (for a single reset)</span>
            <select
              value={playerId}
              onChange={(e) => {
                setPlayerId(e.target.value)
                setResetPlayerStatus(null)
              }}
              className="rounded-lg border border-track-600 bg-track-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-race-red"
            >
              <option value="">Select a player…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          {playerId && (
            <div className="flex flex-col gap-3 rounded-xl border border-track-700 bg-track-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar player={player} size="sm" />
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-100">{player.name}</h3>
                    <p className="text-xs text-slate-500">
                      {loadingPredictions
                        ? 'Checking…'
                        : playerPrediction?.revealedAt
                          ? 'Currently revealed — locked in early.'
                          : 'Not currently revealed.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setResetPlayerError(null)
                    setConfirmingPlayer(true)
                  }}
                  disabled={loadingPredictions || !playerPrediction?.revealedAt}
                  className="shrink-0 rounded-lg border border-track-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-race-red hover:text-race-red disabled:opacity-40"
                >
                  Reset {player.name}
                </button>
              </div>
              {resetPlayerStatus && <p className="text-xs text-race-green">{resetPlayerStatus}</p>}
            </div>
          )}
        </>
      )}

      {confirmingAll && (
        <Modal title="Reset all reveal locks" onClose={() => !resettingAll && setConfirmingAll(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-300">
              This resets <strong>{revealedPredictions.length} player{revealedPredictions.length === 1 ? '' : 's'}</strong>{' '}
              for <strong>Round {race?.order} · {race?.name}</strong>. Each of their existing picks stays exactly as
              they left it — only the early lock clears, so they'll need to view the comparison again (after
              resubmitting) to re-trigger it.
            </p>
            {resetAllError && (
              <p className="rounded-lg border border-race-red/30 bg-race-red/10 px-3 py-2 text-sm text-race-red">
                {resetAllError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetAll}
                disabled={resettingAll}
                className="rounded-lg bg-race-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
              >
                {resettingAll ? 'Resetting…' : `Reset ${revealedPredictions.length} player${revealedPredictions.length === 1 ? '' : 's'}`}
              </button>
              <button
                onClick={() => setConfirmingAll(false)}
                disabled={resettingAll}
                className="text-sm text-slate-400 hover:text-slate-200 disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmingPlayer && (
        <Modal title="Reset reveal lock" onClose={() => !resettingPlayer && setConfirmingPlayer(false)}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar player={player} size="md" />
              <span className="font-semibold text-slate-100">{player?.name}</span>
            </div>
            <p className="text-sm text-slate-300">
              Reset <strong>{player?.name}</strong>'s reveal-lock for <strong>Round {race?.order} · {race?.name}</strong>?
              Their existing pick stays exactly as they left it — this only clears the early lock, so they'll be able
              to edit it again (until they view the comparison again, or the race actually locks).
            </p>
            {resetPlayerError && (
              <p className="rounded-lg border border-race-red/30 bg-race-red/10 px-3 py-2 text-sm text-race-red">
                {resetPlayerError}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetPlayer}
                disabled={resettingPlayer}
                className="rounded-lg bg-race-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:opacity-40"
              >
                {resettingPlayer ? 'Resetting…' : `Reset ${player?.name}`}
              </button>
              <button
                onClick={() => setConfirmingPlayer(false)}
                disabled={resettingPlayer}
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
