import { useState } from 'react'
import { Link } from 'react-router-dom'
import useApi from '../utils/useApi'
import useTitle from '../utils/useTitle'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import SocialPills from '../components/SocialPills'
import { formatDate } from '../utils/api'
import { sized } from '../utils/images'
import Img from '../components/Img'
import { useAuthStore } from '../store/useAuthStore'

const TONES = ['var(--blue-pa)', 'var(--red-pa)', 'var(--yellow-pa)', 'var(--green-pa)']

export default function Members () {
  useTitle('Members')
  const { items, loading, error } = useApi('/members')
  const { user } = useAuthStore()
  const [q, setQ] = useState('')
  const shown = items.filter(m => !q || `${m.name} ${m.bio}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <PageHeader tag='Members' title={<>The people who <b>build with us</b></>}
        text='Members of the community who signed up on this site. Everyone can switch their page off from their profile.' tone='blue' dot='var(--blue)' />
      <section className='wrap pt-10'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8'>
          <input className='field sm:!w-72' type='search' placeholder='Search members…' aria-label='Search members' value={q} onChange={e => setQ(e.target.value)} />
          <div className='flex items-center gap-3'>
            {!loading && <span className='pill'>{shown.length} {shown.length === 1 ? 'member' : 'members'}</span>}
            <Link to={user ? '/profile' : '/auth'} className='btn btn-ghost btn-sm'>{user ? 'Edit my page' : 'Join & get a page'}</Link>
          </div>
        </div>
        {loading && (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className='card h-64 skeleton' />)}
          </div>
        )}
        {error && <EmptyState title='Could not load members' text={error} tone='red' />}
        {!loading && !error && !shown.length && <EmptyState title={q ? 'No one matches that' : 'No members yet'} text={q ? 'Try a different name.' : 'Be the first: create an account and your page appears here.'} tone='blue' />}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5'>
          {shown.map((m, i) => (
            <article key={m._id} className='card lift flex flex-col relative'>
              <Link to={`/members/${m._id}`} className='absolute inset-0 z-10' aria-label={`Open ${m.name}`} />
              <div className='aspect-square border-b-2 border-[var(--outline)]' style={{ background: TONES[i % 4] }}>
                <Img src={sized(m.avatar, 480) || '/user.svg'} srcSet={m.avatar ? `${sized(m.avatar, 240)} 240w, ${sized(m.avatar, 480)} 480w` : undefined} sizes='(min-width: 1024px) 240px, 45vw' alt='' loading='lazy' decoding='async' width='300' height='300' className='w-full h-full object-cover' />
              </div>
              <div className='p-4 flex flex-col gap-2 flex-1'>
                <p className='font-medium leading-snug'>{m.name}</p>
                {m.bio ? <p className='text-sm text-[var(--muted)] line-clamp-2'>{m.bio}</p> : <p className='mono text-xs text-[var(--muted)]'>Member since {formatDate(m.joinedOn)}</p>}
                <div className='flex flex-wrap items-center gap-1.5 mt-auto pt-2 relative z-20'>
                  {m.certificates > 0 && <span className='pill pill-upcoming'>{m.certificates} {m.certificates === 1 ? 'certificate' : 'certificates'}</span>}
                  <SocialPills links={m.links} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
