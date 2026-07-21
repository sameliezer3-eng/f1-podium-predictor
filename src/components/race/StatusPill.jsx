const STYLES = {
  open: 'bg-race-green/15 text-race-green border-race-green/40',
  locked: 'bg-race-gold/15 text-race-gold border-race-gold/40',
  completed: 'bg-track-600/40 text-slate-300 border-track-500',
}

const LABELS = {
  open: 'Predictions open',
  locked: 'Locked · awaiting results',
  completed: 'Completed',
}

export default function StatusPill({ status, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${STYLES[status]} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  )
}
