import { useState } from 'react'
import { Link } from 'react-router-dom'
import useApi from '../utils/useApi'
import useTitle from '../utils/useTitle'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
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
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'>
          {shown.map((m, i) => (
            <article key={m._id} className='card lift relative p-4 flex flex-col items-center text-center gap-2'>
              <Link to={`/members/${m._id}`} className='absolute inset-0 z-10' aria-label={`Open ${m.name}`} />
              <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[var(--outline)] shrink-0' style={{ background: TONES[i % 4] }}>
                <Img src={sized(m.avatar, 192) || '/user.svg'}
                  srcSet={m.avatar ? `${sized(m.avatar, 96)} 96w, ${sized(m.avatar, 192)} 192w, ${sized(m.avatar, 288)} 288w` : undefined}
                  sizes='96px' fallbacks={[m.avatar, '/user.svg'].filter(Boolean)} alt='' loading='lazy' width='96' height='96' className='w-full h-full object-cover' />
              </div>
              <p className='font-medium leading-snug break-words w-full'>{m.name}</p>
              {m.lead && <span className='pill pill-yellow max-w-full' title={m.lead.role}><span className='truncate'>{m.lead.role}</span></span>}
              {m.bio
                ? <p className='text-xs text-[var(--muted)] line-clamp-2'>{m.bio}</p>
                : <p className='mono text-[0.7rem] text-[var(--muted)]'>Since {formatDate(m.joinedOn)}</p>}
              {m.certificates > 0 && (
                <span className='pill pill-upcoming mt-auto'>{m.certificates} {m.certificates === 1 ? 'certificate' : 'certificates'}</span>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
