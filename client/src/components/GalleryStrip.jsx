import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Lightbox from './Lightbox'
import { Arrow } from './Brand'
import useGallery from '../utils/useGallery'

const TILT = [-3, 2, -1.5, 3, -2, 1.5]

/**
 * Home-page film strip. It drifts on its own, you can drag / swipe / scroll it,
 * and the ‹ › buttons slide it by a few photos. Hovering or touching pauses the drift.
 */
export default function GalleryStrip () {
  const { items, loading } = useGallery()
  const [open, setOpen] = useState(null)
  const scroller = useRef(null)
  const pausedUntil = useRef(0)
  const strip = items.slice(0, 14)
  const loop = [...strip, ...strip] // doubled so the strip can wrap around seamlessly

  // One animation loop: slow drift + eased arrow slides, both based on elapsed time (not frame rate).
  // The position is kept in a float of our own: browsers round scrollLeft to whole pixels, so adding a
  // fraction per frame and reading it back never moves on a fast display.
  const anim = useRef(null)
  const pos = useRef(0)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  useEffect(() => {
    const el = scroller.current
    if (!el || strip.length < 2) return undefined
    let raf = 0
    let last = performance.now()
    let hovering = false
    let written = el.scrollLeft
    pos.current = el.scrollLeft
    const pause = (ms = 2500) => { pausedUntil.current = Date.now() + ms }
    const enter = () => { hovering = true }
    const leave = () => { hovering = false }
    const cancel = () => { anim.current = null; pause(3500) } // user grabbed the strip: stop animating
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const half = el.scrollWidth / 2
      if (half > 0) {
        // somebody else moved it (finger, wheel, scrollbar): continue from where it is now
        if (Math.abs(el.scrollLeft - written) > 2) pos.current = el.scrollLeft
        const a = anim.current
        if (a) {
          const t = Math.min(1, (now - a.start) / a.dur)
          pos.current = a.from + (a.to - a.from) * (1 - Math.pow(1 - t, 3))
          if (t >= 1) anim.current = null
        } else if (!pausedRef.current && !hovering && Date.now() > pausedUntil.current) {
          pos.current += 42 * dt // about 42px per second
        }
        if (pos.current >= half) { // both copies look identical, so jump back by exactly one copy
          pos.current -= half
          if (anim.current) { anim.current.from -= half; anim.current.to -= half }
        }
        el.scrollLeft = pos.current
        written = el.scrollLeft
      }
      raf = requestAnimationFrame(tick)
    }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('touchstart', cancel, { passive: true })
    el.addEventListener('wheel', cancel, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave)
      el.removeEventListener('touchstart', cancel); el.removeEventListener('wheel', cancel)
    }
  }, [strip.length])

  const slide = dir => {
    const el = scroller.current
    if (!el) return
    pausedUntil.current = Date.now() + 5000
    const half = el.scrollWidth / 2
    const w = el.clientWidth
    let from = anim.current ? anim.current.to : pos.current
    if (dir < 0 && from < w) from += half // start in the second copy so there is room to go back
    pos.current = anim.current ? pos.current + (from - anim.current.to) : from
    el.scrollLeft = pos.current
    anim.current = { from: pos.current, to: from + dir * Math.min(w * 0.8, 640), start: performance.now(), dur: 550 }
  }

  if (!loading && !items.length) return null

  return (
    <section className='py-10 overflow-hidden' aria-label='Gallery'>
      <div className='wrap flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8'>
        <div>
          <p className='eyebrow mb-2'>Gallery</p>
          <h2 className='title-1'>Moments we <b>keep building</b></h2>
        </div>
        <div className='flex items-center gap-2 self-start sm:self-auto'>
          <button className='btn btn-ghost btn-still btn-icon' aria-label={paused ? 'Play the gallery' : 'Pause the gallery'} aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? '▶' : '❚❚'}</button>
          <button className='btn btn-ghost btn-still btn-icon' aria-label='Scroll gallery left' onClick={() => slide(-1)}>←</button>
          <button className='btn btn-ghost btn-still btn-icon' aria-label='Scroll gallery right' onClick={() => slide(1)}>→</button>
          <Link to='/gallery' className='btn btn-ghost btn-still'>Open the gallery <Arrow width={26} /></Link>
        </div>
      </div>

      <div ref={scroller} className='no-scrollbar overflow-x-auto py-4' aria-label='Photo strip'>
        <div className='flex gap-5 sm:gap-6 px-5 w-max'>
          {(loading ? Array.from({ length: 8 }) : loop).map((it, i) => (
            it ? (
              <button key={i} onClick={() => setOpen(i % strip.length)} aria-label={`Open ${it.title}`}
                className='card lift shrink-0 w-52 sm:w-64 aspect-[4/5] !overflow-hidden' style={{ transform: `rotate(${TILT[i % TILT.length]}deg)` }}>
                <img src={it.thumb} alt={it.title} loading='lazy' className='w-full h-full object-cover' draggable={false} />
              </button>
            ) : <div key={i} className='card skeleton shrink-0 w-52 sm:w-64 aspect-[4/5]' />
          ))}
        </div>
      </div>
      <Lightbox items={strip} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  )
}
