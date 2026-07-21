import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { usePlayers } from '../hooks/useAppData'
import { clearActiveSession, setActiveSession } from '../firebase/api'

const STORAGE_KEY = 'paddock-predictor:activePlayerId'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const { data: players, loading } = usePlayers()
  const [activePlayerId, setActivePlayerIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null,
  )

  const setActivePlayerId = (id) => {
    setActivePlayerIdState(id)
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  }

  // If the stored player was deleted, fall back to nobody-selected.
  useEffect(() => {
    if (!loading && activePlayerId && !players.some((p) => p.id === activePlayerId)) {
      setActivePlayerId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, players])

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
