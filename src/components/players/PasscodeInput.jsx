import { useEffect, useRef, useState } from 'react'

export default function PasscodeInput({ length = 4, onComplete, disabled, shake, resetKey }) {
  const [digits, setDigits] = useState(() => Array(length).fill(''))
  const inputRefs = useRef([])

  // A parent bumps `resetKey` to clear the boxes and refocus — e.g. after a
  // wrong attempt or when moving from "enter" to "confirm" during setup.
  useEffect(() => {
    setDigits(Array(length).fill(''))
    if (!disabled) inputRefs.current[0]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, length])

  const commit = (next) => {
    setDigits(next)
    if (next.every((d) => d !== '')) onComplete(next.join(''))
  }

  const handleChange = (i, raw) => {
    const value = raw.replace(/\D/g, '').slice(-1)
    if (!value) {
      commit(digits.map((d, idx) => (idx === i ? '' : d)))
      return
    }
    const next = digits.map((d, idx) => (idx === i ? value : d))
    commit(next)
    if (i < length - 1) inputRefs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && i > 0) inputRefs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < length - 1) inputRefs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    e.preventDefault()
    const next = Array(length)
      .fill('')
      .map((_, i) => pasted[i] || '')
    commit(next)
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div className={`flex justify-center gap-3 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-14 w-12 rounded-xl border-2 border-track-600 bg-track-800 text-center text-2xl font-black text-slate-50 outline-none transition focus:border-race-red disabled:opacity-40 sm:h-16 sm:w-14"
        />
      ))}
    </div>
  )
}
