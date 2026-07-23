import Avatar from '../ui/Avatar'

const MAIN_ROWS = [
  { key: 'p1', label: 'P1' },
  { key: 'p2', label: 'P2' },
  { key: 'p3', label: 'P3' },
]

const SPRINT_ROWS = [
  { key: 'sprintP1', predictedKey: 'sprintPredictedP1', resultKey: 'sprintP1', label: 'Sprint P1' },
  { key: 'sprintP2', predictedKey: 'sprintPredictedP2', resultKey: 'sprintP2', label: 'Sprint P2' },
  { key: 'sprintP3', predictedKey: 'sprintPredictedP3', resultKey: 'sprintP3', label: 'Sprint P3' },
]

function cellStyle(guess, resultKey, results, podiumKeys) {
  if (!results || !guess) return ''
  if (results[resultKey] === guess) return 'text-race-green font-bold'
  if (podiumKeys.map((k) => results[k]).includes(guess)) return 'text-race-gold font-bold'
  return 'text-slate-400'
}

export default function PredictionsGrid({ players, predictions, driversById, results, bonusEnabled, isSprint }) {
  const byPlayer = new Map(predictions.map((p) => [p.playerId, p]))
  const bonusRows = bonusEnabled ? [{ key: 'pole', label: 'Pole' }, { key: 'fastestLap', label: 'F. Lap' }] : []

  return (
    <div className="overflow-x-auto rounded-2xl border border-track-700 bg-track-900">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-track-700">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Player</th>
            {isSprint &&
              SPRINT_ROWS.map((r) => (
                <th key={r.key} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-race-gold/80">
                  {r.label}
                </th>
              ))}
            {MAIN_ROWS.map((r) => (
              <th key={r.key} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {r.label}
              </th>
            ))}
            {bonusRows.map((r) => (
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
            const combinedPoints =
              typeof pred?.points === 'number' || typeof pred?.sprintPoints === 'number'
                ? (pred?.points || 0) + (pred?.sprintPoints || 0)
                : null
            return (
              <tr key={player.id} className="border-b border-track-800 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar player={player} size="sm" />
                    <span className="font-medium text-slate-100">{player.name}</span>
                    {pred?.adminOverride && (
                      <span
                        className="rounded bg-race-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-race-gold"
                        title="This pick was set directly by an admin, not the player."
                      >
                        Edited by admin
                      </span>
                    )}
                  </div>
                </td>
                {isSprint &&
                  SPRINT_ROWS.map((r) => {
                    const guess = pred?.[r.predictedKey]
                    const driver = guess ? driversById.get(guess) : null
                    return (
                      <td
                        key={r.key}
                        className={`px-3 py-3 ${cellStyle(guess, r.resultKey, results, ['sprintP1', 'sprintP2', 'sprintP3'])}`}
                      >
                        {driver ? driver.name : <span className="text-slate-600">—</span>}
                      </td>
                    )
                  })}
                {MAIN_ROWS.map((r) => {
                  const guess = pred?.[r.key]
                  const driver = guess ? driversById.get(guess) : null
                  return (
                    <td key={r.key} className={`px-3 py-3 ${cellStyle(guess, r.key, results, ['p1', 'p2', 'p3'])}`}>
                      {driver ? driver.name : <span className="text-slate-600">—</span>}
                    </td>
                  )
                })}
                {bonusRows.map((r) => {
                  const guess = pred?.[r.key]
                  const driver = guess ? driversById.get(guess) : null
                  return (
                    <td key={r.key} className={`px-3 py-3 ${cellStyle(guess, r.key, results, [])}`}>
                      {driver ? driver.name : <span className="text-slate-600">—</span>}
                    </td>
                  )
                })}
                {results && (
                  <td className="px-3 py-3 text-right font-display font-bold text-slate-100">
                    {combinedPoints !== null ? combinedPoints : '—'}
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
