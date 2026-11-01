/* Brand building blocks taken from the GDG On Campus brand guide. */
import { Link } from 'react-router-dom'

export const CHAPTER = 'Bengal Institute of Technology'
export const COMMUNITY_URL =
  'https://gdg.community.dev/gdg-on-campus-bengal-institute-of-technology-kolkata-india/'

/** Official horizontal logo (theme aware). On phones only the mark is shown unless `full`. */
export function Logo ({ compact = false, className = '' }) {
  return (
    <Link to='/' className={`flex items-center shrink-0 ${className}`} aria-label='Google Developer Groups on Campus, Bengal Institute of Technology. Home'>
      <img src='/brand/gdg-mark-256.png' alt='' className={`h-9 w-auto ${compact ? 'sm:hidden' : 'hidden'}`} />
      <span className={compact ? 'max-sm:hidden' : ''}>
        <img src='/brand/gdg-horizontal-light.png' alt='' className='logo-light h-9 w-auto' />
        <img src='/brand/gdg-horizontal-dark.png' alt='' className='logo-dark h-9 w-auto' />
      </span>
    </Link>
  )
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Globe = ({ size = 72, className = '' }) => (
  <svg width={size} height={size} viewBox='0 0 72 72' className={`doodle ${className}`} aria-hidden='true'>
    <g {...stroke}>
      <circle cx='36' cy='36' r='33' />
      <ellipse cx='36' cy='36' rx='14' ry='33' />
      <path d='M3 36h66M8 19h56M8 53h56' />
    </g>
  </svg>
)

/** Three filled circles with ink outline. */
export const Dots = ({ color = 'var(--red)', size = 30, className = '' }) => (
  <svg width={size * 3.3} height={size} viewBox='0 0 99 30' className={`doodle ${className}`} aria-hidden='true'>
    {[15, 49.5, 84].map(cx => (
      <circle key={cx} cx={cx} cy='15' r='13.5' fill={color} stroke='currentColor' strokeWidth='2' />
    ))}
  </svg>
)

export const Arrow = ({ width = 64, flip = false, className = '' }) => (
  <svg width={width} height='22' viewBox='0 0 64 22' className={`doodle ${className}`}
    style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden='true'>
    <g {...stroke}><path d='M2 11h58M50 2l10 9-10 9' /></g>
  </svg>
)

export const Slashes = ({ color = 'var(--yellow-pa)', size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox='0 0 64 64' className={`doodle ${className}`} aria-hidden='true'>
    <g fill={color} stroke='currentColor' strokeWidth='2' strokeLinejoin='round'>
      <path d='M20 4h14L16 60H2z' />
      <path d='M46 4h14L42 60H28z' />
    </g>
  </svg>
)

export const Waves = ({ width = 120, className = '' }) => (
  <svg width={width} height='30' viewBox='0 0 120 30' className={`doodle ${className}`} aria-hidden='true'>
    <path {...stroke} d='M2 4c0 14 12 24 19 24S40 18 40 4c0 14 12 24 19 24S78 18 78 4c0 14 12 24 19 24s19-10 19-24' />
  </svg>
)

export const Spark = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox='0 0 40 40' className={`doodle ${className}`} aria-hidden='true'>
    <path {...stroke} d='M20 2v36M2 20h36M7 7l26 26M33 7L7 33' />
  </svg>
)

/** "{ On Campus }" tag from the brand guide, in the mono typeface. */
export const BraceTag = ({ children = 'On Campus', className = '' }) => (
  <span className={`mono inline-flex items-center gap-2 text-sm ${className}`}>
    <span className='text-2xl leading-none font-light'>{'{'}</span>
    {children}
    <span className='text-2xl leading-none font-light'>{'}'}</span>
  </span>
)

/** Photo in the brand's notched rounded frame. Fixed 4:3 so the corners stay round. */
export const NotchedPhoto = ({ src, alt = '', className = '' }) => (
  <svg viewBox='0 0 400 300' className={`w-full h-auto ${className}`} role='img' aria-label={alt}>
    <defs>
      <clipPath id='notch'>
        <path d='M144 0H376A24 24 0 0 1 400 24V276A24 24 0 0 1 376 300H24A24 24 0 0 1 0 276V84A24 24 0 0 1 24 60H96A24 24 0 0 0 120 36V24A24 24 0 0 1 144 0Z' />
      </clipPath>
    </defs>
    <image href={src} width='400' height='300' preserveAspectRatio='xMidYMid slice' clipPath='url(#notch)' />
    <path d='M144 1H376A23 23 0 0 1 399 24V276A23 23 0 0 1 376 299H24A23 23 0 0 1 1 276V84A23 23 0 0 1 24 61H96A24 24 0 0 0 120 37V24A23 23 0 0 1 144 1Z'
      fill='none' stroke='var(--outline)' strokeWidth='3' />
  </svg>
)
