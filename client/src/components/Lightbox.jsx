import { useEffect } from 'react'

/** Full-screen photo viewer: ←/→ to browse, Esc to close, swipe-friendly buttons on phones. */
export default function Lightbox ({ items, index, onClose, onIndex }) {
  const item = items[index]
  useEffect(() => {
    if (index == null) return undefined
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [index, items.length, onClose, onIndex])
  if (!item) return null

  const nav = (dir, label) => (
    <button
      aria-label={label}
      onClick={e => { e.stopPropagation(); onIndex((index + dir + items.length) % items.length) }}
      className='btn btn-light btn-icon absolute top-1/2 -translate-y-1/2 z-10'
      style={{ [dir > 0 ? 'right' : 'left']: '0.75rem' }}>
      {dir > 0 ? '→' : '←'}
    </button>
  )

  return (
    <div role='dialog' aria-modal='true' aria-label={item.title} onClick={onClose}
      className='fixed inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center p-4 sm:p-8'>
      <button aria-label='Close' onClick={onClose} className='btn btn-light btn-icon absolute top-3 right-3 z-10'>✕</button>
      {items.length > 1 && nav(-1, 'Previous photo')}
      {items.length > 1 && nav(1, 'Next photo')}
      <img src={item.src} alt={item.title} onClick={e => e.stopPropagation()}
        className='max-h-[78vh] max-w-full w-auto h-auto rounded-2xl border-2 border-white/80 object-contain bg-black' />
      <div onClick={e => e.stopPropagation()} className='mt-4 text-center text-white max-w-xl'>
        <p className='font-medium'>{item.title}</p>
        {item.caption && <p className='text-sm text-white/70 mt-1'>{item.caption}</p>}
        <p className='mono text-xs text-white/50 mt-2'>{index + 1} / {items.length}{item.kind === 'poster' ? ' · event poster' : ''}</p>
        {item.link && <a href={item.link} target='_blank' rel='noreferrer' className='btn btn-light btn-sm mt-3'>View event →</a>}
      </div>
    </div>
  )
}
