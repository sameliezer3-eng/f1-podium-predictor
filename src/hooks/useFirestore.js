import { useEffect, useState } from 'react'
import { collection, collectionGroup, doc, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Live-subscribes to a collection (optionally with query constraints, e.g.
 * `where`/`orderBy`). `path` is either a top-level collection name or an
 * array of path segments for a subcollection, e.g. `['races', raceId,
 * 'submissions']`.
 *
 * `depsKey` should be a small primitive (or template string) that changes
 * whenever `path`/`constraints` would produce a different query — callers
 * know that shape better than this hook can infer it from opaque
 * QueryConstraint objects, so it's an explicit param rather than something
 * we try to derive automatically.
 *
 * `enabled: false` skips subscribing entirely and returns an empty result —
 * used when a query would be rejected by security rules until some
 * precondition holds client-side (e.g. a race isn't locked yet), so we never
 * even attempt it.
 */
export function useCollection(path, constraints = [], depsKey = '', enabled = true) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setData([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    const pathSegments = Array.isArray(path) ? path : [path]
    const q = query(collection(db, ...pathSegments), ...constraints)
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error(`useCollection(${pathSegments.join('/')})`, err)
        setError(err)
        setLoading(false)
      },
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(path) ? path.join('/') : path, depsKey, enabled])

  return { data, loading, error }
}

/** Live-subscribes to every subcollection with this name across the whole database. */
export function useCollectionGroup(collectionId, constraints = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(collectionGroup(db, collectionId), ...constraints)
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(
          snap.docs.map((d) => ({
            id: d.id,
            parentId: d.ref.parent.parent?.id ?? null,
            ...d.data(),
          })),
        )
        setLoading(false)
      },
      (err) => {
        console.error(`useCollectionGroup(${collectionId})`, err)
        setError(err)
        setLoading(false)
      },
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId])

  return { data, loading, error }
}

/** Live-subscribes to a single document. */
export function useDocument(collectionName, id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(
      doc(db, collectionName, id),
      (snap) => {
        setData(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      (err) => {
        console.error(`useDocument(${collectionName}/${id})`, err)
        setError(err)
        setLoading(false)
      },
    )
    return unsub
  }, [collectionName, id])

  return { data, loading, error }
}
