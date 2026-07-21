import Avatar from '../ui/Avatar'

export default function SubmissionStatus({ players, submissions }) {
  const submittedIds = new Set(submissions.map((s) => s.playerId))

  if (players.length === 0) return null

  return (
    <div className="rounded-2xl border border-track-700 bg-track-900 p-5">
      <h3 className="mb-3 font-display text-base font-bold text-slate-100">Who's in</h3>
      <ul className="flex flex-col gap-2">
        {players.map((p) => {
          const done = submittedIds.has(p.id)
          return (
            <li key={p.id} className="flex items-center gap-2.5">
              <Avatar player={p} size="sm" />
              <span className="flex-1 text-sm text-slate-200">{p.name}</span>
              {done ? (
                <span className="text-xs font-bold text-race-green">✓ Submitted</span>
              ) : (
                <span className="text-xs text-slate-500">Still deciding…</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
