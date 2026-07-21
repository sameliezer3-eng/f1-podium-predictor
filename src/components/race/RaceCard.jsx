import { Link } from 'react-router-dom'
import { getRaceStatus, formatDateRange } from '../../lib/raceStatus'
import StatusPill from './StatusPill'

export default function RaceCard({ race, totalPlayers, submittedCount, hasSubmitted }) {
  const status = getRaceStatus(race)

  return (
    <Link
      to={`/race/${race.id}`}
      className="group flex items-center gap-4 rounded-xl border border-track-700 bg-track-900 p-4 transition hover:border-track-500 hover:bg-track-800"
    >
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-track-800 font-display">
        <span className="text-[10px] uppercase text-slate-500">Rd</span>
        <span className="text-lg font-black leading-none text-slate-100">{race.order}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-display font-bold text-slate-100">{race.name}</h3>
          {race.sprint && (
            <span className="rounded bg-race-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-race-gold">
              Sprint
            </span>
          )}
        </div>
        <p className="truncate text-sm text-slate-400">{race.circuit}</p>
        <p className="text-xs text-slate-500">{formatDateRange(race.dateStart, race.dateEnd)}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusPill status={status} />
        {status !== 'completed' && (
          <span className="text-xs text-slate-500">
            {hasSubmitted ? '✓ you\'re in' : status === 'locked' ? 'you missed it' : 'not predicted yet'}
          </span>
        )}
        {typeof submittedCount === 'number' && totalPlayers > 0 && status !== 'open' && (
          <span className="text-xs text-slate-500">{submittedCount}/{totalPlayers} predicted</span>
        )}
      </div>
    </Link>
  )
}
