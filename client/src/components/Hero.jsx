import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Arrow, BraceTag, COMMUNITY_URL, Dots, Globe, Slashes, Spark } from './Brand'
import { formatDate } from '../utils/api'
import useGallery from '../utils/useGallery'

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
      <div aria-hidden='true' className='absolute inset-[6%] rounded-full opacity-60 blur-3xl'
        style={{ background: 'conic-gradient(from 90deg, var(--blue-ht), var(--green-ht), var(--yellow-ht), var(--red-ht), var(--blue-ht))' }} />
      <svg aria-hidden='true' className='absolute inset-0 w-full h-full spin-slower doodle opacity-40' viewBox='0 0 100 100'>
        <circle cx='50' cy='50' r='48' fill='none' stroke='currentColor' strokeWidth='0.4' strokeDasharray='1.5 2.5' />
      </svg>

      {SLOTS.map((s, i) => {
        const p = posters[i]
        const style = { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, '--rot': `${s.rot}deg`, '--depth': s.depth, zIndex: s.z }
        const inner = p
          ? <img src={p.thumb} alt={p.title} className='w-full h-full object-cover' loading={i < 2 ? 'eager' : 'lazy'} draggable={false} />
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

      {/* floating extras */}
      <Globe size={92} className='absolute -top-3 right-0 float-y text-[var(--outline)]' />
      <Dots color='var(--red)' size={20} className='absolute bottom-[2%] right-[4%] float-r' />
      <Spark size={34} className='absolute top-[42%] -right-1 spin-slow' />
      <Slashes size={56} color='var(--yellow-ht)' className='absolute top-[40%] -left-3 float-r' />
      <span className='pill pill-blue absolute top-[3%] left-[2%] -rotate-6 float-y z-10' style={{ '--d': '-2s' }}>Study Jams</span>
      <span className='pill pill-yellow absolute bottom-[10%] right-[18%] rotate-3 float-r z-10' style={{ '--d': '-1s' }}>Hackathons</span>

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

export default function Hero ({ events, team, members }) {
  const next = [...events].filter(e => e.status !== 'past').sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]

  return (
    <section className='wrap page-top pb-4'>
      <div className='grid lg:grid-cols-[1.12fr_1fr] gap-12 lg:gap-6 items-center lg:min-h-[calc(100svh-9rem)] pt-4 sm:pt-8'>
        <div className='flex flex-col gap-6 sm:gap-7'>
          <div className='rise flex flex-wrap items-center gap-3' style={{ '--d': '0s' }}>
            <BraceTag>On Campus</BraceTag>
            <span className='pill'><span className='live-dot' style={{ background: 'var(--green)' }} /> Bengal Institute of Technology</span>
          </div>

          <h1 className='title-display rise' style={{ '--d': '0.08s' }}>
            Where student developers <RotatingWord />{' '}
            <b>together.</b>
          </h1>

          <p className='lead max-w-xl rise' style={{ '--d': '0.18s' }}>
            Workshops, study jams, hackathons and friends who ship things together. Join Google Developer Groups on Campus at BIT Kolkata and turn curiosity into projects.
          </p>

          <div className='flex flex-wrap items-center gap-3 rise' style={{ '--d': '0.28s' }}>
            <a href={COMMUNITY_URL} target='_blank' rel='noreferrer' className='btn btn-ink !min-h-12 !px-7 !text-base'>Join the community</a>
            <Link to='/events' className='btn btn-ghost !min-h-12 !px-6 !text-base'>Explore events <Arrow width={26} /></Link>
          </div>

          <div className='flex flex-wrap gap-2 rise' style={{ '--d': '0.36s' }}>
            {[[events.length, 'events', 'pill-blue'], [members ? members.toLocaleString('en-IN') : 0, 'members', 'pill-upcoming'], [team, 'organizers', 'pill-yellow']].filter(x => x[0]).map(([n, l, c]) => (
              <span key={l} className={`pill ${c}`}><b className='font-medium'>{n}</b> {l}</span>
            ))}
            <span className='pill'>#GDGOnCampus</span>
          </div>

          {next && <div className='rise' style={{ '--d': '0.46s' }}><Countdown event={next} /></div>}
        </div>

        <div className='rise' style={{ '--d': '0.2s' }}><PosterStack /></div>
      </div>
    </section>
  )
}
