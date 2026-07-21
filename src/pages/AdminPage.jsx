import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDrivers, usePlayers, useRaces, useScoringSettings } from '../hooks/useAppData'
import { usePlayerContext } from '../context/PlayerContext'
import ResultsEntry from '../components/admin/ResultsEntry'
import ScoringSettings from '../components/admin/ScoringSettings'
import DriverGridEditor from '../components/admin/DriverGridEditor'
import RaceCalendarEditor from '../components/admin/RaceCalendarEditor'
import PlayerPasscodeManager from '../components/admin/PlayerPasscodeManager'

const TABS = [
  { key: 'results', label: 'Race results' },
  { key: 'scoring', label: 'Scoring rules' },
  { key: 'grid', label: 'Driver grid' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'players', label: 'Players' },
]

export default function AdminPage() {
  const [tab, setTab] = useState('results')
  const { activePlayer, playersLoading } = usePlayerContext()
  const { data: races } = useRaces()
  const { data: drivers } = useDrivers()
  const { data: players } = usePlayers()
  const { data: scoringSettings } = useScoringSettings()

  // Players haven't loaded yet (e.g. a hard refresh landed straight on
  // /admin) — hold off on judging admin status rather than bouncing a real
  // admin before their data has even arrived.
  if (playersLoading) return null

  // Not admin (or not even logged in)? Bounce silently — no "access denied"
  // page, since the point is non-admins shouldn't know this route exists.
  // (The UI hides the nav link too; this covers someone typing /admin directly.)
  if (!activePlayer?.isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-black text-slate-50">Admin</h1>
        <p className="text-sm text-slate-400">
          Trust-based tools for the whole friend group — enter results, tweak scoring, fix a mid-season lineup swap.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-track-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.key ? 'border-race-red text-race-red' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'results' && <ResultsEntry races={races} drivers={drivers} scoringSettings={scoringSettings} />}
      {tab === 'scoring' && <ScoringSettings settings={scoringSettings} />}
      {tab === 'grid' && <DriverGridEditor drivers={drivers} />}
      {tab === 'calendar' && <RaceCalendarEditor races={races} />}
      {tab === 'players' && <PlayerPasscodeManager players={players} />}
    </div>
  )
}
