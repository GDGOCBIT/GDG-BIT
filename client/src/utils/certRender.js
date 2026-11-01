// One renderer for everything: editor preview, public verify page, PNG/PDF export.
// Field positions & sizes are % of the template image WIDTH, so output is resolution independent.
import QRCode from 'qrcode'

export const FONTS = ['Google Sans', 'Roboto', 'Open Sans', 'Caveat', 'Island Moments', 'Roboto Mono']

export const loadImage = src =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })

export const makeQr = async url =>
  loadImage(await QRCode.toDataURL(url || 'https://gdg.community.dev', { margin: 1, width: 700, errorCorrectionLevel: 'M' }))

// Fonts used by certificates (designer, verify page, legacy templates) are not needed anywhere else,
// so they are fetched only when a certificate is drawn.
const CERT_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Island+Moments&family=Open+Sans:wght@400;600&family=Roboto:wght@400;500&family=Roboto+Mono:wght@400;500&display=swap'
export const ensureCertFonts = () => {
  if (document.getElementById('cert-fonts')) return
  const l = document.createElement('link')
  l.id = 'cert-fonts'
  l.rel = 'stylesheet'
  l.href = CERT_FONTS_URL
  document.head.appendChild(l)
}

export const loadFonts = fields => {
  ensureCertFonts()
  return Promise.all(
    [...new Set(fields.filter(f => f.type !== 'qr').map(f => `${f.weight || 400} 40px "${f.font || 'Google Sans'}"`))]
      .map(spec => document.fonts.load(spec, 'Aa').catch(() => {}))
  )
}

export const newField = (type, over = {}) => ({
  id: Math.random().toString(36).slice(2, 9),
  type,
  key: type === 'text' ? 'name' : '',
  label: type === 'qr' ? 'QR code' : type === 'id' ? 'Certificate ID' : 'Name',
  x: type === 'qr' ? 50 : 50,
  y: type === 'qr' ? 78 : type === 'id' ? 94 : 46,
  size: type === 'qr' ? 9 : type === 'id' ? 1.2 : 4.5,
  color: '#1e1e1e',
  font: 'Google Sans',
  weight: type === 'text' ? 500 : 400,
  align: 'center',
  maxWidth: type === 'text' ? 70 : 0,
  ...over
})

/**
 * Draw `bg` + all fields on `canvas` (width = outWidth, height keeps the aspect ratio).
 * Returns the bounding box of every field in % of the canvas, used by the editor's drag handles.
 */
export function drawCertificate (canvas, bg, fields, { values = {}, id = '', qr = null, outWidth }) {
  const W = Math.round(outWidth || bg.naturalWidth)
  const H = Math.round((W * bg.naturalHeight) / bg.naturalWidth)
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bg, 0, 0, W, H)
  const boxes = {}

  fields.forEach(f => {
    const px = (f.x / 100) * W
    const py = (f.y / 100) * H
    if (f.type === 'qr') {
      const s = (f.size / 100) * W
      const pad = s * 0.04
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(px - s / 2 - pad, py - s / 2 - pad, s + pad * 2, s + pad * 2)
      if (qr) ctx.drawImage(qr, px - s / 2, py - s / 2, s, s)
      boxes[f.id] = { x: ((px - s / 2 - pad) / W) * 100, y: ((py - s / 2 - pad) / H) * 100, w: ((s + pad * 2) / W) * 100, h: ((s + pad * 2) / H) * 100 }
      return
    }
    const text = f.type === 'id' ? id : String(values[f.key] ?? '')
    if (!text) {
      boxes[f.id] = { x: f.x - 3, y: f.y - 1.5, w: 6, h: 3 }
      return
    }
    let size = (f.size / 100) * W
    const set = () => { ctx.font = `${f.weight || 400} ${size}px "${f.font || 'Google Sans'}", sans-serif` }
    set()
    if (f.maxWidth) {
      const limit = (f.maxWidth / 100) * W
      while (ctx.measureText(text).width > limit && size > 8) { size *= 0.97; set() }
    }
    ctx.fillStyle = f.color || '#1e1e1e'
    ctx.textBaseline = 'middle'
    ctx.textAlign = f.align || 'center'
    ctx.fillText(text, px, py)
    const w = ctx.measureText(text).width
    const x0 = f.align === 'left' ? px : f.align === 'right' ? px - w : px - w / 2
    boxes[f.id] = { x: (x0 / W) * 100, y: ((py - size * 0.62) / H) * 100, w: (w / W) * 100, h: ((size * 1.24) / H) * 100 }
  })
  return boxes
}

/** Full-resolution render of one certificate (used for downloads and the verify page). */
export async function renderCertificate (template, { values, id, verifyUrl }, maxWidth = 2400) {
  const [bg, qr] = await Promise.all([loadImage(template.image.url), makeQr(verifyUrl), loadFonts(template.fields)])
  const canvas = document.createElement('canvas')
  drawCertificate(canvas, bg, template.fields, { values, id, qr, outWidth: Math.min(bg.naturalWidth, maxWidth) })
  return canvas
}

export const canvasToBlob = (canvas, type = 'image/png', q = 0.92) =>
  new Promise(resolve => canvas.toBlob(resolve, type, q))

/** PDF with the certificate filling one page that has the same aspect ratio. */
export async function canvasToPdfBlob (canvas) {
  const { jsPDF } = await import('jspdf')
  const w = canvas.width
  const h = canvas.height
  const pdf = new jsPDF({ orientation: w >= h ? 'landscape' : 'portrait', unit: 'px', format: [w, h], compress: true })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h)
  return pdf.output('blob')
}

export const safeName = s => String(s || 'certificate').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 60) || 'certificate'

export const saveBlob = (blob, filename) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}
