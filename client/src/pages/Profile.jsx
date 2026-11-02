import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '../store/useAuthStore'
import { api, decrypt, formatDate } from '../utils/api'

const LINKS = [['website', 'Website'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['twitter', 'X / Twitter'], ['instagram', 'Instagram']]

/** Certificates issued to this account's email. */
function MyCertificates () {
  const [state, setState] = useState({ loading: true, items: [], error: '' })
  useEffect(() => {
    api('/my/certificates', { auth: true }).then(r => setState({ loading: false, items: r.items || [], error: r.success ? '' : r.msg }))
  }, [])
  const copy = async id => {
    try { await navigator.clipboard.writeText(`${location.origin}/cert/verify/${id}`); toast.success('Link copied!') } catch { toast.error('Could not copy the link') }
  }
  if (state.loading) return <div className='card h-40 skeleton mt-6' />
  if (state.error) return <p className='mt-6 text-[var(--red)]'>{state.error}</p>
  if (!state.items.length) {
    return (
      <div className='card-soft p-8 mt-6 text-center'>
        <p className='font-medium'>No certificates yet</p>
        <p className='text-sm text-[var(--muted)] mt-1'>Certificates are matched to the email you signed in with. They show up here after you complete a study jam or event.</p>
      </div>
    )
  }
  return (
    <div className='grid sm:grid-cols-2 gap-4 mt-6'>
      {state.items.map((c, i) => (
        <article key={c._id} className='card lift p-5 flex flex-col gap-3' style={{ background: ['var(--blue-pa)', 'var(--green-pa)', 'var(--yellow-pa)', 'var(--red-pa)'][i % 4], color: 'var(--black)' }}>
          <p className='mono text-xs'>{formatDate(c.createdAt)}</p>
          <h3 className='text-lg font-medium leading-snug'>{c.title}</h3>
          {c.appreciation && <p className='text-sm line-clamp-2'>{c.appreciation}</p>}
          <p className='mono text-xs break-all'>ID · {c._id}</p>
          <div className='flex flex-wrap gap-2 mt-auto pt-1'>
            <Link to={`/cert/verify/${c._id}`} className='btn btn-ink btn-sm'>View certificate</Link>
            <button className='btn btn-light btn-sm' onClick={() => copy(c._id)}>Copy link</button>
          </div>
        </article>
      ))}
    </div>
  )
}

/** The member's public page: bio, links, and the privacy switches. */
function PublicPage ({ userId }) {
  const [p, setP] = useState(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { api('/my/public-profile', { auth: true }).then(r => r.success && setP(r.profile)) }, [])
  if (!p) return <div className='card h-40 skeleton mt-6' />
  const save = async e => {
    e.preventDefault()
    setSaving(true)
    const res = await api('/my/public-profile', { method: 'PUT', body: { bio: p.bio, links: p.links, isPrivate: p.isPrivate, showCerts: p.showCerts }, auth: true })
    setSaving(false)
    if (res.success) { setP(res.profile); toast.success(res.msg) } else toast.error(res.msg)
  }
  const Toggle = ({ checked, onChange, title, text }) => (
    <label className='flex items-start gap-3 cursor-pointer'>
      <input type='checkbox' className='mt-1 w-5 h-5 accent-[var(--blue)]' checked={checked} onChange={e => onChange(e.target.checked)} />
      <span><span className='font-medium block'>{title}</span><span className='text-sm text-[var(--muted)]'>{text}</span></span>
    </label>
  )
  return (
    <form onSubmit={save} className='card p-5 sm:p-8 mt-6 flex flex-col gap-5'>
      <div>
        <h2 className='text-xl font-medium'>Your public page</h2>
        <p className='text-sm text-[var(--muted)] mt-1'>Shown on the Members page with your name and photo. Your email is never shown.</p>
      </div>
      {p.hiddenByAdmin && <p className='pill pill-live self-start'>An admin has hidden your page</p>}
      <Toggle checked={!p.isPrivate} onChange={v => setP({ ...p, isPrivate: !v })} title='List me on the Members page' text='Turn this off to make your page private. It disappears within seconds.' />
      <Toggle checked={p.showCerts} onChange={v => setP({ ...p, showCerts: v })} title='Show my certificates' text='Lets visitors see (and verify) the certificates issued to you.' />
      <div>
        <label className='label' htmlFor='bio'>Bio <span className='text-[var(--muted)] font-normal'>({(p.bio || '').length}/240)</span></label>
        <textarea id='bio' className='field' maxLength={240} value={p.bio} placeholder='What are you building or learning?' onChange={e => setP({ ...p, bio: e.target.value })} />
      </div>
      <div className='grid sm:grid-cols-2 gap-4'>
        {LINKS.map(([k, label]) => (
          <div key={k}>
            <label className='label' htmlFor={`pp-${k}`}>{label}</label>
            <input id={`pp-${k}`} className='field' value={p.links[k] || ''} onChange={e => setP({ ...p, links: { ...p.links, [k]: e.target.value } })} />
          </div>
        ))}
      </div>
      <div className='flex flex-wrap gap-3'>
        <button className='btn btn-ink' disabled={saving}>{saving ? 'Saving…' : 'Save page'}</button>
        {!p.isPrivate && !p.hiddenByAdmin && <Link to={`/members/${userId}`} className='btn btn-ghost'>View my page</Link>}
      </div>
    </form>
  )
}

/** Lets a lead (an account an admin linked to a team card) edit their own links. */
function TeamCard () {
  const [card, setCard] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    api('/my/team-card', { auth: true }).then(r => {
      setCard(r.linked ? r.member : false)
      if (r.linked) setForm(Object.fromEntries(LINKS.map(([k]) => [k, r.member[k] || ''])))
    })
  }, [])
  if (card === null) return <div className='card h-40 skeleton mt-6' />
  const save = async e => {
    e.preventDefault()
    setSaving(true)
    const res = await api('/my/team-card', { method: 'PUT', body: form, auth: true })
    setSaving(false)
    if (res.success) toast.success(res.msg + ' The Team page refreshes within a minute.'); else toast.error(res.msg)
  }
  return (
    <form onSubmit={save} className='card p-5 sm:p-8 mt-6 flex flex-col gap-5'>
      <div>
        <h2 className='text-xl font-medium'>Your team card</h2>
        <p className='text-sm text-[var(--muted)] mt-1'>These links appear under your name on the Team page. Leave one blank to fall back to the default.</p>
      </div>
      <div className='flex items-center gap-4'>
        <img src={card.image?.url || '/user.svg'} alt='' className='w-14 h-14 rounded-full object-cover border-2 border-[var(--outline)] bg-[var(--sunken)]' />
        <div><p className='font-medium'>{card.name}</p><p className='mono text-xs text-[var(--muted)]'>{card.role}</p></div>
      </div>
      <div className='grid sm:grid-cols-2 gap-4'>
        {LINKS.map(([k, label]) => (
          <div key={k}>
            <label className='label' htmlFor={`tc-${k}`}>{label}</label>
            <input id={`tc-${k}`} className='field' value={form[k] || ''} placeholder={k === 'website' ? 'https://yoursite.dev' : ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <div><button className='btn btn-ink' disabled={saving}>{saving ? 'Saving…' : 'Save links'}</button></div>
    </form>
  )
}

export default function Profile () {
  const { user, setUser, verifyLoading } = useAuthStore()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('profile')
  const [isLead, setIsLead] = useState(false)

  useEffect(() => {
    if (!verifyLoading && !user && !localStorage.getItem('login_token')) navigate('/auth')
  }, [verifyLoading, user, navigate])

  useEffect(() => {
    if (user) api('/my/team-card', { auth: true }).then(r => setIsLead(!!r.linked))
  }, [user?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
    }
  }, [user])

  if (!user)
    return <div className='wrap page-top max-w-3xl'><div className='card h-64 skeleton' /></div>

  const preview = file ? URL.createObjectURL(file) : user.avatar?.url || '/user.svg'

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    const form = new FormData()
    form.append('firstName', firstName)
    form.append('lastName', lastName)
    if (file) form.append('file', file)
    const res = await api('/profile', { method: 'PUT', body: form, auth: true })
    setSaving(false)
    if (res.success) {
      setUser((await decrypt(res.data)).user)
      setFile(null)
      toast.success(res.msg)
    } else toast.error(res.msg)
  }

  return (
    <div className='wrap page-top max-w-3xl'>
      <div className='band band-green px-6 py-8 sm:px-10 flex flex-col sm:flex-row sm:items-center gap-5'>
        <img src={preview} alt='' className='w-24 h-24 rounded-full object-cover border-2 border-[var(--black)] bg-white' />
        <div className='min-w-0'>
          <p className='mono text-sm'>{'{ member }'}</p>
          <h1 className='title-1 break-words'>{user.firstName} <b>{user.lastName}</b></h1>
          <p className='text-[var(--muted)] mt-1'>Member since {formatDate(user.joinedOn)}{user.isAdmin ? ' · Admin' : ''}</p>
        </div>
      </div>

      <div role='tablist' aria-label='Profile sections' className='tabs mt-6'>
        {[['profile', 'Profile'], ['page', 'Public page'], ['certs', 'Certificates'], ...(isLead ? [['card', 'Team card']] : [])].map(([k, label]) => (
          <button key={k} role='tab' aria-selected={tab === k} onClick={() => setTab(k)} className='tab'>{label}</button>
        ))}
      </div>

      {tab === 'page' && <PublicPage userId={user._id} />}
      {tab === 'certs' && <MyCertificates />}
      {tab === 'card' && isLead && <TeamCard />}
      {tab === 'profile' && <form onSubmit={save} className='card p-5 sm:p-8 mt-6 flex flex-col gap-5'>
        <h2 className='text-xl font-medium'>Edit profile</h2>
        <div className='flex items-center gap-4'>
          <img src={preview} alt='avatar' className='w-16 h-16 rounded-full object-cover border-2 border-[var(--outline)] bg-[var(--sunken)]' />
          <label className='btn btn-ghost btn-sm cursor-pointer'>
            Change photo
            <input type='file' accept='image/*' hidden onChange={e => setFile(e.target.files[0] || null)} />
          </label>
        </div>
        <div className='grid sm:grid-cols-2 gap-4'>
          <div>
            <label className='label' htmlFor='fn'>First name</label>
            <input id='fn' className='field' value={firstName} onChange={e => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label className='label' htmlFor='ln'>Last name</label>
            <input id='ln' className='field' value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>
        <div>
          <label className='label'>Email</label>
          <input className='field opacity-70' value={user.email || ''} disabled />
        </div>
        <div className='flex flex-wrap gap-3'>
          <button className='btn btn-ink' disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          {user.isAdmin && <Link to='/admin' className='btn btn-ghost'>Admin dashboard</Link>}
        </div>
      </form>}
    </div>
  )
}
