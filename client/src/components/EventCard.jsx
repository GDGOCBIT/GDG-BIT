import { formatDate, formatTime } from '../utils/api'
import { sized } from '../utils/images'
import Img from './Img'

export const StatusPill = ({ status }) =>
  status === 'live' ? (
    <span className='pill pill-live'><span className='live-dot' /> Live now</span>
  ) : status === 'upcoming' ? (
    <span className='pill pill-upcoming'>Upcoming</span>
  ) : (
    <span className='pill pill-past'>Past</span>
  )

const PASTELS = ['var(--blue-pa)', 'var(--red-pa)', 'var(--yellow-pa)', 'var(--green-pa)']

export default function EventCard ({ event, index = 0 }) {
  const Tag = event.link ? 'a' : 'div'
  const linkProps = event.link ? { href: event.link, target: '_blank', rel: 'noreferrer' } : {}

  return (
    <Tag {...linkProps} className='card lift flex flex-col h-full group'>
      <div className='relative aspect-square border-b-2 border-[var(--outline)]' style={{ background: PASTELS[index % 4] }}>
        {event.image?.url ? (
          <Img src={sized(event.image.url, 640)} srcSet={`${sized(event.image.url, 320)} 320w, ${sized(event.image.url, 640)} 640w, ${sized(event.image.url, 960)} 960w`} sizes='(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw' alt='' width='640' height='640' loading='lazy' className='w-full h-full object-cover' />
        ) : (
          <div className='w-full h-full flex items-center justify-center text-[var(--black)]'>
            <img src='/brand/gdg-mark-256.png' alt='' className='h-14' />
          </div>
        )}
        <div className='absolute top-3 left-3'><StatusPill status={event.status} /></div>
      </div>
      <div className='p-5 flex flex-col gap-2 flex-1'>
        <p className='mono text-xs text-[var(--muted)]'>
          {formatDate(event.startDate)} · {formatTime(event.startDate)} · {event.mode}
        </p>
        <h3 className='text-lg font-medium leading-snug line-clamp-2'>{event.title}</h3>
        {event.description && <p className='text-sm text-[var(--muted)] line-clamp-3'>{event.description}</p>}
        {event.link && (
          <span className='mt-auto pt-2 text-sm font-medium inline-flex items-center gap-1.5'>
            {event.status === 'past' ? 'View recap' : 'RSVP'}
            <span className='transition-transform group-hover:translate-x-1'>→</span>
          </span>
        )}
      </div>
    </Tag>
  )
}
