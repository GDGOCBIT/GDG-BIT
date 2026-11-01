import { Link } from 'react-router-dom'
import { navData } from '../utils/navbar'
import useSettings from '../utils/useSettings'
import { COMMUNITY_URL, CHAPTER, Arrow } from './Brand'

export default function Footer () {
  const { socials } = useSettings()
  return (
    <footer className='mt-20 bg-[var(--black)] text-[var(--offwhite)]'>
      <div className='wrap py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]'>
        <div className='flex flex-col gap-4'>
          <img src='/brand/gdg-horizontal-dark.png' alt='Google Developer Groups on Campus, Bengal Institute of Technology' width='1684' height='213' loading='lazy' className='h-11 w-auto self-start' />
          <p className='text-sm text-[#b5b5b5] max-w-sm'>
            A student-led community at BIT Kolkata for learning Google technologies, building
            together and growing as developers.
          </p>
          <a href={COMMUNITY_URL} target='_blank' rel='noreferrer'
            className='btn btn-sm self-start bg-[var(--offwhite)] text-[var(--black)] border-[var(--offwhite)]'>
            Join our community <Arrow width={28} />
          </a>
        </div>
        <div>
          <p className='mono text-xs text-[#b5b5b5] mb-3'>Explore</p>
          <ul className='flex flex-col gap-2'>
            {[{ id: 'h', name: 'Home', link: '/' }, ...navData].map(n => (
              <li key={n.id}><Link to={n.link} className='hover:underline underline-offset-4'>{n.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className='mono text-xs text-[#b5b5b5] mb-3'>Follow</p>
          <ul className='flex flex-col gap-2'>
            {socials.filter(s => s.key !== 'community').map(s => (
              <li key={s.key}>
                <a href={s.url} target='_blank' rel='noreferrer' className='hover:underline underline-offset-4'>{s.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className='wrap pb-8 flex flex-col sm:flex-row gap-3 justify-between text-xs text-[#9a9a9a] mono'>
        <span>#GDGOnCampus</span>
        <span>© {new Date().getFullYear()} GDG on Campus {CHAPTER}</span>
      </div>
      <div className='flex h-2'>
        <div className='flex-1' style={{ background: 'var(--blue)' }} />
        <div className='flex-1' style={{ background: 'var(--red)' }} />
        <div className='flex-1' style={{ background: 'var(--yellow)' }} />
        <div className='flex-1' style={{ background: 'var(--green)' }} />
      </div>
    </footer>
  )
}
