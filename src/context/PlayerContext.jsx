import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { usePlayers } from '../hooks/useAppData'

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

  const value = { players, playersLoading: loading, activePlayer, activePlayerId, setActivePlayerId }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayerContext() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayerContext must be used within a PlayerProvider')
  return ctx
}
