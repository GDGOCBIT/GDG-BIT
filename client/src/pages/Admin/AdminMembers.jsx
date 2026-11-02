import { useState } from 'react'
import { toast } from 'sonner'
import useApi from '../../utils/useApi'
import { api, formatDate } from '../../utils/api'

const LINKS = [['website', 'Website'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['twitter', 'X / Twitter'], ['instagram', 'Instagram']]

/** Everyone who signed up. Admins can hide a page from the public Members list or fix its bio and links. */
export default function AdminMembers () {
  const { items, loading, error, reload } = useApi('/admin/members', { auth: true })
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const shown = items.filter(m => !q || `${m.name} ${m.email}`.toLowerCase().includes(q.toLowerCase()))
  const open = m => { setForm({ bio: m.bio, links: { ...m.links }, hiddenByAdmin: m.hiddenByAdmin }); setEditing(m) }
  const save = async e => {
    e.preventDefault()
    setSaving(true)
    const res = await api(`/admin/members/${editing._id}`, { method: 'PUT', body: form, auth: true })
    setSaving(false)
    if (res.success) { toast.success(res.msg); setEditing(null); reload() } else toast.error(res.msg)
  }
  const toggle = async m => {
    const res = await api(`/admin/members/${m._id}`, { method: 'PUT', body: { hiddenByAdmin: !m.hiddenByAdmin }, auth: true })
    if (res.success) { toast.success(m.hiddenByAdmin ? 'Page is visible again' : 'Page hidden'); reload() } else toast.error(res.msg)
  }

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-2'>
        <h2 className='title-2'>Members</h2>
        <input className='field sm:!w-56' placeholder='Search name or email…' value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <p className='text-[var(--muted)] mb-5 max-w-2xl text-sm'>Members choose what to share themselves. Hide a page here if it breaks the community rules, or fix a bio or link for them.</p>
      {loading && <p className='text-[var(--muted)]'>Loading…</p>}
      {error && <p className='text-[var(--red)]'>{error}</p>}
      {!!shown.length && (
        <div className='card overflow-x-auto'>
          <table className='table'>
            <thead><tr><th /><th>Name</th><th>Email</th><th>Joined</th><th>Page</th><th /></tr></thead>
            <tbody>
              {shown.map(m => (
                <tr key={m._id}>
                  <td><img src={m.avatar || '/user.svg'} alt='' className='w-10 h-10 rounded-lg object-cover bg-[var(--sunken)]' /></td>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{formatDate(m.joinedOn)}</td>
                  <td>{m.hiddenByAdmin ? <span className='pill pill-live'>hidden by admin</span> : m.isPrivate ? <span className='pill'>private</span> : <span className='pill pill-upcoming'>public</span>}</td>
                  <td className='whitespace-nowrap text-right'>
                    <button className='btn btn-ghost btn-sm mr-2' onClick={() => open(m)}>Edit</button>
                    <button className='btn btn-ghost btn-sm' onClick={() => toggle(m)}>{m.hiddenByAdmin ? 'Unhide' : 'Hide'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <div role='dialog' aria-modal='true' className='fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4' onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className='card !rounded-b-none sm:!rounded-[var(--radius)] w-full sm:max-w-lg max-h-[92vh] !overflow-y-auto p-5 sm:p-6 flex flex-col gap-4'>
            <h3 className='text-lg font-medium'>Edit {editing.name}</h3>
            <div>
              <label className='label' htmlFor='am-bio'>Bio</label>
              <textarea id='am-bio' className='field' maxLength={240} value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
            {LINKS.map(([k, label]) => (
              <div key={k}>
                <label className='label' htmlFor={`am-${k}`}>{label}</label>
                <input id={`am-${k}`} className='field' value={form.links[k] || ''} onChange={e => setForm({ ...form, links: { ...form.links, [k]: e.target.value } })} />
              </div>
            ))}
            <label className='flex items-center gap-3 cursor-pointer'>
              <input type='checkbox' className='w-5 h-5 accent-[var(--red)]' checked={!!form.hiddenByAdmin} onChange={e => setForm({ ...form, hiddenByAdmin: e.target.checked })} />
              <span>Hide this page from the public Members list</span>
            </label>
            <div className='flex gap-3'>
              <button className='btn btn-ink' disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type='button' className='btn btn-ghost' onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
