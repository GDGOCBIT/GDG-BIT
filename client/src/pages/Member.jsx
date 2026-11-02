import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api, formatDate } from '../utils/api'
import useTitle from '../utils/useTitle'
import { sized } from '../utils/images'
import EmptyState from '../components/EmptyState'
import SocialPills from '../components/SocialPills'

const TONES = ['var(--blue-pa)', 'var(--green-pa)', 'var(--yellow-pa)', 'var(--red-pa)']

export default function Member () {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, member: null, error: '' })
  useTitle(state.member?.name)

  useEffect(() => {
    setState({ loading: true, member: null, error: '' })
    api(`/members/${id}`).then(r => setState({ loading: false, member: r.success ? r.member : null, error: r.success ? '' : r.msg }))
  }, [id])

  const share = async () => {
    const url = location.href
    try {
      if (navigator.share) await navigator.share({ title: state.member.name, url })
      else { await navigator.clipboard.writeText(url); toast.success('Link copied!') }
    } catch { /* cancelled */ }
  }

  if (state.loading) return <div className='wrap page-top max-w-3xl'><div className='card h-64 skeleton' /></div>
  if (!state.member) {
    return (
      <div className='wrap page-top max-w-3xl'>
        <EmptyState title='Profile not available' text={state.error || 'This profile is private or does not exist.'} tone='red'>
          <Link to='/members' className='btn btn-ink btn-sm'>All members</Link>
        </EmptyState>
      </div>
    )
  }
  const m = state.member
  return (
    <div className='wrap page-top max-w-3xl'>
      <div className='band band-blue px-6 py-8 sm:px-10 flex flex-col sm:flex-row sm:items-center gap-5'>
        <img src={sized(m.avatar, 400) || '/user.svg'} alt='' className='w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[var(--black)] bg-white' />
        <div className='min-w-0 flex-1'>
          <p className='mono text-sm flex flex-wrap items-center gap-2'>{'{ member }'}{m.lead && <Link to='/team' className='pill pill-yellow'>{m.lead.role}</Link>}</p>
          <h1 className='title-1 break-words'>{m.name}</h1>
          <p className='text-[var(--muted)] mt-1'>Member since {formatDate(m.joinedOn)}</p>
        </div>
        <button className='btn btn-light btn-sm self-start sm:self-center' onClick={share}>Share</button>
      </div>

      {(m.bio || Object.keys(m.links).length > 0) && (
        <div className='card p-5 sm:p-8 mt-6 flex flex-col gap-4'>
          {m.bio && <p className='whitespace-pre-line'>{m.bio}</p>}
          <SocialPills links={m.links} />
        </div>
      )}

      <div className='mt-8'>
        <h2 className='title-2'>Certificates</h2>
        {m.certsHidden ? <p className='text-[var(--muted)] mt-3'>This member keeps their certificates private.</p>
          : !m.certificates.length ? <p className='text-[var(--muted)] mt-3'>No certificates yet.</p>
            : (
              <div className='grid sm:grid-cols-2 gap-4 mt-5'>
                {m.certificates.map((c, i) => (
                  <Link key={c._id} to={`/cert/verify/${c._id}`} className='card lift p-5 flex flex-col gap-2' style={{ background: TONES[i % 4], color: 'var(--black)' }}>
                    <span className='mono text-xs'>{formatDate(c.createdAt)} · verified</span>
                    <span className='text-lg font-medium leading-snug'>{c.title}</span>
                  </Link>
                ))}
              </div>
              )}
      </div>
    </div>
  )
}
