import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '../store/useAuthStore'
import { api, decrypt, formatDate } from '../utils/api'

export default function Profile () {
  const { user, setUser, verifyLoading } = useAuthStore()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!verifyLoading && !user && !localStorage.getItem('login_token')) navigate('/auth')
  }, [verifyLoading, user, navigate])

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

      <form onSubmit={save} className='card p-5 sm:p-8 mt-6 flex flex-col gap-5'>
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
      </form>
    </div>
  )
}
