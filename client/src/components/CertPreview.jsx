import { useEffect, useRef, useState } from 'react'
import { api, decrypt } from '../utils/api'

// The four older certificates are a fixed picture plus the name. Positions are % of the picture, text size is
// in cqw (a share of the preview's width), so the preview looks right at any size.
const LEGACY = {
  'Google Cloud Study Jam': { img: '/cloudCertificate.png', name: { top: '53%', center: true, size: 5, color: '#4b5563', font: "'Island Moments', cursive" } },
  'Google Cloud Study Jam Facilitator': { img: '/cloudCertificateFacilitator.png', name: { top: '53%', center: true, size: 5, color: '#4b5563', font: "'Island Moments', cursive" } },
  'Google Gen AI Study Jam 2024': { img: '/genai_24_cert_tmp.png', name: { top: '41%', center: true, size: 4, color: '#d9d9d9', font: "'Caveat', cursive" } },
  'Core Team 24': { img: '/certificates/core_24.svg', name: { top: '35%', left: '10%', size: 4, color: '#f29900', font: "'Roboto', sans-serif" } }
}

/**
 * Small picture of a certificate. It loads only when scrolled into view: designer-made certificates are drawn
 * by the same renderer as the verify page, the older ones are their picture with the member's name on it.
 */
export default function CertPreview ({ id, className = '' }) {
  const box = useRef(null)
  const [seen, setSeen] = useState(false)
  const [state, setState] = useState({ kind: 'loading' })

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return undefined }
    const io = new IntersectionObserver(e => { if (e[0].isIntersecting) { setSeen(true); io.disconnect() } }, { rootMargin: '200px' })
    io.observe(box.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!seen) return undefined
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/cert/verify/${id}`).then(r => r.json())
        if (!res.success) throw new Error('missing')
        const data = await decrypt(res.data)
        if (data.template) {
          const { renderCertificate } = await import('../utils/certRender')
          const canvas = await renderCertificate(data.template, { values: data.values || {}, id: data._id, verifyUrl: data.verifyURL }, 720)
          if (alive) setState({ kind: 'image', src: canvas.toDataURL('image/jpeg', 0.8) })
        } else if (LEGACY[data.certificate]) {
          const { ensureCertFonts } = await import('../utils/certRender')
          ensureCertFonts()
          if (alive) setState({ kind: 'legacy', cfg: LEGACY[data.certificate], name: data.fullName })
        } else if (alive) setState({ kind: 'none' })
      } catch { if (alive) setState({ kind: 'none' }) }
    })()
    return () => { alive = false }
  }, [seen, id])

  const s = state
  return (
    <div ref={box} className={`relative w-full overflow-hidden bg-white ${className}`} style={{ containerType: 'inline-size', aspectRatio: '1.45' }}>
      {s.kind === 'image' && <img src={s.src} alt='' className='absolute inset-0 w-full h-full object-cover' />}
      {s.kind === 'legacy' && (
        <>
          <img src={s.cfg.img} alt='' className='absolute inset-0 w-full h-full object-cover' />
          <p className='absolute m-0 whitespace-nowrap leading-tight' style={{
            top: s.cfg.name.top, left: s.cfg.name.center ? 0 : s.cfg.name.left, width: s.cfg.name.center ? '100%' : 'auto',
            textAlign: s.cfg.name.center ? 'center' : 'left', transform: s.cfg.name.center ? 'translateY(-50%)' : 'none',
            fontSize: `${s.cfg.name.size}cqw`, color: s.cfg.name.color, fontFamily: s.cfg.name.font
          }}>{s.name}</p>
        </>
      )}
      {s.kind === 'loading' && <div className='absolute inset-0 skeleton' />}
      {s.kind === 'none' && <div className='absolute inset-0 flex items-center justify-center text-[var(--black)] mono text-xs'>Preview unavailable</div>}
    </div>
  )
}
