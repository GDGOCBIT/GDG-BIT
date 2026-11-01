import { Link } from 'react-router-dom'
import useApi from '../utils/useApi'
import EventGrid from '../components/EventGrid'
import { StatusPill } from '../components/EventCard'
import { formatDate, formatTime } from '../utils/api'
import useSettings from '../utils/useSettings'
import { sized } from '../utils/images'
import { Arrow, COMMUNITY_URL, Dots, Globe, Waves } from '../components/Brand'
import { FaDiscord, FaGithub, FaInstagram, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import GalleryStrip from '../components/GalleryStrip'

const sortForHome = items => {
  const rank = { live: 0, upcoming: 1, past: 2 }
  return [...items].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      (a.status === 'past'
        ? new Date(b.startDate) - new Date(a.startDate)
        : new Date(a.startDate) - new Date(b.startDate))
  )
}

const CHAPTER_FOUNDED = 2023

function Stats ({ events, team, members }) {
  const stats = [
    { n: events.length || '—', label: 'events hosted', c: 'var(--blue-pa)' },
    { n: members ? members.toLocaleString('en-IN') : '—', label: 'chapter members', c: 'var(--red-pa)' },
    { n: team || '—', label: 'organizers & leads', c: 'var(--yellow-pa)' },
    { n: CHAPTER_FOUNDED, label: 'running since', c: 'var(--green-pa)' }
  ]
  return (
    <section className='wrap py-10'>
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {stats.map(s => (
          <div key={s.label} className='band p-5 sm:p-6' style={{ background: s.c }}>
            <p className='text-4xl sm:text-5xl font-medium'>{s.n}</p>
            <p className='mono text-xs sm:text-sm mt-1'>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Spotlight ({ event }) {
  if (!event) return null
  const isPast = event.status === 'past'
  return (
    <section className='wrap py-10'>
      <div className='band band-yellow overflow-hidden grid md:grid-cols-[1fr_1.3fr]'>
        {event.image?.url && (
          <img src={sized(event.image.url, 900)} alt='' width='900' height='900' loading='lazy' decoding='async' className='w-full h-64 md:h-full object-cover border-b-2 md:border-b-0 md:border-r-2 border-[var(--black)]' />
        )}
        <div className='p-6 sm:p-10 flex flex-col gap-4 justify-center'>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='mono text-sm'>{isPast ? 'Latest event' : 'Next up'}</span>
            <StatusPill status={event.status} />
          </div>
          <h2 className='title-2'>{event.title}</h2>
          <p className='mono text-sm'>
            {formatDate(event.startDate)} · {formatTime(event.startDate)} · {event.mode}
          </p>
          {event.description && <p className='text-[var(--muted)] line-clamp-3'>{event.description}</p>}
          {event.link && (
            <a href={event.link} target='_blank' rel='noreferrer' className='btn btn-ink self-start'>
              {isPast ? 'See the recap' : 'RSVP on GDG'} <Arrow width={26} />
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

const OFFER = [
  { title: 'Study Jams', text: 'Guided, hands-on learning tracks on Cloud, Gen AI, Android and more.', c: 'var(--blue-pa)', d: 'var(--blue)' },
  { title: 'Workshops', text: 'Weekend sessions on web, app development, UI/UX and DSA with people who use them daily.', c: 'var(--red-pa)', d: 'var(--red)' },
  { title: 'Hackathons', text: 'CTFs, build nights and the Solution Challenge — ship something real with a team.', c: 'var(--yellow-pa)', d: 'var(--yellow)' },
  { title: 'Community', text: 'Mentorship, open source and a friendly crowd to learn alongside.', c: 'var(--green-pa)', d: 'var(--green)' }
]

function WhatWeDo () {
  return (
    <section className='wrap py-10'>
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8'>
        <div>
          <p className='eyebrow mb-2'>What we do</p>
          <h2 className='title-1'>Built for <b>learning by doing</b></h2>
        </div>
        <Waves className='max-sm:hidden' />
      </div>
      <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {OFFER.map(o => (
          <div key={o.title} className='card lift p-6 flex flex-col gap-4'>
            <span className='w-12 h-12 rounded-full border-2 border-[var(--outline)] flex items-center justify-center' style={{ background: o.c }}>
              <span className='w-4 h-4 rounded-full border-2 border-[var(--black)]' style={{ background: o.d }} />
            </span>
            <h3 className='text-xl font-medium'>{o.title}</h3>
            <p className='text-sm text-[var(--muted)]'>{o.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function TeamPreview ({ team }) {
  if (!team.length) return null
  return (
    <section className='wrap py-10'>
      <div className='card p-6 sm:p-10 flex flex-col md:flex-row md:items-center gap-8 justify-between'>
        <div className='flex flex-col gap-3 max-w-md'>
          <p className='eyebrow'>The people</p>
          <h2 className='title-2'>Run by students, <b>for students</b>.</h2>
          <Link to='/team' className='btn btn-ghost self-start mt-2'>Meet the team <Arrow width={26} /></Link>
        </div>
        <div className='flex flex-wrap -space-x-3'>
          {team.slice(0, 8).map(m => (
            <img key={m._id} src={m.image?.url || '/user.svg'} alt={m.name} title={m.name}
              className='w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[var(--outline)] bg-[var(--sunken)]' />
          ))}
        </div>
      </div>
    </section>
  )
}

function JoinBand () {
  return (
    <section className='wrap py-10'>
      <div className='band band-red relative overflow-hidden px-6 py-10 sm:p-14 flex flex-col lg:flex-row gap-8 lg:items-center justify-between'>
        <div className='flex flex-col gap-5 relative z-10'>
          <h2 className='title-display !text-[clamp(2.4rem,6vw,4rem)]'>Join our<br />community</h2>
          <div className='flex items-center gap-4'>
            <Arrow width={56} />
            <Dots color='var(--red)' size={26} />
            <Globe size={56} className='max-sm:hidden' />
          </div>
        </div>
        <div className='flex flex-col gap-4 relative z-10'>
          <p className='max-w-sm'>Get notified about new events and become a member on the official GDG community platform.</p>
          <a href={COMMUNITY_URL} target='_blank' rel='noreferrer' className='btn btn-ink self-start'>Become a member</a>
        </div>
      </div>
    </section>
  )
}

const SOCIAL_ICONS = {
  instagram: [FaInstagram, '#e4405f'],
  linkedin: [FaLinkedinIn, '#0a66c2'],
  github: [FaGithub, '#181717'],
  discord: [FaDiscord, '#5865f2'],
  x: [FaXTwitter, '#000000']
}

function Socials () {
  const { socials } = useSettings()
  return (
    <section className='wrap py-10'>
      <div className='text-center mb-8'>
        <p className='eyebrow mb-2'>Say hi</p>
        <h2 className='title-1'>Find us <b>online</b></h2>
      </div>
      <div className='grid grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4'>
        {socials.map(s => (
          <a key={s.key} href={s.url} target='_blank' rel='noreferrer' className='card lift p-4 sm:p-5 flex flex-col items-center gap-3'>
            <span className='w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-[var(--outline)] flex items-center justify-center'>
              {SOCIAL_ICONS[s.key]
                ? (() => { const [Icon, color] = SOCIAL_ICONS[s.key]; return <Icon className='w-6 h-6 sm:w-7 sm:h-7' style={{ color }} aria-hidden='true' /> })()
                : <img src={s.icon} alt='' className='w-7 h-7 sm:w-8 sm:h-8 object-contain' />}
            </span>
            <span className='text-sm font-medium'>{s.label}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function HomeBelow ({ events, team, members, loading, error }) {
  const sorted = sortForHome(events)
  const spotlight = sorted[0]
  const recent = sorted.slice(1, 4)

  return (
    <>
      <Spotlight event={spotlight} />
      <section className='wrap py-10'>
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8'>
          <div>
            <p className='eyebrow mb-2'>Events</p>
            <h2 className='title-1'>More from <b>our calendar</b></h2>
          </div>
          <Link to='/events' className='btn btn-ghost self-start sm:self-auto'>All events <Arrow width={26} /></Link>
        </div>
        <EventGrid events={recent} loading={loading} error={error} empty='No events yet — stay tuned!' />
      </section>
      <GalleryStrip />
      <Stats events={events} team={team.length} members={members} />
      <WhatWeDo />
      <TeamPreview team={team} />
      <JoinBand />
      <Socials />
    </>
  )
}
