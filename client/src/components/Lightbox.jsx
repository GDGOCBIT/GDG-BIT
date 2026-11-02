import { useEffect, useRef, useState } from 'react'
import { LuArrowLeft, LuArrowRight, LuArrowUpRight, LuX } from 'react-icons/lu'

/**
 * Full-screen photo viewer. ←/→ keys, on-screen arrows and swipe all move between photos.
 * The small thumbnail shows instantly while the full-size photo loads, and the neighbouring
 * photos are preloaded, so changing photo never feels stuck.
 */
export default function Lightbox ({ items, index, onClose, onIndex }) {
  const item = items[index]
  const [loadedSrc, setLoadedSrc] = useState('')
  const touch = useRef(null)
  const count = items.length

  const go = dir => onIndex((index + dir + count) % count)

  useEffect(() => {
    if (index == null) return undefined
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [index, count]) // eslint-disable-line react-hooks/exhaustive-deps

  // Once the current photo is on screen, warm the cache for the next and previous ones
  // (so they never compete with the photo being viewed).
  useEffect(() => {
    if (index == null || count < 2 || loadedSrc !== item?.src) return
    ;[1, -1].forEach(d => { const n = items[(index + d + count) % count]; if (n) new Image().src = n.src })
  }, [index, count, items, loadedSrc]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLoadedSrc('') }, [item?.src])

  if (!item) return null
  const ready = loadedSrc === item.src

  const arrow = (dir, label) => (
    <button aria-label={label} onClick={e => { e.stopPropagation(); go(dir) }}
      className='btn btn-light btn-still btn-icon !w-12 !h-12 sm:!w-14 sm:!h-14 absolute top-1/2 -translate-y-1/2 z-10'
      style={{ [dir > 0 ? 'right' : 'left']: '0.75rem' }}>
      {dir > 0 ? <LuArrowRight aria-hidden='true' size={22} /> : <LuArrowLeft aria-hidden='true' size={22} />}
    </button>
  )

  return (
    <div role='dialog' aria-modal='true' aria-label={item.title} onClick={onClose}
      onTouchStart={e => { touch.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touch.current == null) return
        const dx = e.changedTouches[0].clientX - touch.current
        touch.current = null
        if (Math.abs(dx) > 50 && count > 1) go(dx < 0 ? 1 : -1)
      }}
      className='fixed inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center p-4 sm:p-8'>
      <button aria-label='Close' onClick={onClose} className='btn btn-light btn-icon absolute top-3 right-3 z-10'><LuX aria-hidden='true' size={20} /></button>
      {count > 1 && arrow(-1, 'Previous photo')}
      {count > 1 && arrow(1, 'Next photo')}

      <div onClick={e => e.stopPropagation()} className='relative max-h-[78vh] max-w-full flex items-center justify-center'>
        {/* instant preview (already cached from the grid), sharpened by the full photo once it arrives */}
        <img key={'t' + item.src} src={item.thumb} alt='' aria-hidden='true'
          className='max-h-[78vh] max-w-full w-auto h-auto rounded-2xl border-2 border-white/80 object-contain bg-black' style={{ minWidth: '12rem' }} />
        <img key={item.src} src={item.src} alt={item.title} onLoad={() => setLoadedSrc(item.src)}
          className='absolute inset-0 w-full h-full rounded-2xl object-contain transition-opacity duration-200'
          style={{ opacity: ready ? 1 : 0 }} />
        {!ready && <span aria-label='Loading photo' className='absolute top-3 left-3 w-6 h-6 rounded-full border-2 border-white/30 border-t-white spin-fast' />}
      </div>

      <div onClick={e => e.stopPropagation()} className='mt-4 text-center text-white max-w-xl'>
        <p className='font-medium'>{item.title}</p>
        {item.caption && <p className='text-sm text-white/70 mt-1'>{item.caption}</p>}
        <p className='mono text-xs text-white/50 mt-2'>{index + 1} / {count}{item.kind === 'poster' ? ' · event poster' : ''}</p>
        {item.link && <a href={item.link} target='_blank' rel='noreferrer' className='btn btn-light btn-sm mt-3'>View event <LuArrowUpRight aria-hidden='true' size={16} /></a>}
      </div>
    </div>
  )
}
