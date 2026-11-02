import { useState } from 'react'
import { toast } from 'sonner'
import useApi from '../../utils/useApi'
import { api } from '../../utils/api'

const LINKS = [['website', 'Website'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['twitter', 'X / Twitter'], ['instagram', 'Instagram']]
const TEXT = [['name', 'Name'], ['role', 'Role'], ['team', 'Group']]

/**
 * Edit how any team member / lead is shown on the Team page. Blank fields keep the details from the GDG
 * community page; anything filled in replaces them. Linking an account lets that person edit their own links.
 */
export default function AdminTeam () {
  const { items, loading, error, reload } = useApi('/admin/team?fresh=1', { auth: true })
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')

  const open = m => {
    setForm({ ...Object.fromEntries([...TEXT, ...LINKS].map(([k]) => [k, m.override?.[k] || ''])), userEmail: m.userEmail || '' })
    setEditing(m)
  }

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    const res = await api(`/admin/team/${encodeURIComponent(editing.key)}`, { method: 'PUT', body: form, auth: true })
    setSaving(false)
    if (res.success) { toast.success(res.msg); setEditing(null); reload() } else toast.error(res.msg)
  }

  const reset = async () => {
    if (!window.confirm('Remove all your edits for this person and show the original details again?')) return
    const res = await api(`/admin/team/${encodeURIComponent(editing.key)}`, { method: 'DELETE', auth: true })
    if (res.success) { toast.success(res.msg); setEditing(null); reload() } else toast.error(res.msg)
  }

  const shown = items.filter(m => !q || `${m.name} ${m.role} ${m.userEmail}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-2'>
        <h2 className='title-2'>Team &amp; leads</h2>
        <input className='field sm:!w-56' placeholder='Search…' value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <p className='text-[var(--muted)] mb-5 max-w-2xl text-sm'>
        People come from the GDG community page. Add a website or other links, fix a role, or link a website account so that
        lead can update their own links from their profile.
      </p>
      {loading && <p className='text-[var(--muted)]'>Loading…</p>}
      {error && <p className='text-[var(--red)]'>{error}</p>}
      {!!shown.length && (
        <div className='card overflow-x-auto'>
          <table className='table'>
            <thead><tr><th /><th>Name</th><th>Role</th><th>Links</th><th>Linked account</th><th /></tr></thead>
            <tbody>
              {shown.map(m => (
                <tr key={m.key}>
                  <td><img src={m.image?.url || '/user.svg'} alt='' className='w-10 h-10 rounded-lg object-cover bg-[var(--sunken)]' /></td>
                  <td>{m.name}{Object.keys(m.override || {}).some(k => m.override[k]) && <span className='pill pill-blue ml-2'>edited</span>}</td>
                  <td>{m.role}</td>
                  <td>{LINKS.filter(([k]) => m[k]).map(([, l]) => l).join(', ') || '—'}</td>
                  <td>{m.userEmail || '—'}</td>
                  <td className='text-right'><button className='btn btn-ghost btn-sm' onClick={() => open(m)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div role='dialog' aria-modal='true' className='fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4' onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={e => e.stopPropagation()}
            className='card !rounded-b-none sm:!rounded-[var(--radius)] w-full sm:max-w-lg max-h-[92vh] !overflow-y-auto p-5 sm:p-6 flex flex-col gap-4'>
            <h3 className='text-lg font-medium'>Edit {editing.original?.name}</h3>
            <p className='text-xs text-[var(--muted)] -mt-2'>Leave a field blank to keep the original shown in grey.</p>
            {[...TEXT, ...LINKS].map(([k, label]) => (
              <div key={k}>
                <label className='label' htmlFor={`t-${k}`}>{label}</label>
                <input id={`t-${k}`} className='field' value={form[k] || ''} placeholder={editing.original?.[k] || ''}
                  onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className='label' htmlFor='t-email'>Linked account email</label>
              <input id='t-email' type='email' className='field' value={form.userEmail || ''} placeholder='their sign-in email'
                onChange={e => setForm({ ...form, userEmail: e.target.value })} />
              <p className='text-xs text-[var(--muted)] mt-1'>That account gets a “Team card” tab on its profile to edit these links.</p>
            </div>
            <div className='flex flex-wrap gap-3 justify-between'>
              <div className='flex gap-3'>
                <button className='btn btn-ink' disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button type='button' className='btn btn-ghost' onClick={() => setEditing(null)}>Cancel</button>
              </div>
              <button type='button' className='btn btn-danger btn-sm self-center' onClick={reset}>Reset to original</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
