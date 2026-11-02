import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

// Public lists are remembered in the browser: a repeat visit paints (and starts loading images) straight
// away from the last answer, then quietly refreshes. Signed-in/admin requests are never stored.
const KEY = p => `api:${p}`
const readSaved = path => {
  try { const v = JSON.parse(localStorage.getItem(KEY(path))); return Array.isArray(v) ? v : null } catch { return null }
}
const save = (path, items) => {
  try { const s = JSON.stringify(items); if (s.length < 400000) localStorage.setItem(KEY(path), s) } catch { /* storage full or blocked */ }
}

/** GET `path` on mount. Returns { items, loading, error, reload }. */
export default function useApi (path, { auth = false } = {}) {
  const [items, setItems] = useState(() => (auth ? [] : readSaved(path) || []))
  const [loading, setLoading] = useState(() => auth || !readSaved(path))
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (auth || !readSaved(path)) setLoading(true)
    const res = await api(path, { auth })
    if (res.success) {
      setItems(res.items || [])
      setError('')
      if (!auth) save(path, res.items || [])
    } else setError(res.msg || 'Failed to load')
    setLoading(false)
  }, [path, auth])

  useEffect(() => {
    reload()
  }, [reload])

  return { items, loading, error, reload }
}
