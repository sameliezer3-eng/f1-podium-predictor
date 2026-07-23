import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Avatar from '../ui/Avatar'
import Fam1Logo from '../ui/Fam1Logo'

const STEP_STYLE = {
  1: { order: 'order-2', height: 'h-40 sm:h-48', ring: 'ring-race-gold', label: 'bg-race-gold text-track-950', badge: '🥇' },
  2: { order: 'order-1', height: 'h-28 sm:h-36', ring: 'ring-race-silver', label: 'bg-race-silver text-track-950', badge: '🥈' },
  3: { order: 'order-3', height: 'h-20 sm:h-28', ring: 'ring-race-bronze', label: 'bg-race-bronze text-track-950', badge: '🥉' },
}

export default function Podium({ standings, unit = 'pts' }) {
  const [mounted, setMounted] = useState(false)
  const fired = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (mounted && !fired.current && standings[0]) {
      fired.current = true
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e10600', '#ffd23f', '#c7ccd6'],
      })
    }
  }, [mounted, standings])

  if (standings.length === 0) return null

  const top3 = [standings[0], standings[1], standings[2]].filter(Boolean)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-track-700 bg-gradient-to-b from-track-900 to-track-950 px-4 pb-0 pt-8">
      <div className="checkered-bg pointer-events-none absolute inset-x-0 top-0 h-10 opacity-10" />
      <Fam1Logo
        className="pointer-events-none absolute right-4 top-4 h-10 w-auto opacity-25 sm:h-12"
      />

      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {top3.map((entry) => {
          const style = STEP_STYLE[entry.rank]
          return (
            <div
              key={entry.player.id}
              className={`flex flex-col items-center ${style.order} transition-all duration-700 ease-out`}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(24px)',
                transitionDelay: `${(3 - entry.rank) * 120}ms`,
              }}
            >
              <span className="mb-1 text-2xl">{style.badge}</span>
              <Avatar player={entry.player} size={entry.rank === 1 ? 'xl' : 'lg'} className={`ring-4 ${style.ring}`} />
              <p className="mt-2 max-w-[7rem] truncate text-center font-display font-bold text-slate-50">
                {entry.player.name}
              </p>
              <p className="font-display text-lg font-black text-slate-100">
                {entry.totalPoints} <span className="text-xs font-medium text-slate-400">{unit}</span>
              </p>
              {typeof entry.accuracy === 'number' && (
                <p className="text-xs text-slate-500">{entry.accuracy}% accurate</p>
              )}
              <div
                className={`mt-3 flex w-20 sm:w-28 items-start justify-center rounded-t-lg ${style.height} ${style.label}`}
              >
                <span className="mt-1.5 font-display text-2xl font-black">{entry.rank}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-0 h-3 w-full rounded-b-sm bg-track-700" />
    </div>
  )
}
