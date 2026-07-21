export default function EmptyState({ icon = '🏁', title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-track-600 bg-track-900/50 px-6 py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="font-display text-lg text-slate-200">{title}</p>
      {subtitle && <p className="max-w-sm text-sm text-slate-400">{subtitle}</p>}
    </div>
  )
}
