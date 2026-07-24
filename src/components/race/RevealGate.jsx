import { useState } from 'react'
import { revealPrediction } from '../../firebase/api'

// Shown once a player has submitted their own pick for a still-open race,
// offering to view everyone else's picks early instead of waiting for lock.
// Doesn't manage the "revealed" transition itself — clicking through calls
// revealPrediction, which sets revealedAt on their prediction doc; RacePage
// picks that up via its live subscription on myPrediction and swaps this
// out for the actual comparison, no local state needed here.
export default function RevealGate({ raceId, playerId }) {
  const [revealing, setRevealing] = useState(false)
  const [error, setError] = useState(null)

  const handleReveal = async () => {
    setRevealing(true)
    setError(null)
    try {
      await revealPrediction(raceId, playerId)
    } catch (err) {
      console.error('Reveal failed:', err.code, err.message, err)
      setError(err.code === 'permission-denied' ? "Couldn't do that — permissions issue." : "Couldn't do that — try again.")
    } finally {
      setRevealing(false)
    }
  }

  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-track-700 bg-track-900 p-5 text-center">
      <p className="text-sm text-slate-300">You've submitted your pick — want to see everyone else's before the race?</p>
      <p className="text-xs text-race-gold">
        Viewing everyone's picks locks yours in for this race — you won't be able to change it after this.
      </p>
      <button
        onClick={handleReveal}
        disabled={revealing}
        className="rounded-lg bg-race-red px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {revealing ? 'Locking in…' : "View everyone's picks"}
      </button>
      {error && <p className="text-sm text-race-red">{error}</p>}
    </section>
  )
}
