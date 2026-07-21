import Avatar from '../ui/Avatar'

export default function StandingsTable({ standings }) {
  const rest = standings.slice(3)
  if (rest.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-track-700 bg-track-900">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-track-700 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 text-left">Rank</th>
            <th className="px-3 py-3 text-left">Player</th>
            <th className="px-3 py-3 text-right">Points</th>
            <th className="px-3 py-3 text-right">Accuracy</th>
            <th className="px-4 py-3 text-right">Races</th>
          </tr>
        </thead>
        <tbody>
          {rest.map((entry) => (
            <tr key={entry.player.id} className="border-b border-track-800 last:border-0">
              <td className="px-4 py-3 font-display font-bold text-slate-400">{entry.rank}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <Avatar player={entry.player} size="sm" />
                  <span className="font-medium text-slate-100">{entry.player.name}</span>
                </div>
              </td>
              <td className="px-3 py-3 text-right font-display font-bold text-slate-100">{entry.totalPoints}</td>
              <td className="px-3 py-3 text-right text-slate-400">
                {typeof entry.accuracy === 'number' ? `${entry.accuracy}%` : '—'}
              </td>
              <td className="px-4 py-3 text-right text-slate-500">{entry.racesScored}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
