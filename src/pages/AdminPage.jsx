import { useState } from 'react'
import { useDrivers, useRaces, useScoringSettings } from '../hooks/useAppData'
import ResultsEntry from '../components/admin/ResultsEntry'
import ScoringSettings from '../components/admin/ScoringSettings'
import DriverGridEditor from '../components/admin/DriverGridEditor'
import RaceCalendarEditor from '../components/admin/RaceCalendarEditor'

const TABS = [
  { key: 'results', label: 'Race results' },
  { key: 'scoring', label: 'Scoring rules' },
  { key: 'grid', label: 'Driver grid' },
  { key: 'calendar', label: 'Calendar' },
]

export default function AdminPage() {
  const [tab, setTab] = useState('results')
  const { data: races } = useRaces()
  const { data: drivers } = useDrivers()
  const { data: scoringSettings } = useScoringSettings()

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
    </div>
  )
}
