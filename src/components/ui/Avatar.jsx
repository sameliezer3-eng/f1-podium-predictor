const SIZES = {
  sm: 'h-7 w-7 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-16 w-16 text-2xl',
  xl: 'h-24 w-24 text-4xl',
}

export default function Avatar({ player, size = 'md', className = '' }) {
  if (!player) return null
  const initial = player.name?.[0]?.toUpperCase() ?? '?'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold text-track-950 ring-2 ring-black/20 ${SIZES[size]} ${className}`}
      style={{ backgroundColor: player.color || '#e10600' }}
      title={player.name}
    >
      {player.emoji || initial}
    </div>
  )
}
