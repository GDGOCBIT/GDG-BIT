import { useState } from 'react'
import { Link } from 'react-router-dom'
import Lightbox from './Lightbox'
import { Arrow } from './Brand'
import useGallery from '../utils/useGallery'

const TILT = [-3, 2, -1.5, 3, -2, 1.5]

/** Home-page gallery: a slow auto-scrolling film strip. Pauses on hover; click opens the lightbox. */
export default function GalleryStrip () {
  const { items, loading } = useGallery()
  const [open, setOpen] = useState(null)
  if (!loading && !items.length) return null
  const strip = items.slice(0, 14)
  const loop = [...strip, ...strip]

  return (
    <section className='py-10 overflow-hidden' aria-label='Gallery'>
      <div className='wrap flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8'>
        <div>
          <p className='eyebrow mb-2'>Gallery</p>
          <h2 className='title-1'>Moments we <b>keep building</b></h2>
        </div>
        <Link to='/gallery' className='btn btn-ghost self-start sm:self-auto'>Open the gallery <Arrow width={26} /></Link>
      </div>

      <div className='marquee-wrap overflow-hidden py-4'>
        <div className='marquee gap-5 sm:gap-6 pl-5' style={{ '--t': `${Math.max(40, strip.length * 6)}s` }}>
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
