import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { usePlayers, useRestoreStatus } from '../hooks/useAppData'
import { clearActiveSession, setActiveSession } from '../firebase/api'

const STORAGE_KEY = 'paddock-predictor:activePlayerId'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const { data: players, loading } = usePlayers()
  const restoreInProgress = useRestoreStatus()
  const [activePlayerId, setActivePlayerIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null,
  )

  const setActivePlayerId = (id) => {
    setActivePlayerIdState(id)
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  }

  // Validated on every players-list update (not just once at load) — this is
  // what catches a stale session after an admin deletes a player, or after
  // a database restore whose backup predates or omits them. Deliberately
  // NOT checked any other way (e.g. up front before trusting local storage):
  // a restore that still contains this player, under the same preserved ID,
  // should leave the session alone rather than force a re-login. Uses
  // logout() rather than the raw setter so the dangling Firestore
  // sessions/{uid} doc gets cleared too, not just the local/localStorage half.
  //
  // Suppressed entirely while a restore is running: restoreDatabaseSnapshot
  // already interleaves deletes/writes per collection specifically to avoid
  // a transient "this player doesn't exist" window, but this is the backstop
  // if that ever doesn't hold (e.g. a league large enough to need multiple
  // batch chunks for `players`). Without it, a real player briefly vanishing
  // mid-restore would self-logout and — worse, if they're the restoring
  // admin — delete the very session the rest of the restore's writes depend
  // on to pass isAdmin(), corrupting the restore. Re-validated the instant
  // the restore finishes, via the same effect, once restoreInProgress flips.
  useEffect(() => {
    if (!loading && !restoreInProgress && activePlayerId && !players.some((p) => p.id === activePlayerId)) {
      logout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, players, activePlayerId, restoreInProgress])

  const activePlayer = useMemo(
    () => players.find((p) => p.id === activePlayerId) ?? null,
    [players, activePlayerId],
  )

  // The "you're verified" signal — call only after passcode verification
  // succeeds (PasscodeSetup/PasscodeLogin), never directly from picking a
  // name in the switcher. Also binds this browser's auth uid to the player
  // in Firestore (see setActiveSession) so isAdmin()/isOwnPlayerDoc() in the
  // security rules have something real to check — awaited before resolving
  // so an admin who logs in and immediately opens Admin doesn't hit a
  // permission error from a write that raced ahead of the session doc.
  const activatePlayer = async (playerId) => {
    await setActiveSession(playerId)
    setActivePlayerId(playerId)
  }

  const logout = () => {
    setActivePlayerId(null)
    clearActiveSession()
  }

  const value = {
    players,
    playersLoading: loading,
    activePlayer,
    activePlayerId,
    setActivePlayerId,
    activatePlayer,
    logout,
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayerContext() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayerContext must be used within a PlayerProvider')
  return ctx
}
