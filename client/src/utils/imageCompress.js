// Shrinks a photo in the browser before upload: a 1800px full version and a 700px thumbnail (JPEG).
const loadFile = file =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read ' + file.name)) }
    img.src = url
  })

const scaled = (img, max, quality) =>
  new Promise(resolve => {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * k)
    c.height = Math.round(img.naturalHeight * k)
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    c.toBlob(b => resolve({ blob: b, width: c.width, height: c.height }), 'image/jpeg', quality)
  })

export async function compressPhoto (file) {
  const img = await loadFile(file)
  const full = await scaled(img, 1800, 0.85)
  const thumb = await scaled(img, 700, 0.8)
  return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height }
}
