import { api } from './api'

// Admin numbers are fetched the moment the app starts (in parallel with the sign-in check and the Admin
// code), and the last answer is remembered so the cards fill in instantly on the next visit.
const KEY = 'admin:stats'
let pending = null
let used = false

export const savedStats = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

const start = () => api('/admin/stats', { auth: true }).then(r => {
  if (r.success) { try { localStorage.setItem(KEY, JSON.stringify(r.stats)) } catch { /* private mode */ } }
  return r
})

// Called once at app start, in parallel with the sign-in check.
export const prefetchStats = () => { pending = start(); used = false }

// The first read reuses that request; later reads (coming back to the Overview tab) fetch fresh numbers.
export const loadStats = () => {
  if (!pending || used) pending = start()
  used = true
  return pending
}
