import { useState } from 'react'
import { usePlayerContext } from '../../context/PlayerContext'
import Avatar from '../ui/Avatar'
import PlayerForm from './PlayerForm'
import PasscodeSetup from './PasscodeSetup'
import PasscodeLogin from './PasscodeLogin'

export default function PlayerSwitcher({ onDone }) {
  const { players, activePlayerId, activePlayer, activatePlayer, logout } = usePlayerContext()
  const [showForm, setShowForm] = useState(players.length === 0)
  // 'select' | { mode: 'setup' | 'login' | 'forgot', player }
  const [step, setStep] = useState({ mode: 'select' })

  const backToSelect = () => setStep({ mode: 'select' })

  const handlePick = (player) => {
    if (player.id === activePlayerId) {
      onDone?.()
      return
    }
    setStep({ mode: player.passcodeHash ? 'login' : 'setup', player })
  }

  const handleVerified = async (playerId) => {
    await activatePlayer(playerId)
    setStep({ mode: 'select' })
    onDone?.()
  }

  if (step.mode === 'setup') {
    return <PasscodeSetup player={step.player} onSuccess={() => handleVerified(step.player.id)} onBack={backToSelect} />
  }

  if (step.mode === 'login') {
    return (
      <PasscodeLogin
        player={step.player}
        onSuccess={() => handleVerified(step.player.id)}
        onBack={backToSelect}
        onForgot={() => setStep({ mode: 'forgot', player: step.player })}
      />
    )
  }

  if (step.mode === 'forgot') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-3xl">🤔</span>
        <p className="text-sm text-slate-300">
          No self-service recovery here — ask whoever's admin to reset {step.player.name}'s passcode from the{' '}
          <span className="font-semibold text-slate-100">Admin → Players</span> tab. Once it's cleared you'll be
          able to set a new one next time you pick your name.
        </p>
        <button
          onClick={() => setStep({ mode: 'login', player: step.player })}
          className="text-sm text-race-red hover:text-red-400"
        >
          ← Back to passcode
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {activePlayer && (
        <button onClick={logout} className="self-start text-sm text-slate-500 hover:text-slate-300">
          Not {activePlayer.name}? Switch player
        </button>
      )}

      {players.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePick(p)}
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
        <PlayerForm onCreated={(id, player) => setStep({ mode: 'setup', player: { id, ...player } })} />
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
