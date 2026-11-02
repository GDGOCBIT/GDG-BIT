import { LuCheck } from 'react-icons/lu'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../utils/api'
import { parseCSV, toCSV } from '../../utils/csv'
import { canvasToBlob, canvasToPdfBlob, drawCertificate, loadFonts, loadImage, makeQr, renderCertificate, safeName, saveBlob } from '../../utils/certRender'

const norm = s => String(s).trim().toLowerCase()

export default function CertGenerator ({ templates, onGoTemplates, onIssued }) {
  const [tplId, setTplId] = useState(templates[0]?._id || '')
  const [csv, setCsv] = useState(null) // { headers, rows, fileName }
  const [format, setFormat] = useState('png')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [done, setDone] = useState(null)
  const previewRef = useRef(null)
  const tpl = templates.find(t => t._id === tplId)

  useEffect(() => { if (!tplId && templates[0]) setTplId(templates[0]._id) }, [templates, tplId])

  // CSV columns the template needs vs. what the file has
  const needed = useMemo(() => (tpl ? tpl.fields.filter(f => f.type === 'text').map(f => f.key) : []), [tpl])
  const have = useMemo(() => new Set((csv?.headers || []).map(norm)), [csv])
  const missing = needed.filter(k => !have.has(k) && !(k === 'name' && (have.has('fullname') || have.has('full name'))))
  const rows = csv?.rows || []

  // live preview of the first row
  useEffect(() => {
    if (!tpl || !previewRef.current) return
    let alive = true
    ;(async () => {
      const [bg, qr] = await Promise.all([loadImage(tpl.image.url), makeQr('https://example.com/cert/verify/preview')])
      await loadFonts(tpl.fields)
      if (!alive || !previewRef.current) return
      const first = Object.fromEntries(Object.entries(rows[0] || {}).map(([k, v]) => [norm(k), v]))
      if (!first.name) first.name = first.fullname || first['full name'] || 'Sample Name'
      drawCertificate(previewRef.current, bg, tpl.fields, { values: first, id: 'a1b2c3d4e5f6a7b8c9', qr, outWidth: 1200 })
    })().catch(() => {})
    return () => { alive = false }
  }, [tpl, csv]) // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = async e => {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    const parsed = parseCSV(await f.text())
    if (!parsed.rows.length) return toast.error('That CSV has no data rows')
    setCsv({ ...parsed, fileName: f.name })
    setDone(null)
  }

  const downloadSample = () => {
    const cols = needed.length ? needed : ['name']
    saveBlob(new Blob([toCSV([...cols, 'email'], [['Ada Lovelace', ...cols.slice(1).map(c => `Sample ${c}`), 'ada@example.com']])], { type: 'text/csv' }), 'certificates-sample.csv')
  }

  const generate = async () => {
    if (!tpl) return toast.error('Pick a template first')
    if (!rows.length) return toast.error('Upload a CSV first')
    if (missing.length) return toast.error(`CSV is missing column(s): ${missing.join(', ')}`)
    if (!window.confirm(`Generate ${rows.length} certificate(s)? They become verifiable on the site right away.`)) return

    setBusy(true)
    setDone(null)
    // Test-draw first: never save certificates that cannot be drawn (e.g. template image missing).
    setProgress('Checking the template…')
    try {
      await renderCertificate(tpl, { values: { name: 'Test' }, id: 'test', verifyUrl: window.location.origin }, 600)
    } catch {
      setBusy(false); setProgress('')
      return toast.error('This template’s image could not be loaded, so nothing was saved. Open Templates → Edit layout, upload the blank certificate again and save.', { duration: 10000 })
    }
    setProgress('Saving to the database…')
    const res = await api('/admin/cert-batches', { method: 'POST', auth: true, body: { templateId: tpl._id, rows, origin: window.location.origin } })
    if (!res.success) { setBusy(false); setProgress(''); return toast.error(res.msg) }

    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      const items = res.items
      for (let i = 0; i < items.length; i++) {
        setProgress(`Drawing certificates… ${i + 1} / ${items.length}`)
        const c = items[i]
        const canvas = await renderCertificate(tpl, { values: c.values, id: c._id, verifyUrl: c.verifyURL })
        const blob = format === 'pdf' ? await canvasToPdfBlob(canvas) : await canvasToBlob(canvas)
        zip.file(`${safeName(c.fullName)}-${c._id.slice(0, 6)}.${format}`, blob)
        await new Promise(r => setTimeout(r, 0)) // keep the UI responsive
      }
      zip.file('issued.csv', toCSV(['id', 'name', 'email', 'verify_url'], items.map(c => [c._id, c.fullName, c.email, c.verifyURL])))
      setProgress('Zipping…')
      saveBlob(await zip.generateAsync({ type: 'blob' }), `${safeName(tpl.name)}-certificates.zip`)
      setDone({ count: items.length, skipped: res.skipped })
      toast.success(res.msg)
      onIssued()
    } catch (e) {
      console.error(e)
      toast.error('Certificates were saved but drawing one failed. Open the Issued tab to download them one by one.')
    }
    setBusy(false)
    setProgress('')
  }

  if (!templates.length)
    return (
      <div className='band band-yellow p-8 sm:p-10 flex flex-col items-start gap-3'>
        <p className='title-2'>Create a template first</p>
        <p className='text-[var(--muted)] max-w-lg'>Upload your blank certificate and mark where the name and QR code go. You only do this once per design.</p>
        <button className='btn btn-ink' onClick={onGoTemplates}>Create a template</button>
      </div>
    )

  return (
    <div className='grid lg:grid-cols-[22rem_1fr] gap-5 items-start'>
      <div className='card p-5 flex flex-col gap-5'>
        <div>
          <p className='mono text-xs text-[var(--muted)] mb-1'>Step 1</p>
          <label className='label' htmlFor='tpl'>Template</label>
          <select id='tpl' className='field' value={tplId} onChange={e => { setTplId(e.target.value); setDone(null) }}>
            {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <p className='mono text-xs text-[var(--muted)] mb-1'>Step 2</p>
          <p className='label'>Recipients CSV</p>
          <p className='text-xs text-[var(--muted)] mb-2'>
            Needs column{needed.length > 1 ? 's' : ''}: {needed.map(k => <code key={k} className='pill !py-0 mr-1'>{k}</code>)}
            optional <code className='pill !py-0'>email</code>
          </p>
          <div className='flex flex-wrap gap-2'>
            <label className='btn btn-ghost btn-sm cursor-pointer'>
              {csv ? 'Replace CSV' : 'Upload CSV'}
              <input type='file' accept='.csv,text/csv' hidden onChange={onFile} />
            </label>
            <button className='btn btn-ghost btn-sm' onClick={downloadSample}>Sample CSV</button>
          </div>
          {csv && (
            <p className='text-sm mt-3'>
              <b>{rows.length}</b> row{rows.length === 1 ? '' : 's'} in <span className='mono text-xs'>{csv.fileName}</span>
              {missing.length > 0 && <span className='block text-[var(--red)] mt-1'>Missing column: {missing.join(', ')}</span>}
            </p>
          )}
        </div>

        <div>
          <p className='mono text-xs text-[var(--muted)] mb-1'>Step 3</p>
          <label className='label' htmlFor='fmt'>Download format</label>
          <select id='fmt' className='field mb-3' value={format} onChange={e => setFormat(e.target.value)}>
            <option value='png'>PNG images (best for sharing)</option>
            <option value='pdf'>PDF files</option>
          </select>
          <button className='btn btn-ink w-full' onClick={generate} disabled={busy || !rows.length || missing.length > 0}>
            {busy ? progress || 'Working…' : `Generate ${rows.length || ''} certificate${rows.length === 1 ? '' : 's'}`}
          </button>
          <p className='text-xs text-[var(--muted)] mt-2'>You get a ZIP with every certificate plus <span className='mono'>issued.csv</span> (IDs and verify links).</p>
        </div>

        {done && (
          <div className='band band-green p-4'>
            <p className='font-medium flex items-center gap-2'><LuCheck aria-hidden='true' /> {done.count} certificates generated</p>
            {done.skipped?.length > 0 && <p className='text-sm mt-1'>Skipped CSV rows without a name: {done.skipped.join(', ')}</p>}
            <p className='text-sm mt-1'>Find them any time under <b>Issued</b>.</p>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-3 min-w-0'>
        <div className='flex items-center justify-between'>
          <p className='mono text-xs text-[var(--muted)]'>Preview · {rows.length ? 'first row of your CSV' : 'sample data'}</p>
        </div>
        <div className='card p-2 sm:p-3 bg-[var(--sunken)]'>
          <canvas ref={previewRef} className='w-full h-auto block rounded-lg bg-white' />
        </div>
        {rows.length > 0 && (
          <div className='card overflow-x-auto'>
            <table className='table'>
              <thead><tr>{csv.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => <tr key={i}>{csv.headers.map(h => <td key={h}>{r[h]}</td>)}</tr>)}
              </tbody>
            </table>
            {rows.length > 5 && <p className='text-xs text-[var(--muted)] p-3'>…and {rows.length - 5} more</p>}
          </div>
        )}
      </div>
    </div>
  )
}
