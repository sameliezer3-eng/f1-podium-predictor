import { configured } from '../../firebase/config'

export default function FirebaseSetupNotice() {
  if (configured) return null

  return (
    <div className="border-b border-race-gold/40 bg-race-gold/10 px-4 py-2.5 text-center text-sm text-race-gold">
      Firebase isn't configured yet — copy <code className="rounded bg-black/20 px-1 py-0.5">.env.example</code> to{' '}
      <code className="rounded bg-black/20 px-1 py-0.5">.env</code>, fill in your project keys, then run{' '}
      <code className="rounded bg-black/20 px-1 py-0.5">npm run seed</code>. See the README for the full setup.
    </div>
  )
}
