import { useState } from 'react'
import { toast } from 'sonner'
import useApi from '../../utils/useApi'
import { api } from '../../utils/api'

const toInputDate = d => {
  if (!d) return ''
  const dt = new Date(d)
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())
  return dt.toISOString().slice(0, 16)
}

const blank = fields =>
  Object.fromEntries(fields.map(f => [f.name, f.type === 'checkbox' ? false : '']))

/**
 * Generic list + create/edit/delete screen for an admin resource.
 * config: { title, path, fields[{name,label,type,required}], columns[fn(item)], image, idField }
 */
export default function ResourceManager ({ config, extra }) {
  const { title, path, fields, columns, image, idField, search } = config
  const [q, setQ] = useState('')
  const listPath = search && q ? `/admin/${path}?q=${encodeURIComponent(q)}` : `/admin/${path}`
  const { items, loading, error, reload } = useApi(listPath, { auth: true })
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [form, setForm] = useState({})
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const open = item => {
    setFile(null)
    if (item === 'new') setForm(blank(fields))
    else {
      const f = {}
      fields.forEach(fd => {
        const v = item[fd.name]
        f[fd.name] =
          fd.type === 'datetime-local' ? toInputDate(v)
          : fd.type === 'tags' ? (v || []).join(', ')
          : v ?? (fd.type === 'checkbox' ? false : '')
      })
      if (idField) f[idField] = item[idField]
      setForm(f)
    }
    setEditing(item)
  }

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    const isNew = editing === 'new'
    const id = isNew ? '' : `/${editing[idField || '_id']}`
    let body
    if (image) {
      body = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== undefined) body.append(k, v)
      })
      if (file) body.append('file', file)
    } else body = { ...form }
    // tags: "a, b" -> repeated field (multer) or array (json)
    fields.filter(f => f.type === 'tags').forEach(f => {
      const list = String(form[f.name] || '').split(',').map(s => s.trim()).filter(Boolean)
      if (body instanceof FormData) {
        body.delete(f.name)
        list.forEach(t => body.append(f.name, t))
      } else body[f.name] = list
    })
    const res = await api(`/admin/${path}${id}`, { method: isNew ? 'POST' : 'PUT', body, auth: true })
    setSaving(false)
    if (res.success) {
      toast.success(res.msg)
      setEditing(null)
      reload()
    } else toast.error(res.msg)
  }

  const remove = async item => {
    if (!window.confirm('Delete this item permanently?')) return
    const res = await api(`/admin/${path}/${item[idField || '_id']}`, { method: 'DELETE', auth: true })
    if (res.success) {
      toast.success(res.msg)
      reload()
    } else toast.error(res.msg)
  }

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <h2 className='title-2'>{title}</h2>
        <div className='flex gap-2 flex-wrap w-full sm:w-auto'>
          {search && (
            <input className='field sm:!w-56' placeholder='Search…' value={q} onChange={e => setQ(e.target.value)} />
          )}
          <button className='btn btn-ink btn-sm' onClick={() => open('new')}>+ Add new</button>
        </div>
      </div>

      {extra}

      {loading && <p className='text-[var(--muted)]'>Loading…</p>}
      {error && <p className='text-[var(--red)]'>{error}</p>}
      {!loading && !error && !items.length && (
        <div className='card-soft p-8 text-center text-[var(--muted)]'>Nothing here yet.</div>
      )}

      {!!items.length && (
        <div className='card overflow-x-auto'>
          <table className='table'>
            <thead>
              <tr>
                {columns.map(c => <th key={c.label} >{c.label}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  {columns.map(c => <td key={c.label} >{c.render(item)}</td>)}
                  <td className='whitespace-nowrap text-right'>
                    <button className='btn btn-ghost btn-sm mr-2' onClick={() => open(item)}>Edit</button>
                    <button className='btn btn-danger btn-sm' onClick={() => remove(item)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div role='dialog' aria-modal='true' className='fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4' onClick={() => setEditing(null)}>
          <form
            onSubmit={submit}
            onClick={e => e.stopPropagation()}
            className='card !rounded-b-none sm:!rounded-[var(--radius)] w-full sm:max-w-lg max-h-[92vh] !overflow-y-auto p-5 sm:p-6 flex flex-col gap-4'
          >
            <h3 className='text-lg font-medium'>{editing === 'new' ? 'Add' : 'Edit'} {title.toLowerCase()}</h3>
            {idField && (
              <div>
                <label className='label'>ID</label>
                <input
                  className='field'
                  value={form[idField] || ''}
                  disabled={editing !== 'new'}
                  required
                  onChange={e => setForm({ ...form, [idField]: e.target.value })}
                />
              </div>
            )}
            {fields.map(f => (
              <div key={f.name}>
                {f.type === 'checkbox' ? (
                  <label className='flex items-center gap-2'>
                    <input type='checkbox' checked={!!form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.checked })} />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <label className='label'>{f.label}{f.required && ' *'}</label>
                    {f.type === 'textarea' ? (
                      <textarea className='field' rows={4} required={f.required} value={form[f.name] || ''} onChange={e => setForm({ ...form, [f.name]: e.target.value })} />
                    ) : (
                      <input
                        className='field'
                        type={f.type === 'tags' ? 'text' : f.type || 'text'}
                        placeholder={f.type === 'tags' ? 'comma, separated' : ''}
                        required={f.required}
                        value={form[f.name] ?? ''}
                        onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
            {image && (
              <div>
                <label className='label'>Image</label>
                <input type='file' accept='image/*' onChange={e => setFile(e.target.files[0] || null)} />
              </div>
            )}
            <div className='flex justify-end gap-2 pt-2'>
              <button type='button' className='btn btn-ghost' onClick={() => setEditing(null)}>Cancel</button>
              <button className='btn btn-ink' disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
