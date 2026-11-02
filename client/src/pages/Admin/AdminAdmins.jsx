import { useState } from 'react'
import { toast } from 'sonner'
import useApi from '../../utils/useApi'
import { api } from '../../utils/api'
import EmptyState from '../../components/EmptyState'

const BADGE = {
  owner: ['Owner', 'pill-blue'],
  granted: ['Admin', 'pill-upcoming'],
  invited: ['Invited', 'pill-yellow']
}

export default function AdminAdmins () {
  const { items, loading, error, reload } = useApi('/admin/admins', { auth: true })
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async e => {
    e.preventDefault()
    setBusy(true)
    const res = await api('/admin/admins', { method: 'POST', auth: true, body: { email } })
    setBusy(false)
    if (res.success) { toast.success(res.msg, { duration: 7000 }); setEmail(''); reload() } else toast.error(res.msg)
  }

  const remove = async a => {
    if (!window.confirm(`Remove admin access for ${a.email}?`)) return
    const res = await api(`/admin/admins/${encodeURIComponent(a.email)}`, { method: 'DELETE', auth: true })
    if (res.success) { toast.success(res.msg); reload() } else toast.error(res.msg)
  }

  return (
    <div className='flex flex-col gap-8'>
      <div>
        <h2 className='title-2 mb-1'>Admins</h2>
        <p className='text-[var(--muted)] max-w-2xl'>Admins can issue certificates, manage the gallery, projects, social links and other admins. Use the email the person signs in with.</p>
      </div>

      <form onSubmit={add} className='card p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-end'>
        <div className='flex-1'>
          <label className='label' htmlFor='new-admin'>Add an admin</label>
          <input id='new-admin' type='email' required className='field' placeholder='name@example.com' value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <button className='btn btn-ink' disabled={busy || !email}>{busy ? 'Adding…' : 'Make admin'}</button>
      </form>
      <p className='text-xs text-[var(--muted)] -mt-5'>If they haven't signed up yet they show as <b>Invited</b> and become an admin the moment they register with that email.</p>

      {loading && <div className='card h-40 skeleton' />}
      {error && <p className='text-[var(--red)]'>{error}</p>}
      {!loading && !error && !items.length && <EmptyState title='No admins yet' />}

      <ul className='grid md:grid-cols-2 gap-4'>
        {items.map(a => {
          const [label, tone] = BADGE[a.source]
          return (
            <li key={a.email} className='card p-4 flex items-center gap-4'>
              <img src={a.avatar || '/user.svg'} alt='' className='w-12 h-12 rounded-full object-cover border-2 border-[var(--outline)] bg-[var(--sunken)] shrink-0' />
              <div className='min-w-0 flex-1'>
                <p className='font-medium truncate'>{a.name || a.email}{a.you && <span className='text-[var(--muted)] font-normal'> (you)</span>}</p>
                {a.name && <p className='text-sm text-[var(--muted)] truncate'>{a.email}</p>}
                <span className={`pill ${tone} mt-1.5`}>{label}</span>
              </div>
              {a.locked ? (
                <span className='text-xs text-[var(--muted)] max-w-[8rem] text-right'>Permanent owner</span>
              ) : a.you ? null : (
                <button className='btn btn-danger btn-sm shrink-0' onClick={() => remove(a)}>Remove</button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
