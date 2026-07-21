import { useEffect, useState } from 'react'
import PasscodeInput from './PasscodeInput'
import { hashPasscode } from '../../lib/passcode'

const MAX_ATTEMPTS = 5
const COOLDOWN_SECONDS = 30

export default function PasscodeLogin({ player, onSuccess, onBack, onForgot }) {
  const [attempts, setAttempts] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [checking, setChecking] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  useEffect(() => {
    if (cooldown === 0 && attempts >= MAX_ATTEMPTS) {
      // cooldown just finished — give them a fresh set of attempts
      setAttempts(0)
    }
  }, [cooldown]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = async (code) => {
    setChecking(true)
    setWrong(false)
    try {
      const hash = await hashPasscode(player.id, code)
      if (hash === player.passcodeHash) {
        onSuccess()
        return
      }
      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      setWrong(true)
      setResetKey((k) => k + 1)
      if (nextAttempts >= MAX_ATTEMPTS) {
        setCooldown(COOLDOWN_SECONDS)
      }
    } finally {
      setChecking(false)
    }
  }

  const locked = cooldown > 0

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="text-3xl">🔒</span>
      <div>
        <h3 className="font-display text-lg font-bold text-slate-100">Welcome back, {player.name}</h3>
        <p className="mt-1 text-sm text-slate-400">Enter your passcode</p>
      </div>

      <PasscodeInput
        onComplete={handleComplete}
        disabled={checking || locked}
        resetKey={resetKey}
        shake={wrong}
      />

      {locked ? (
        <p className="text-sm font-medium text-race-gold">
          Too many tries — wait {cooldown}s and try again.
        </p>
      ) : (
        wrong && <p className="text-sm font-medium text-race-red">That's not right, try again.</p>
      )}

      <div className="flex items-center gap-4 text-sm">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300">
          ← Not {player.name}?
        </button>
        <button onClick={onForgot} className="text-slate-500 hover:text-slate-300">
          Forgot passcode?
        </button>
      </div>
    </div>
  )
}
