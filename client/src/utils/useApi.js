import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

/** GET `path` on mount. Returns { items, loading, error, reload }. */
export default function useApi (path, { auth = false } = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    const res = await api(path, { auth })
    if (res.success) {
      setItems(res.items || [])
      setError('')
    } else setError(res.msg || 'Failed to load')
    setLoading(false)
  }, [path, auth])

  useEffect(() => {
    reload()
  }, [reload])

  return { items, loading, error, reload }
}
