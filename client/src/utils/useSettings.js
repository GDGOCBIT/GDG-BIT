import { useEffect, useState } from 'react'
import { api } from './api'
import { socialLinks } from './socials'

// One shared request for the whole app; components re-render when settings change (e.g. after an admin saves).
let cache = null
let inflight = null
const listeners = new Set()
const fallback = { socials: socialLinks.map(s => ({ key: s.text.toLowerCase(), label: s.text, icon: s.icon, url: s.link })), members: 0 }

const load = () => {
  if (!inflight) {
    inflight = api('/settings').then(r => {
      cache = r.success ? { socials: r.socials, members: r.members } : fallback
      listeners.forEach(fn => fn(cache))
      return cache
    })
  }
  return inflight
}

export const refreshSettings = () => { inflight = null; return load() }

/** { socials: [{key,label,icon,url}], members } — falls back to built-in links if the API is unreachable. */
export default function useSettings () {
  const [s, setS] = useState(cache || fallback)
  useEffect(() => {
    listeners.add(setS)
    load()
    return () => listeners.delete(setS)
  }, [])
  return s
}
