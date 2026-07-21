import Avatar from '../ui/Avatar'
import TeamChip from '../ui/TeamChip'

const MEDALS = ['🥇', '🥈', '🥉']

export default function RacePodiumMini({ race, players, predictions, driversById }) {
  if (!race.results) return null

  const playersById = new Map(players.map((p) => [p.id, p]))
  const ranked = predictions
    .filter((p) => typeof p.points === 'number')
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((p) => ({ ...p, player: playersById.get(p.playerId) }))
    .filter((p) => p.player)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-track-700 bg-track-900 p-5 sm:flex-row sm:gap-8">
      <div className="flex-1">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Actual result</h3>
        <ul className="flex flex-col gap-1.5">
          {['p1', 'p2', 'p3'].map((slot, i) => {
            const driver = driversById.get(race.results[slot])
            return (
              <li key={slot} className="flex items-center gap-2">
                <span className="w-6 text-center">{MEDALS[i]}</span>
                {driver ? (
                  <>
                    <span className="font-medium text-slate-100">{driver.name}</span>
                    <TeamChip team={driver.team} color={driver.teamColor} />
                  </>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {ranked.length > 0 && (
        <div className="flex-1">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Best prediction this round</h3>
          <ul className="flex flex-col gap-1.5">
            {ranked.map((r, i) => (
              <li key={r.player.id} className="flex items-center gap-2">
                <span className="w-6 text-center">{MEDALS[i]}</span>
                <Avatar player={r.player} size="sm" />
                <span className="font-medium text-slate-100">{r.player.name}</span>
                <span className="ml-auto font-display font-bold text-slate-200">{r.points} pts</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
