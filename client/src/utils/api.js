const SECRET_KEY = import.meta.env.VITE_SECRET_KEY

// crypto-js is ~60 KB gzipped and only needed once someone is signed in or opens a certificate,
// so it is loaded on demand (and only the AES + UTF-8 parts of it).
export const warmCrypto = () => Promise.all([import('crypto-js/aes'), import('crypto-js/enc-utf8')]).catch(() => {})

export const decrypt = async cipher => {
  const [{ default: AES }, { default: Utf8 }] = await Promise.all([import('crypto-js/aes'), import('crypto-js/enc-utf8')])
  return JSON.parse(AES.decrypt(cipher, SECRET_KEY).toString(Utf8))
}

/**
 * Small fetch wrapper. `body` may be a plain object (sent as JSON) or FormData.
 * Always resolves to the parsed JSON ({ success, msg, ... }) — never throws.
 */
const getCache = new Map() // path -> { at, promise }  (public GETs only; avoids duplicate requests while the page loads)
const GET_TTL = 30 * 1000

export function api (path, opts = {}) {
  const { method = 'GET', body, auth = false } = opts
  if (method !== 'GET' || auth || body !== undefined) {
    // any successful write may change what the public pages show, so forget cached public GETs
    return request(path, opts).then(r => { if (r.success && method !== 'GET') getCache.clear(); return r })
  }
  const hit = getCache.get(path)
  if (hit && Date.now() - hit.at < GET_TTL) return hit.promise
  const promise = request(path, opts).then(r => { if (!r.success) getCache.delete(path); return r })
  getCache.set(path, { at: Date.now(), promise })
  return promise
}

/** Forget cached public data (call after an admin changes something that the public pages show). */
export const clearApiCache = () => getCache.clear()

async function request (path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (auth) headers.login_token = localStorage.getItem('login_token') || ''
  let payload
  if (body instanceof FormData) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  try {
    const res = await fetch(`/api${path}`, { method, headers, body: payload })
    return await res.json()
  } catch (e) {
    return { success: false, msg: 'Network error... Try again later!' }
  }
}

export const formatDate = d =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : ''

export const formatTime = d =>
  d
    ? new Date(d).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit'
      })
    : ''
