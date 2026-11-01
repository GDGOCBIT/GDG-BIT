import { lazy, Suspense, useEffect, useState } from 'react'
import { useThemeStore } from '../store/useThemeStore'

// Only the four Google / GDG colours pop out of the faint letter field.
const GDG = ['#4285f4', '#ea4335', '#f9ab00', '#34a853']
const GDG_DARK = ['#8ab4f8', '#f28b82', '#fdd663', '#81c995']

const LetterGlitch = lazy(() => import('./LetterGlitch'))

/**
 * The WebGL layer is only for real desktops/laptops: a wide screen driven by a mouse. Phones and tablets
 * (touch, coarse pointer) get the static pattern, which also avoids GPU-driver quirks on mobile chips.
 */
function useFullEffects () {
  const q = '(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
  const [on, setOn] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setOn(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return on
}

/**
 * Site-wide background.
 * - Phones, tablets, touch screens, reduced motion: a static CSS dot grid with faint Google-tinted glows (no JS, no GPU work).
 * - Desktop: the WebGL letter glitch, capped at ~22 fps, loaded only after the page has settled.
 */
export default function GlitchBackground () {
  const dark = useThemeStore(s => s.theme === 'dark')
  const full = useFullEffects()
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!full) return undefined
    const go = () => setArmed(true)
    if ('requestIdleCallback' in window) { const id = requestIdleCallback(go, { timeout: 2500 }); return () => cancelIdleCallback(id) }
    const t = setTimeout(go, 1200)
    return () => clearTimeout(t)
  }, [full])

  if (!full || !armed) return <div className='static-bg' aria-hidden='true' />
  return (
    <>
      <div className='static-bg' aria-hidden='true' style={{ opacity: 0.6 }} />
      <Suspense fallback={null}>
        <LetterGlitch
          aria-hidden='true'
          lightMode={!dark}
          glitchColors={dark ? GDG_DARK : GDG}
          baseColor={dark ? '#e8eaed' : '#1e1e1e'}
          baseOpacity={dark ? 0.08 : 0.07}
          characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>{}[]/=+-*;:#&'
          fontFamily="'Google Sans Code', 'Roboto Mono', ui-monospace, monospace"
          fontSize={15}
          spacing={0.7}
          density={0.85}
          glitchAmount={0.62}
          speed={0.85}
          flow={0.75}
          interactive
          cursorRadius={170}
          repel={0.42}
          maxFps={22}
          dpr={Math.min(window.devicePixelRatio || 1, 1.5)}
          clickEffect='none'
        />
      </Suspense>
    </>
  )
}
