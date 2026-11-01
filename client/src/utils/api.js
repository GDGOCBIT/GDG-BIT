import crypto from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY

export const decrypt = cipher =>
  JSON.parse(crypto.AES.decrypt(cipher, SECRET_KEY).toString(crypto.enc.Utf8))

/**
 * Small fetch wrapper. `body` may be a plain object (sent as JSON) or FormData.
 * Always resolves to the parsed JSON ({ success, msg, ... }) — never throws.
 */
export async function api (path, { method = 'GET', body, auth = false } = {}) {
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
