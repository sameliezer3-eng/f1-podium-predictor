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
        <div className="mx-auto flex max-w-5xl items-end justify-between gap-3 px-4 py-2.5">
          <NavLink to="/" className="flex shrink-0 items-end text-slate-50">
            {/* The SVG's viewBox carries a lot of built-in padding around the
                letterforms (room for the drop-shadow extrusion), so the
                rendered box (h-24/h-28) is roughly 3x taller than the
                visible "Fam1" glyphs — translate-y shifts those glyphs down
                within the box to sit flush with its bottom edge (see below),
                but the box itself is still that full height as far as the
                row's flex layout is concerned. Left unclipped, that mostly-
                empty box was the actual cause of the header looking
                top-heavy: `items-end` was already bottom-aligning everything
                correctly, but the nav text and avatar are only ~30px tall
                against the logo's 112px box, so they read as sitting in the
                bottom third of a much taller row with a big gap above them —
                even though the row's own padding-top/bottom (py-2.5) were
                already equal. The wrapper below clips the box down to just
                the visible glyph height (~40px), so the logo's *layout*
                height roughly matches its neighbors' instead of dragging the
                whole row taller than it needs to be. */}
            <div className="flex h-[35px] items-end overflow-hidden sm:h-[40px]">
              {/* translate-y (a percentage, so it scales with h-24 vs sm:h-28
                  automatically) shifts the rendered pixels down within the
                  SVG's own box so the visible glyphs land in the bottom
                  slice the wrapper above keeps — the rest of the box (the
                  drop-shadow padding) falls outside the wrapper and is
                  clipped away rather than pushing the row taller. */}
              <Fam1Logo className="h-24 w-auto translate-y-[45%] sm:h-28" />
            </div>
          </NavLink>

          <nav className="hidden items-end gap-1 sm:flex">
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
