// Minimal CSV parser (quoted fields, "" escapes, CRLF). First row is the header.
export function parseCSV (text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  text = text.replace(/^﻿/, '')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(v => v.trim())) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some(v => v.trim())) rows.push(row)
  if (!rows.length) return { headers: [], rows: [] }
  const headers = rows[0].map(h => h.trim())
  return {
    headers,
    rows: rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])))
  }
}

export const toCSV = (headers, rows) =>
  [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
