import { useState } from 'react'
import { toast } from 'sonner'
import useApi from '../../utils/useApi'
import { api, formatDate } from '../../utils/api'
import { canvasToBlob, renderCertificate, safeName, saveBlob } from '../../utils/certRender'
import EmptyState from '../../components/EmptyState'
import CertGenerator from './CertGenerator'
import TemplateEditor from './TemplateEditor'

const VIEWS = [['generate', 'Generate'], ['templates', 'Templates'], ['issued', 'Issued']]

function Templates ({ templates, loading, reload }) {
  const [editing, setEditing] = useState(null) // null | 'new' | template
  if (editing)
    return <TemplateEditor template={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />

  const remove = async t => {
    if (!window.confirm(`Delete template “${t.name}”?`)) return
    const res = await api(`/admin/cert-templates/${t._id}`, { method: 'DELETE', auth: true })
    if (res.success) { toast.success(res.msg); reload() } else toast.error(res.msg)
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='title-2'>Templates</h2>
        <button className='btn btn-ink btn-sm' onClick={() => setEditing('new')}>+ New template</button>
      </div>
      {loading ? <div className='card h-40 skeleton' /> : !templates.length ? (
        <EmptyState title='No templates yet' text='Upload a blank certificate and place the name and QR code on it.' tone='yellow'>
          <button className='btn btn-ink btn-sm' onClick={() => setEditing('new')}>Create your first template</button>
        </EmptyState>
      ) : (
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {templates.map(t => (
            <div key={t._id} className='card flex flex-col'>
              <img src={t.image.url} alt='' loading='lazy' className='w-full aspect-[1.4] object-cover border-b-2 border-[var(--outline)] bg-[var(--sunken)]'
                onError={e => { e.currentTarget.style.visibility = 'hidden'; e.currentTarget.nextElementSibling.hidden = false }} />
              <p hidden className='px-4 pt-3 text-sm' style={{ color: 'var(--red)' }}>⚠ The image is missing. Open “Edit layout” and upload the blank certificate again.</p>
              <div className='p-4 flex flex-col gap-2 flex-1'>
                <p className='font-medium'>{t.name}</p>
                <p className='mono text-xs text-[var(--muted)]'>{t.fields.length} elements · {formatDate(t.createdAt)}</p>
                <div className='flex gap-2 mt-auto pt-2'>
                  <button className='btn btn-ghost btn-sm' onClick={() => setEditing(t)}>Edit layout</button>
                  <button className='btn btn-danger btn-sm' onClick={() => remove(t)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Issued ({ templates, refreshKey }) {
  const [q, setQ] = useState('')
  const { items, loading, error, reload } = useApi(`/admin/certs?q=${encodeURIComponent(q)}&k=${refreshKey}`, { auth: true })
  const [busyId, setBusyId] = useState('')

  const download = async c => {
    const tpl = templates.find(t => String(t._id) === c.templateId)
    if (!tpl) return toast.error('This certificate was not made with the designer')
    setBusyId(c._id)
    try {
      const canvas = await renderCertificate(tpl, { values: c.values, id: c._id, verifyUrl: c.verifyURL })
      saveBlob(await canvasToBlob(canvas), `${safeName(c.fullName)}-${c._id.slice(0, 6)}.png`)
    } catch { toast.error('Could not draw this certificate') }
    setBusyId('')
  }
  const remove = async c => {
    if (!window.confirm(`Delete the certificate for ${c.fullName}? Its verify link will stop working.`)) return
    const res = await api(`/admin/certs/${c._id}`, { method: 'DELETE', auth: true })
    if (res.success) { toast.success(res.msg); reload() } else toast.error(res.msg)
  }

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <h2 className='title-2'>Issued certificates</h2>
        <input className='field sm:!w-64' placeholder='Search name, email or ID…' aria-label='Search certificates' value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {loading && <div className='card h-40 skeleton' />}
      {error && <p className='text-[var(--red)]'>{error}</p>}
      {!loading && !error && !items.length && <EmptyState title={q ? 'No match' : 'Nothing issued yet'} />}
      {!!items.length && (
        <div className='card overflow-x-auto'>
          <table className='table'>
            <thead><tr><th>Name</th><th>Template</th><th>ID</th><th>Issued</th><th /></tr></thead>
            <tbody>
              {items.map(c => (
                <tr key={c._id}>
                  <td>{c.fullName}<span className='block text-xs text-[var(--muted)]'>{c.email}</span></td>
                  <td>{c.certificate}</td>
                  <td><code className='text-xs'>{c._id}</code></td>
                  <td className='whitespace-nowrap'>{formatDate(c.createdAt)}</td>
                  <td className='whitespace-nowrap text-right'>
                    <a className='btn btn-ghost btn-sm mr-2' href={`/cert/verify/${c._id}`} target='_blank' rel='noreferrer'>Open</a>
                    {c.templateId && <button className='btn btn-ghost btn-sm mr-2' disabled={busyId === c._id} onClick={() => download(c)}>{busyId === c._id ? '…' : 'PNG'}</button>}
                    <button className='btn btn-danger btn-sm' onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {items.length >= 200 && <p className='text-xs text-[var(--muted)] mt-2'>Showing the latest 200. Use search to find older ones.</p>}
    </div>
  )
}

export default function Certificates () {
  const [view, setView] = useState('generate')
  const [issuedKey, setIssuedKey] = useState(0)
  const { items: templates, loading, reload } = useApi('/admin/cert-templates', { auth: true })

  return (
    <div className='flex flex-col gap-6'>
      <div role='tablist' aria-label='Certificate tools' className='tabs self-start'>
        {VIEWS.map(([k, label]) => (
          <button key={k} role='tab' aria-selected={view === k} onClick={() => setView(k)} className='tab'>{label}</button>
        ))}
      </div>
      {view === 'generate' && <CertGenerator templates={templates} onGoTemplates={() => setView('templates')} onIssued={() => setIssuedKey(k => k + 1)} />}
      {view === 'templates' && <Templates templates={templates} loading={loading} reload={reload} />}
      {view === 'issued' && <Issued templates={templates} refreshKey={issuedKey} />}
    </div>
  )
}
