import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Lightbox from '../components/Lightbox'
import useGallery from '../utils/useGallery'
import Img from '../components/Img'

export default function Gallery () {
  const { items, photoCount, loading, error } = useGallery()
  const [kind, setKind] = useState('all')
  const [open, setOpen] = useState(null)
  const shown = items.filter(i => kind === 'all' || i.kind === kind)
  const chips = [['all', 'All', items.length], ['photo', 'Photos', photoCount], ['poster', 'Posters', items.length - photoCount]].filter(c => c[0] === 'all' || c[2] > 0)

  return (
    <>
      <PageHeader tag='Gallery' title={<>Moments from <b>our community</b></>}
        text='Workshops, hackathons and late-night builds. Tap any picture to open it.' tone='green' dot='var(--green)' />
      <section className='wrap pt-10'>
        {chips.length > 2 && (
          <div role='tablist' aria-label='Filter gallery' className='tabs mb-8'>
            {chips.map(([k, label, n]) => (
              <button key={k} role='tab' aria-selected={kind === k} onClick={() => setKind(k)} className='tab'>{label} <span className='count'>{n}</span></button>
            ))}
          </div>
        )}
        {loading ? (
          <div className='columns-2 md:columns-3 lg:columns-4 gap-4'>
            {[220, 300, 180, 260, 320, 200, 280, 240].map((h, i) => <div key={i} className='card skeleton mb-4 break-inside-avoid' style={{ height: h }} />)}
          </div>
        ) : error ? (
          <EmptyState title='Could not load the gallery' text={error} tone='red' />
        ) : !shown.length ? (
          <EmptyState title='Photos coming soon' text='Check back after our next event.' tone='green' />
        ) : (
          <div className='columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4'>
            {shown.map((it, i) => (
              <button key={it.id} onClick={() => setOpen(i)} aria-label={`Open ${it.title}`}
                className='card lift block w-full bg-[var(--sunken)] mb-3 sm:mb-4 break-inside-avoid text-left group relative'>
                <Img src={it.thumb} srcSet={it.srcSet} sizes='(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw' alt={it.title} loading='lazy' className='w-full h-auto block' style={it.w && it.h ? { aspectRatio: `${it.w} / ${it.h}` } : undefined} />
                <span className='absolute inset-x-0 bottom-0 p-3 pt-10 text-sm text-white bg-gradient-to-t from-black/75 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity line-clamp-2'>
                  {it.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
      <Lightbox items={shown} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  )
}
