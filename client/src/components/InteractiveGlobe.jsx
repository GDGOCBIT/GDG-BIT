import { useEffect, useRef } from 'react'

const D2R = Math.PI / 180
const COLORS = ['#4285f4', '#ea4335', '#f9ab00', '#34a853']
const LIFE = 2.4 // seconds a dot stays
const MAX_DOTS = 16

const toVec = (lat, lon) => [Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)]

// meridians and parallels every 30 degrees
const GRATICULE = (() => {
  const out = []
  for (let lon = -180; lon < 180; lon += 30) { const l = []; for (let lat = -90; lat <= 90; lat += 6) l.push(toVec(lat, lon)); out.push(l) }
  for (let lat = -60; lat <= 60; lat += 30) { const l = []; for (let lon = -180; lon <= 180; lon += 6) l.push(toVec(lat, lon)); out.push(l) }
  return out
})()

// uniform random point on the sphere
const randomPoint = () => {
  const y = Math.random() * 2 - 1; const a = Math.random() * Math.PI * 2; const r = Math.sqrt(1 - y * y)
  return [Math.cos(a) * r, y, Math.sin(a) * r]
}

/**
 * A line-art globe that keeps rotating; small Google-coloured dots pop up at random spots and fade away.
 * Drag to spin it by hand. Pure canvas, rests when off screen.
 */
export default function InteractiveGlobe ({ className = '' }) {
  const canvas = useRef(null)

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let size = 0; let dpr = 1; let raf = 0; let visible = true
    let yaw = 1.2; let pitch = 0.4
    const REST = 0.0032
    let vel = REST
    let drag = null
    let last = performance.now(); let time = 0; let nextSpawn = 0
    let dots = []
    let ink = '#1e1e1e'; let surface = '#ffffff'
    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement)
      ink = cs.getPropertyValue('--ink').trim() || ink; surface = cs.getPropertyValue('--surface').trim() || surface
    }
    readTheme()
    const themeObs = new MutationObserver(readTheme)
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = cv.clientWidth
      cv.width = cv.height = Math.round(size * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(cv)
    const io = new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame) } })
    io.observe(cv)

    const project = (v, cy, sy, cp, sp) => {
      const x = v[0] * cy + v[2] * sy; const z0 = -v[0] * sy + v[2] * cy
      return [x, v[1] * cp - z0 * sp, v[1] * sp + z0 * cp]
    }

    function frame (now) {
      raf = 0
      if (!visible || document.hidden) return
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      time += dt
      if (!drag) { vel += (REST - vel) * Math.min(1, dt * 1.2); yaw += vel * dt * 60 }

      // a new random coloured dot every so often
      if (time >= nextSpawn && dots.length < MAX_DOTS) {
        dots.push({ v: randomPoint(), c: COLORS[Math.floor(Math.random() * 4)], born: time, big: 3 + Math.random() * 2.5 })
        nextSpawn = time + 0.18 + Math.random() * 0.3
      }
      dots = dots.filter(d => time - d.born < LIFE)

      const cy = Math.cos(yaw); const sy = Math.sin(yaw); const cp = Math.cos(pitch); const sp = Math.sin(pitch)
      const c = size / 2; const R = size * 0.46
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      ctx.fillStyle = surface; ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.fill()
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.globalAlpha = 0.45
      for (const line of GRATICULE) {
        ctx.beginPath(); let pen = false
        for (const v of line) {
          const p = project(v, cy, sy, cp, sp)
          if (p[2] < 0) { pen = false; continue }
          const x = c + p[0] * R; const y = c - p[1] * R
          if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true }
        }
        ctx.stroke()
      }

      for (const d of dots) {
        const p = project(d.v, cy, sy, cp, sp)
        if (p[2] < 0.05) continue
        const age = (time - d.born) / LIFE
        const grow = Math.min(1, age / 0.18) // pops in quickly
        const fade = age > 0.6 ? 1 - (age - 0.6) / 0.4 : 1
        const x = c + p[0] * R; const y = c - p[1] * R
        ctx.globalAlpha = fade * 0.5 * (1 - Math.min(1, age / 0.5)); ctx.strokeStyle = d.c; ctx.lineWidth = 1.6
        ctx.beginPath(); ctx.arc(x, y, d.big + age * 14, 0, 7); ctx.stroke() // ripple as it appears
        ctx.globalAlpha = fade; ctx.fillStyle = d.c
        ctx.beginPath(); ctx.arc(x, y, d.big * (0.4 + 0.6 * grow) * (0.7 + 0.3 * p[2]), 0, 7); ctx.fill()
      }

      ctx.globalAlpha = 1; ctx.strokeStyle = ink; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.stroke()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const down = e => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing' }
    const move = e => {
      if (!drag) return
      const dx = e.clientX - drag.x; const dy = e.clientY - drag.y
      drag = { x: e.clientX, y: e.clientY }
      yaw += dx * 0.009; vel = dx * 0.009 / 2
      pitch = Math.max(-0.9, Math.min(0.9, pitch + dy * 0.007))
    }
    const up = () => { drag = null; cv.style.cursor = 'grab'; vel = Math.max(-0.08, Math.min(0.08, vel)) }
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up)

    return () => {
      cancelAnimationFrame(raf); themeObs.disconnect(); ro.disconnect(); io.disconnect()
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up)
    }
  }, [])

  return <canvas ref={canvas} role='img' aria-label='Spinning globe' className={className} style={{ cursor: 'grab', touchAction: 'pan-y' }} />
}
