import Avatar from '../ui/Avatar'

const ROWS = [
  { key: 'p1', label: 'P1' },
  { key: 'p2', label: 'P2' },
  { key: 'p3', label: 'P3' },
]

function cellStyle(guess, slotKey, results) {
  if (!results || !guess) return ''
  if (results[slotKey] === guess) return 'text-race-green font-bold'
  if ([results.p1, results.p2, results.p3].includes(guess)) return 'text-race-gold font-bold'
  return 'text-slate-400'
}

export default function PredictionsGrid({ players, predictions, driversById, results, bonusEnabled }) {
  const byPlayer = new Map(predictions.map((p) => [p.playerId, p]))
  const rows = bonusEnabled ? [...ROWS, { key: 'pole', label: 'Pole' }, { key: 'fastestLap', label: 'F. Lap' }] : ROWS

  return (
    <div className="overflow-x-auto rounded-2xl border border-track-700 bg-track-900">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-track-700">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Player</th>
            {rows.map((r) => (
              <th key={r.key} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {r.label}
              </th>
            ))}
            {results && <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Pts</th>}
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const pred = byPlayer.get(player.id)
            return (
              <tr key={player.id} className="border-b border-track-800 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar player={player} size="sm" />
                    <span className="font-medium text-slate-100">{player.name}</span>
                  </div>
                </td>
                {rows.map((r) => {
                  const driver = pred?.[r.key] ? driversById.get(pred[r.key]) : null
                  return (
                    <td key={r.key} className={`px-3 py-3 ${cellStyle(pred?.[r.key], r.key, results)}`}>
                      {driver ? driver.name : <span className="text-slate-600">—</span>}
                    </td>
                  )
                })}
                {results && (
                  <td className="px-3 py-3 text-right font-display font-bold text-slate-100">
                    {typeof pred?.points === 'number' ? pred.points : '—'}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
