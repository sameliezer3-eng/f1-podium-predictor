import { useState } from 'react'
import PasscodeInput from './PasscodeInput'
import { hashPasscode } from '../../lib/passcode'
import { setPlayerPasscode } from '../../firebase/api'

export default function PasscodeSetup({ player, onSuccess, onBack }) {
  const [stage, setStage] = useState('enter') // 'enter' | 'confirm'
  const [firstCode, setFirstCode] = useState('')
  const [resetKey, setResetKey] = useState(0)
  const [mismatch, setMismatch] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleComplete = async (code) => {
    setMismatch(false)
    setError(null)

    if (stage === 'enter') {
      setFirstCode(code)
      setStage('confirm')
      setResetKey((k) => k + 1)
      return
    }

    // confirm stage
    if (code !== firstCode) {
      setMismatch(true)
      setFirstCode('')
      setStage('enter')
      setResetKey((k) => k + 1)
      return
    }

    setSaving(true)
    try {
      const hash = await hashPasscode(player.id, code)
      await setPlayerPasscode(player.id, hash)
      onSuccess()
    } catch (err) {
      console.error('Passcode save failed:', err.code, err.message, err)
      if (err.code === 'timeout') {
        setError("Couldn't reach the server — check your connection and try again.")
      } else if (err.code === 'permission-denied') {
        setError("Couldn't save — a permissions issue on our end, not yours.")
      } else {
        setError("Couldn't save your passcode — try again.")
      }
      setResetKey((k) => k + 1)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="text-3xl">🏁</span>
      <div>
        <h3 className="font-display text-lg font-bold text-slate-100">
          {stage === 'enter' ? `Set up a passcode, ${player.name}` : 'Enter it again to confirm'}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          {stage === 'enter'
            ? 'Pick any 4 digits — this keeps your picks yours.'
            : 'Just making sure it wasn\'t a typo.'}
        </p>
      </div>

      <PasscodeInput onComplete={handleComplete} disabled={saving} resetKey={resetKey} shake={mismatch} />

      {mismatch && <p className="text-sm font-medium text-race-red">Didn't match, try again.</p>}
      {error && <p className="text-sm font-medium text-race-red">{error}</p>}
      {saving && <p className="text-sm text-slate-500">Saving…</p>}

      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-300">
        ← Not {player.name}?
      </button>
    </div>
  )
}
