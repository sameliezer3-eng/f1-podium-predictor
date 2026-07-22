import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { usePlayerContext } from '../../context/PlayerContext'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import Fam1Logo from '../ui/Fam1Logo'
import PlayerSwitcher from '../players/PlayerSwitcher'

const BASE_LINKS = [
  { to: '/', label: 'Race Hub', end: true },
  { to: '/scoreboard', label: 'Scoreboard' },
]

export default function NavBar() {
  const { activePlayer } = usePlayerContext()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  // Non-admins get no Admin link at all — not disabled, not hinted at, just
  // absent, so there's nothing here to tip them off that the panel exists.
  const links = activePlayer?.isAdmin ? [...BASE_LINKS, { to: '/admin', label: 'Admin' }] : BASE_LINKS

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-track-700 bg-track-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center text-slate-50">
            <Fam1Logo variant="wordmark" className="h-6 w-auto sm:h-7" />
          </NavLink>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    isActive ? 'bg-race-red/15 text-race-red' : 'text-slate-400 hover:text-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => setSwitcherOpen(true)}
            className="flex items-center gap-2 rounded-full border border-track-600 bg-track-800 py-1 pl-1 pr-3 transition hover:border-track-500"
          >
            {activePlayer ? (
              <>
                <Avatar player={activePlayer} size="sm" />
                <span className="text-sm font-semibold text-slate-100">{activePlayer.name}</span>
              </>
            ) : (
              <span className="px-2 text-sm font-semibold text-race-gold">Who's playing?</span>
            )}
          </button>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t border-track-800 px-4 py-1.5 sm:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1 text-sm font-semibold transition ${
                  isActive ? 'bg-race-red/15 text-race-red' : 'text-slate-400'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {switcherOpen && (
        <Modal title="Who's playing?" onClose={() => setSwitcherOpen(false)}>
          <PlayerSwitcher onDone={() => setSwitcherOpen(false)} />
        </Modal>
      )}
    </>
  )
}
