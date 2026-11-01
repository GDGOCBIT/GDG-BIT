import { Link } from 'react-router-dom'
import { Dots, Globe } from '../components/Brand'

export default function NotFound () {
  return (
    <section className='wrap page-top'>
      <div className='band band-yellow relative overflow-hidden px-6 py-16 sm:p-20 flex flex-col items-start gap-5'>
        <p className='mono'>{'{ 404 }'}</p>
        <h1 className='title-display'>Page not <b>found</b></h1>
        <p className='text-[var(--muted)] max-w-md'>The page you are looking for moved or never existed.</p>
        <Dots color='var(--yellow)' size={24} />
        <Link to='/' className='btn btn-ink'>Back to home</Link>
        <Globe size={200} className='absolute -right-10 -bottom-10 max-sm:hidden' />
      </div>
    </section>
  )
}
