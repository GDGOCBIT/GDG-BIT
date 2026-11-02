import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Arrow, BraceTag, CodeTag, COMMUNITY_URL, Dots, Slashes, Spark } from './Brand'
import { formatDate } from '../utils/api'
import useGallery from '../utils/useGallery'
import { Live } from './HeroParts'
import InteractiveGlobe from './InteractiveGlobe'

const WORDS = [['learn', 'var(--blue)'], ['build', 'var(--red)'], ['ship', 'var(--yellow)'], ['grow', 'var(--green)']]

/** Headline word that cycles through the four GDG colours. */
function RotatingWord () {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const t = setInterval(() => setI(n => (n + 1) % WORDS.length), 2400)
    return () => clearInterval(t)
  }, [])
  return (
    <span className='relative inline-grid align-bottom' aria-live='off'>
      {/* every word occupies the same cell so the width never jumps */}
      {WORDS.map(([w, c], k) => (
        <span key={w} className={`[grid-area:1/1] font-bold uppercase tracking-tight ${k === i ? 'word-in' : 'invisible'}`} style={{ color: c, fontWeight: 700 }} aria-hidden={k !== i}>{w}</span>
      ))}
      <svg key={i} className='absolute left-0 -bottom-1 sm:-bottom-2 w-full h-3 sm:h-4 word-in' viewBox='0 0 200 14' preserveAspectRatio='none' aria-hidden='true' style={{ color: WORDS[i][1] }}>
        <path d='M2 8 Q 14 1 26 8 T 50 8 T 74 8 T 98 8 T 122 8 T 146 8 T 170 8 T 198 8' fill='none' stroke='currentColor' strokeWidth='3.5' strokeLinecap='round' />
      </svg>
    </span>
  )
}

const pad = n => String(Math.max(0, n)).padStart(2, '0')

function Countdown ({ event }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const live = event.status === 'live'
  const diff = Math.max(0, new Date(event.startDate).getTime() - now)
  const parts = [[Math.floor(diff / 864e5), 'days'], [Math.floor(diff / 36e5) % 24, 'hrs'], [Math.floor(diff / 6e4) % 60, 'min'], [Math.floor(diff / 1e3) % 60, 'sec']]
  return (
    <a href={event.link} target='_blank' rel='noreferrer' className='card lift flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-4 max-w-xl'>
      <div className='min-w-0 flex-1'>
        <p className='mono text-xs text-[var(--muted)] flex items-center gap-2'>
          {live ? <><span className='live-dot' /> Happening now</> : <>Next up · {formatDate(event.startDate)}</>}
        </p>
        <p className='font-medium truncate mt-0.5'>{event.title}</p>
      </div>
      {!live && (
        <div className='flex gap-2' aria-label='Time until the event'>
          {parts.map(([n, l]) => (
            <div key={l} className='w-14 text-center rounded-xl border-2 border-[var(--outline)] bg-[var(--sunken)] py-1.5'>
              <div className='mono text-lg leading-none tabular-nums'>{pad(n)}</div>
              <div className='mono text-[0.6rem] text-[var(--muted)] mt-1'>{l}</div>
            </div>
          ))}
        </div>
      )}
    </a>
  )
}

const SLOTS = [ // x / y in % of the stack box, rotation, parallax depth
  { x: 2, y: 8, w: 46, rot: -9, depth: 0.5, z: 1 },
  { x: 50, y: 2, w: 46, rot: 7, depth: 1.0, z: 2 },
  { x: 8, y: 46, w: 47, rot: 5, depth: 1.5, z: 3 },
  { x: 49, y: 44, w: 44, rot: -6, depth: 0.8, z: 2 }
]
const FALLBACK = ['var(--blue-pa)', 'var(--red-pa)', 'var(--yellow-pa)', 'var(--green-pa)']

/** Event posters fanned out like a hand of cards; they lean toward the pointer. */
/** Uploaded photos first, interleaved with event posters, so the hero shows real moments and not only posters. */
const mixImages = items => {
  const photos = items.filter(i => i.kind === 'photo')
  const posters = items.filter(i => i.kind === 'poster')
  const out = []
  for (let k = 0; out.length < 4 && (k < photos.length || k < posters.length); k++) {
    if (photos[k]) out.push(photos[k])
    if (out.length < 4 && posters[k]) out.push(posters[k])
  }
  return out.slice(0, 4)
}

function PosterStack () {
  const box = useRef(null)
  const { items } = useGallery()
  const posters = mixImages(items)

  const move = e => {
    const r = box.current.getBoundingClientRect()
    box.current.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
    box.current.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
  }
  const leave = () => { box.current.style.setProperty('--mx', 0); box.current.style.setProperty('--my', 0) }

  return (
    <div className='relative mx-auto w-full max-w-[34rem] aspect-square' onPointerMove={move} onPointerLeave={leave} ref={box}>
      {/* colour glow + slow orbit rings behind the cards */}
      <div aria-hidden='true' className='absolute inset-0 pointer-events-none'
        style={{ background: 'radial-gradient(38% 38% at 28% 30%, rgba(66,133,244,.22), transparent 70%), radial-gradient(38% 38% at 74% 28%, rgba(234,67,53,.16), transparent 70%), radial-gradient(38% 38% at 26% 74%, rgba(251,188,5,.2), transparent 70%), radial-gradient(38% 38% at 76% 76%, rgba(52,168,83,.2), transparent 70%)' }} />
      <svg aria-hidden='true' className='absolute inset-0 w-full h-full spin-slower doodle opacity-40' viewBox='0 0 100 100'>
        <circle cx='50' cy='50' r='48' fill='none' stroke='currentColor' strokeWidth='0.4' strokeDasharray='1.5 2.5' />
      </svg>

      {SLOTS.map((s, i) => {
        const p = posters[i]
        const style = { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, '--rot': `${s.rot}deg`, '--depth': s.depth, zIndex: s.z }
        const inner = p
          ? <img src={p.thumb} alt={p.title} width='480' height='480' className='w-full h-full object-cover' loading={i < 2 ? 'eager' : 'lazy'} fetchpriority={i === 0 ? 'high' : 'auto'} decoding='async' draggable={false} />
          : <div className='w-full h-full' style={{ background: FALLBACK[i] }} />
        return (
          <div key={i} className='stack-card' style={style}>
            <div className={`${i % 2 ? 'float-y' : 'float-r'}`} style={{ '--d': `${i * -1.3}s`, '--r2': `${s.rot > 0 ? 2 : -2}deg` }}>
              {p?.link
                ? <a href={p.link} target='_blank' rel='noreferrer' aria-label={p.title} className='card block aspect-square shadow-[5px_5px_0_var(--outline)]'>{inner}</a>
                : <div className='card aspect-square shadow-[5px_5px_0_var(--outline)]'>{inner}</div>}
            </div>
          </div>
        )
      })}

      {/* interactive globe in the middle of the cards: drag it to spin */}
      <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] aspect-square' style={{ zIndex: 5 }}>
        <InteractiveGlobe className='w-full h-full block rounded-full' />
      </div>

      {/* floating extras */}
      <div className='hero-extras'>
      <CodeTag size={96} className='absolute -top-2 right-0 float-y text-[var(--outline)]' />
      <Dots color='var(--red)' size={20} className='absolute bottom-[2%] right-[4%] float-r' />
      <Spark size={34} className='absolute top-[42%] -right-1 spin-slow' />
      <Slashes size={56} color='var(--yellow-ht)' className='absolute top-[40%] -left-3 float-r' />
      <span className='pill pill-blue absolute top-[3%] left-[2%] -rotate-6 float-y z-10' style={{ '--d': '-2s' }}>Study Jams</span>
      <span className='pill pill-yellow absolute bottom-[10%] right-[18%] rotate-3 float-r z-10' style={{ '--d': '-1s' }}>Hackathons</span>

      </div>

      {/* spinning badge */}
      <div className='absolute -bottom-2 -left-2 w-32 h-32 sm:w-36 sm:h-36 z-20'>
        <svg viewBox='0 0 120 120' className='w-full h-full spin-slow'>
          <defs><path id='circ' d='M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0' /></defs>
          <circle cx='60' cy='60' r='58' fill='var(--yellow-ht)' stroke='var(--black)' strokeWidth='2' />
          <text fontSize='10.5' fill='var(--black)' className='mono' letterSpacing='1.4'>
            <textPath href='#circ'>GDG ON CAMPUS • BIT KOLKATA • LEARN • BUILD • SHIP •</textPath>
          </text>
        </svg>
        <img src='/brand/gdg-mark-256.png' alt='' className='absolute inset-0 m-auto w-[46%] h-auto' />
      </div>
    </div>
  )
}

const daysUntil = d => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 864e5))
const short = t => (t.length > 26 ? t.slice(0, 25) + '…' : t)

export default function Hero ({ events, team, members }) {
  const next = [...events].filter(e => e.status !== 'past').sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]
  const nextDays = next && next.status === 'upcoming' ? daysUntil(next.startDate) : null

  return (
    <section className='wrap page-top pb-4'>
      <div className='grid grid-cols-1 lg:grid-cols-[1.12fr_1fr] gap-12 lg:gap-6 items-center lg:hero-min pt-4 sm:pt-8'>
        <div className='relative flex flex-col gap-5 sm:gap-6 min-w-0'>
          <div className='ambient' aria-hidden='true' />

          <div className='rise flex flex-wrap items-center gap-3' style={{ '--d': '0s' }}>
            <BraceTag>On Campus</BraceTag>
            <span className='pill'><span className='live-dot' style={{ background: 'var(--green)' }} /> Bengal Institute of Technology</span>
          </div>

          {/* headline + floating glass badges (absolute around the headline on large screens, a tidy row on phones) */}
          <div className='relative rise lg:mb-8' style={{ '--d': '0.04s' }}>
            <h1 className='title-display'>
              Where student developers <RotatingWord />{' '}
              <b>together.</b>
            </h1>
            <div className='badge-cloud mt-5 lg:mt-0' aria-label='Community stats'>
              {/* always rendered (with a placeholder until the numbers arrive) so nothing jumps when data loads */}
              <span className='glass-badge float-badge lg:left-[74%] lg:top-[calc(var(--u)*0.02)]' style={{ '--r': '-6deg', '--d': '0s' }}>
                <Live keep /><b className='font-medium inline-block min-w-[3.2ch] text-center'>{members > 0 ? members.toLocaleString('en-IN') : '—'}</b> members
              </span>
              <span className='glass-badge float-badge lg:left-[51%] lg:top-[calc(var(--u)*2.25)]' style={{ '--r': '3deg', '--d': '-1.7s' }}>
                <b className='font-medium inline-block min-w-[2ch] text-center'>{events.length > 0 ? events.length : '—'}</b> events
              </span>
              <span className='glass-badge float-badge lg:left-[69%] lg:top-[calc(var(--u)*2.6)]' style={{ '--r': '-4deg', '--d': '-3.1s' }}>
                <b className='font-medium inline-block min-w-[1.5ch] text-center'>{team > 0 ? team : '—'}</b> organizers
              </span>
              {nextDays != null && (
                <span className='glass-badge float-badge max-lg:hidden lg:left-[58%] lg:top-[calc(var(--u)*3.25)]' style={{ '--r': '-3deg', '--d': '-2.2s' }}>
                  <Live />Next: {short(next.title)} · {nextDays === 0 ? 'today' : `in ${nextDays}d`}
                </span>
              )}
              <span className='glass-badge float-badge lg:left-[28%] lg:top-[calc(var(--u)*3.1)]' style={{ '--r': '3deg', '--d': '-0.8s' }}>#GDGOnCampus</span>
            </div>
          </div>

          <p className='lead max-w-xl rise' style={{ '--d': '0.18s' }}>
            Workshops, study jams, hackathons and friends who ship things together at GDG on Campus, BIT Kolkata.
          </p>

          <div className='flex flex-wrap items-center gap-3 rise' style={{ '--d': '0.34s' }}>
            <a href={COMMUNITY_URL} target='_blank' rel='noreferrer' className='btn btn-ink btn-beam !min-h-12 !px-7 !text-base'>Join the community</a>
            <Link to='/events' className='btn btn-ghost btn-beam !min-h-12 !px-6 !text-base'>Explore events <Arrow width={26} /></Link>
          </div>

          <div className='rise min-h-[4.5rem] sm:min-h-[4rem]' style={{ '--d': '0.5s' }}>{next && <Countdown event={next} />}</div>
        </div>

        <div className='rise' style={{ '--d': '0.2s' }}><PosterStack /></div>
      </div>
    </section>
  )
}
