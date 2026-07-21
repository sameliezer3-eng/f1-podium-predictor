export default function TeamChip({ team, color, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
      style={{
        borderColor: `${color}66`,
        backgroundColor: `${color}1a`,
        color,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {team}
    </span>
  )
}
