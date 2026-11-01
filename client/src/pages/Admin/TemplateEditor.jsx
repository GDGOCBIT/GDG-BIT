import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../utils/api'
import { FONTS, drawCertificate, loadFonts, loadImage, makeQr, newField } from '../../utils/certRender'

const SAMPLE_URL = 'https://gdgocbit.example/cert/verify/preview'
const SAMPLE_ID = 'a1b2c3d4e5f6a7b8c9'
const SNAP_PX = 7 // snap distance in screen pixels

const GRIDS = [
  ['off', 'No grid'],
  ['thirds', 'Thirds'],
  ['quarters', 'Quarters'],
  ['10', 'Every 10%'],
  ['5', 'Every 5%']
]
const gridLines = mode => {
  if (mode === 'thirds') return [100 / 3, 200 / 3]
  if (mode === 'quarters') return [25, 50, 75]
  const step = mode === '10' ? 10 : mode === '5' ? 5 : 0
  return step ? Array.from({ length: 100 / step - 1 }, (_, i) => (i + 1) * step) : []
}
const round = n => +n.toFixed(2)

function Num ({ sel, update, label, k, min, max, step = 0.1, suffix = '%' }) {
  return (
    <div>
      <label className='label'>{label}</label>
      <div className='flex items-center gap-2'>
        <input type='range' min={min} max={max} step={step} value={sel[k]} onChange={e => update(sel.id, { [k]: +e.target.value })} className='flex-1 accent-[var(--blue)]' />
        <input type='number' className='field !w-20 !min-h-9 !py-1 !px-2' min={min} max={max} step={step} value={sel[k]} onChange={e => update(sel.id, { [k]: +e.target.value })} />
        <span className='text-xs text-[var(--muted)] w-4'>{suffix}</span>
      </div>
    </div>
  )
}

/**
 * Visual designer: upload the blank certificate, drag name / QR / ID / extra text where you want them.
 * Grid, snapping, smart guides, centering buttons, zoom and undo make precise placement easy.
 * The preview is drawn by the same renderer that makes the final certificates.
 */
export default function TemplateEditor ({ template, onClose, onSaved }) {
  const isNew = !template
  const [name, setName] = useState(template?.name || '')
  const [imgSrc, setImgSrc] = useState(template?.image?.url || '')
  const [file, setFile] = useState(null)
  const [fields, setFields] = useState(template?.fields || [])
  const [selected, setSelected] = useState(template?.fields?.[0]?.id || null)
  const [bg, setBg] = useState(null)
  const [imgError, setImgError] = useState(false)
  const [qr, setQr] = useState(null)
  const [boxes, setBoxes] = useState({})
  const [saving, setSaving] = useState(false)
  const [grid, setGrid] = useState('quarters')
  const [snap, setSnap] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [guides, setGuides] = useState({ x: [], y: [] })
  const [dragging, setDragging] = useState(false)
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const drag = useRef(null)
  const hist = useRef({ stack: [JSON.stringify(template?.fields || [])], idx: 0, skip: false })

  const sel = fields.find(f => f.id === selected)

  // ---- background image
  useEffect(() => {
    if (!imgSrc) return setBg(null)
    let alive = true
    setImgError(false)
    loadImage(imgSrc).then(i => alive && setBg(i)).catch(() => {
      if (!alive) return
      setBg(null)
      setImgError(true)
    })
    return () => { alive = false }
  }, [imgSrc])

  useEffect(() => { makeQr(SAMPLE_URL).then(setQr) }, [])

  const sampleValues = Object.fromEntries(fields.filter(f => f.type === 'text').map(f => [f.key, f.key === 'name' ? 'Sample Name' : `[${f.label || f.key}]`]))

  const redraw = useCallback(async () => {
    if (!bg || !canvasRef.current) return
    await loadFonts(fields)
    setBoxes(drawCertificate(canvasRef.current, bg, fields, { values: sampleValues, id: SAMPLE_ID, qr, outWidth: 1400 }))
  }, [bg, fields, qr]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { redraw() }, [redraw])

  // ---- undo / redo (snapshots, debounced so sliders and drags make one step)
  useEffect(() => {
    const h = hist.current
    if (h.skip) { h.skip = false; return }
    const t = setTimeout(() => {
      const snapshot = JSON.stringify(fields)
      if (snapshot === h.stack[h.idx]) return
      h.stack = [...h.stack.slice(0, h.idx + 1), snapshot].slice(-60)
      h.idx = h.stack.length - 1
    }, 450)
    return () => clearTimeout(t)
  }, [fields])
  const undo = useCallback(() => {
    const h = hist.current
    const now = JSON.stringify(fields)
    if (now !== h.stack[h.idx]) { h.stack = [...h.stack.slice(0, h.idx + 1), now]; h.idx = h.stack.length - 1 } // flush pending change
    if (h.idx === 0) return
    h.idx -= 1; h.skip = true
    setFields(JSON.parse(h.stack[h.idx]))
  }, [fields])
  const redo = useCallback(() => {
    const h = hist.current
    if (h.idx >= h.stack.length - 1) return
    h.idx += 1; h.skip = true
    setFields(JSON.parse(h.stack[h.idx]))
  }, [])

  const update = (id, patch) => setFields(fs => fs.map(f => (f.id === id ? { ...f, ...patch } : f)))
  const add = type => {
    const base = newField(type)
    if (type === 'text') {
      const taken = new Set(fields.map(f => f.key))
      if (!taken.has('name')) base.key = 'name'
      else { let n = 1; while (taken.has(`field${n}`)) n++; base.key = `field${n}`; base.label = `Field ${n}`; base.y = 58; base.size = 2.2; base.weight = 400; base.maxWidth = 60 }
    }
    if (type === 'qr' && fields.some(f => f.type === 'qr')) return toast.error('A certificate needs just one QR code')
    if (type === 'id' && fields.some(f => f.type === 'id')) return toast.error('Certificate ID is already added')
    setFields(fs => [...fs, base])
    setSelected(base.id)
  }
  const remove = id => { setFields(fs => fs.filter(f => f.id !== id)); setSelected(null) }

  // ---- centering helpers: move so the element's *box* is centred on the page
  const centre = axis => {
    const b = boxes[sel.id]
    if (!b) return
    const patch = {}
    if (axis !== 'y') patch.x = round(sel.x + (50 - (b.x + b.w / 2)))
    if (axis !== 'x') patch.y = round(sel.y + (50 - (b.y + b.h / 2)))
    update(sel.id, patch)
  }
  const matchName = axis => {
    const n = fields.find(f => f.key === 'name')
    if (n && sel) update(sel.id, axis === 'x' ? { x: n.x } : { y: n.y })
  }

  // ---- dragging with snapping + smart guides
  const onPointerDown = (e, f) => {
    e.preventDefault()
    setSelected(f.id)
    const r = stageRef.current.getBoundingClientRect()
    drag.current = { id: f.id, r, box: boxes[f.id], x0: f.x, y0: f.y, px: e.clientX, py: e.clientY }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = e => {
    const d = drag.current
    if (!d) return
    let dx = ((e.clientX - d.px) / d.r.width) * 100
    let dy = ((e.clientY - d.py) / d.r.height) * 100
    if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0 } // Shift = lock to one axis
    const g = { x: [], y: [] }
    if (snap && !e.altKey && d.box) { // hold Alt to move freely
      const tolX = (SNAP_PX / d.r.width) * 100
      const tolY = (SNAP_PX / d.r.height) * 100
      const others = Object.entries(boxes).filter(([id]) => id !== d.id).map(([, b]) => b)
      const lines = axis => {
        const out = [50, ...gridLines(grid)]
        others.forEach(b => (axis === 'x' ? out.push(b.x, b.x + b.w / 2, b.x + b.w) : out.push(b.y, b.y + b.h / 2, b.y + b.h)))
        return out
      }
      const fit = (axis, delta, tol) => {
        const [start, size] = axis === 'x' ? [d.box.x, d.box.w] : [d.box.y, d.box.h]
        const edges = [start + delta, start + delta + size / 2, start + delta + size]
        let best = null
        lines(axis).forEach(L => edges.forEach(ed => {
          const diff = L - ed
          if (Math.abs(diff) <= tol && (best === null || Math.abs(diff) < Math.abs(best.diff))) best = { diff, line: L }
        }))
        if (best) { g[axis].push(best.line); return delta + best.diff }
        return delta
      }
      dx = fit('x', dx, tolX)
      dy = fit('y', dy, tolY)
    }
    update(d.id, { x: round(Math.min(100, Math.max(0, d.x0 + dx))), y: round(Math.min(100, Math.max(0, d.y0 + dy))) })
    setGuides(g)
  }
  const onPointerUp = () => { drag.current = null; setDragging(false); setGuides({ x: [], y: [] }) }

  // ---- keyboard: arrows nudge, Delete removes, Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y undo/redo
  useEffect(() => {
    const onKey = e => {
      const tag = e.target.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return }
      if (typing || !sel) return
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 0.1
        update(sel.id, {
          x: round(Math.min(100, Math.max(0, sel.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0)))),
          y: round(Math.min(100, Math.max(0, sel.y + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0))))
        })
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !(sel.type === 'text' && sel.key === 'name')) remove(sel.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel, undo, redo])

  const save = async () => {
    if (!name.trim()) return toast.error('Give the template a name')
    if (!bg) return toast.error(imgError ? 'The saved template image is missing. Upload the blank certificate again.' : 'Upload the blank certificate image')
    if (!fields.some(f => f.type === 'text' && f.key === 'name')) return toast.error('Add the Name field')
    if (!fields.some(f => f.type === 'qr') && !window.confirm('There is no QR code on this template, so certificates cannot be verified from a scan. Save anyway?')) return
    setSaving(true)
    const form = new FormData()
    form.append('name', name.trim())
    form.append('fields', JSON.stringify(fields))
    if (file) {
      form.append('file', file)
      form.append('width', bg.naturalWidth)
      form.append('height', bg.naturalHeight)
    }
    const res = await api(isNew ? '/admin/cert-templates' : `/admin/cert-templates/${template._id}`, { method: isNew ? 'POST' : 'PUT', body: form, auth: true })
    setSaving(false)
    if (res.success) { toast.success(res.msg); onSaved() } else toast.error(res.msg)
  }

  const lines = gridLines(grid)
  const canUndo = hist.current.idx > 0 || JSON.stringify(fields) !== hist.current.stack[hist.current.idx]
  const canRedo = hist.current.idx < hist.current.stack.length - 1

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-5'>
        <div className='flex items-center gap-3 min-w-0'>
          <button className='btn btn-ghost btn-sm' onClick={onClose}>← Back</button>
          <h2 className='title-2'>{isNew ? 'New template' : 'Edit template'}</h2>
        </div>
        <button className='btn btn-ink' onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save template'}</button>
      </div>

      <div className='grid lg:grid-cols-[1fr_21rem] gap-5 items-start'>
        {/* ---------------------------------------------------------- stage */}
        <div className='flex flex-col gap-3 min-w-0'>
          <div className='grid sm:grid-cols-[1fr_auto] gap-3'>
            <div>
              <label className='label' htmlFor='tname'>Template name</label>
              <input id='tname' className='field' placeholder='e.g. Study Jam 2025 – Completion' value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className='self-end'>
              <label className='btn btn-ghost w-full cursor-pointer'>
                {bg || imgError ? 'Replace blank certificate' : 'Upload blank certificate'}
                <input type='file' accept='image/png,image/jpeg,image/webp' hidden onChange={e => {
                  const f = e.target.files[0]
                  e.target.value = ''
                  if (!f) return
                  if (f.size > 4 * 1024 * 1024) return toast.error('That image is over 4 MB. Export a smaller one (2000–3000px wide is plenty).')
                  setFile(f)
                  setImgSrc(URL.createObjectURL(f))
                }} />
              </label>
            </div>
          </div>

          {imgError && !bg && (
            <div className='band band-red p-5'>
              <p className='font-medium'>The saved blank certificate image could not be loaded.</p>
              <p className='text-sm mt-1'>Upload it again with “Replace blank certificate” and press Save. Your element layout is kept.</p>
            </div>
          )}

          {/* toolbar */}
          {bg && (
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              <select className='field !w-auto !min-h-9 !py-1' aria-label='Grid' value={grid} onChange={e => setGrid(e.target.value)}>
                {GRIDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <label className='btn btn-ghost btn-sm cursor-pointer select-none'>
                <input type='checkbox' checked={snap} onChange={e => setSnap(e.target.checked)} className='accent-[var(--blue)]' /> Snap to guides
              </label>
              <div className='flex items-center gap-2 px-2'>
                <span className='text-[var(--muted)]'>Zoom</span>
                <input type='range' min={50} max={200} step={10} value={zoom} onChange={e => setZoom(+e.target.value)} className='w-24 accent-[var(--blue)]' aria-label='Zoom' />
                <span className='mono text-xs w-9'>{zoom}%</span>
              </div>
              <div className='flex gap-1 ml-auto'>
                <button className='btn btn-ghost btn-sm' onClick={undo} disabled={!canUndo} title='Undo (Ctrl+Z)'>↶ Undo</button>
                <button className='btn btn-ghost btn-sm' onClick={redo} disabled={!canRedo} title='Redo (Ctrl+Shift+Z)'>↷ Redo</button>
              </div>
            </div>
          )}

          {!bg && !imgError ? (
            <div className='band band-blue p-10 text-center flex flex-col items-center gap-3'>
              <p className='text-xl font-medium'>Start with your blank certificate</p>
              <p className='text-[var(--muted)] max-w-md'>Upload a PNG / JPG / WebP (up to 4 MB) with empty space where the name and QR code should go. 2000–3000px wide is plenty.</p>
            </div>
          ) : bg && (
            <div className='card p-2 sm:p-3 !overflow-auto bg-[var(--sunken)] max-h-[80vh]'>
              <div ref={stageRef} className='relative select-none touch-none' style={{ width: `${zoom}%`, margin: zoom <= 100 ? '0 auto' : 0 }}>
                <canvas ref={canvasRef} className='w-full h-auto block rounded-lg' />

                {/* grid + page-centre lines + live snap guides */}
                <svg className='absolute inset-0 w-full h-full pointer-events-none' viewBox='0 0 100 100' preserveAspectRatio='none'>
                  {lines.map(v => (
                    <g key={v}>
                      <line x1={v} y1='0' x2={v} y2='100' stroke='#4285f4' strokeOpacity='0.45' strokeWidth='1' vectorEffect='non-scaling-stroke' />
                      <line x1='0' y1={v} x2='100' y2={v} stroke='#4285f4' strokeOpacity='0.45' strokeWidth='1' vectorEffect='non-scaling-stroke' />
                    </g>
                  ))}
                  {grid !== 'off' && (
                    <>
                      <line x1='50' y1='0' x2='50' y2='100' stroke='#ea4335' strokeOpacity='0.7' strokeWidth='1' strokeDasharray='6 4' vectorEffect='non-scaling-stroke' />
                      <line x1='0' y1='50' x2='100' y2='50' stroke='#ea4335' strokeOpacity='0.7' strokeWidth='1' strokeDasharray='6 4' vectorEffect='non-scaling-stroke' />
                    </>
                  )}
                  {guides.x.map(v => <line key={'gx' + v} x1={v} y1='0' x2={v} y2='100' stroke='#ff2d92' strokeWidth='1.5' vectorEffect='non-scaling-stroke' />)}
                  {guides.y.map(v => <line key={'gy' + v} x1='0' y1={v} x2='100' y2={v} stroke='#ff2d92' strokeWidth='1.5' vectorEffect='non-scaling-stroke' />)}
                </svg>

                {fields.map(f => {
                  const b = boxes[f.id]
                  if (!b) return null
                  const isSel = f.id === selected
                  return (
                    <div key={f.id}
                      onPointerDown={e => onPointerDown(e, f)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                      title={`Drag to move · ${f.label}`}
                      className={`absolute cursor-move rounded-sm ${isSel ? 'outline outline-2 outline-[var(--blue)] bg-[color-mix(in_srgb,var(--blue)_12%,transparent)]' : 'outline outline-1 outline-dashed outline-[color-mix(in_srgb,var(--blue)_55%,transparent)] hover:bg-[color-mix(in_srgb,var(--blue)_8%,transparent)]'}`}
                      style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}>
                      {isSel && (
                        <span className='absolute -top-6 left-0 mono text-[0.65rem] px-1.5 py-0.5 rounded bg-[var(--blue)] text-white whitespace-nowrap'>
                          {f.label}{dragging ? ` · ${f.x}%, ${f.y}%` : ''}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {bg && (
            <p className='text-xs text-[var(--muted)] leading-relaxed'>
              <b>Tips:</b> drag to move · pink lines = snapped to the page centre, the grid or another element · hold <kbd className='mono'>Alt</kbd> to move freely · <kbd className='mono'>Shift</kbd> locks to one direction ·
              arrow keys nudge (Shift = bigger) · <kbd className='mono'>Ctrl+Z</kbd> undo. The QR shown is a placeholder; every certificate gets its own.
            </p>
          )}
        </div>

        {/* -------------------------------------------------------- sidebar */}
        <aside className='card p-4 flex flex-col gap-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] !overflow-y-auto'>
          <div>
            <p className='mono text-xs text-[var(--muted)] mb-2'>Elements</p>
            <div className='flex flex-col gap-1.5'>
              {fields.map(f => (
                <div key={f.id} className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 cursor-pointer ${f.id === selected ? 'border-[var(--outline)] bg-[var(--sunken)]' : 'border-transparent hover:bg-[var(--sunken)]'}`} onClick={() => setSelected(f.id)}>
                  <span className='text-sm flex-1 truncate'>{f.label}</span>
                  <span className='pill !py-0'>{f.type === 'text' ? f.key : f.type}</span>
                </div>
              ))}
              {!fields.length && <p className='text-sm text-[var(--muted)]'>No elements yet. Add the Name first.</p>}
            </div>
            <div className='flex flex-wrap gap-1.5 mt-3'>
              {!fields.some(f => f.key === 'name') && <button className='btn btn-ghost btn-sm' onClick={() => add('text')}>+ Name</button>}
              {!fields.some(f => f.type === 'qr') && <button className='btn btn-ghost btn-sm' onClick={() => add('qr')}>+ QR code</button>}
              {!fields.some(f => f.type === 'id') && <button className='btn btn-ghost btn-sm' onClick={() => add('id')}>+ Certificate ID</button>}
              {fields.some(f => f.key === 'name') && <button className='btn btn-ghost btn-sm' onClick={() => add('text')}>+ Other text</button>}
            </div>
          </div>

          {sel && (
            <div className='flex flex-col gap-3 pt-4 border-t border-[var(--hairline)]'>
              <p className='mono text-xs text-[var(--muted)]'>Selected: {sel.label}</p>

              <div>
                <p className='label'>Align</p>
                <div className='grid grid-cols-3 gap-1.5'>
                  <button className='btn btn-ghost btn-sm !px-2' onClick={() => centre('x')} title='Centre horizontally on the page'>↔ Centre</button>
                  <button className='btn btn-ghost btn-sm !px-2' onClick={() => centre('y')} title='Centre vertically on the page'>↕ Middle</button>
                  <button className='btn btn-ghost btn-sm !px-2' onClick={() => centre('both')} title='Centre on the page'>✛ Both</button>
                </div>
                {sel.key !== 'name' && fields.some(f => f.key === 'name') && (
                  <div className='grid grid-cols-2 gap-1.5 mt-1.5'>
                    <button className='btn btn-ghost btn-sm !px-2' onClick={() => matchName('x')}>Same X as Name</button>
                    <button className='btn btn-ghost btn-sm !px-2' onClick={() => matchName('y')}>Same Y as Name</button>
                  </div>
                )}
              </div>

              {sel.type === 'text' && sel.key !== 'name' && (
                <div>
                  <label className='label'>CSV column name</label>
                  <input className='field !min-h-10' value={sel.key} onChange={e => {
                    const key = e.target.value.toLowerCase().replace(/[^\w ]/g, '').trim()
                    update(sel.id, { key, label: e.target.value })
                  }} placeholder='e.g. course' />
                  <p className='text-xs text-[var(--muted)] mt-1'>Your CSV needs a column with this exact name.</p>
                </div>
              )}
              <Num sel={sel} update={update} label='X position' k='x' min={0} max={100} />
              <Num sel={sel} update={update} label='Y position' k='y' min={0} max={100} />
              <Num sel={sel} update={update} label={sel.type === 'qr' ? 'QR size (% of width)' : 'Text size (% of width)'} k='size' min={sel.type === 'qr' ? 4 : 0.8} max={sel.type === 'qr' ? 30 : 12} />
              {sel.type !== 'qr' && (
                <>
                  <Num sel={sel} update={update} label='Shrink to fit width (0 = off)' k='maxWidth' min={0} max={100} step={1} />
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='label'>Font</label>
                      <select className='field !min-h-10' value={sel.font} onChange={e => update(sel.id, { font: e.target.value })}>
                        {FONTS.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className='label'>Weight</label>
                      <select className='field !min-h-10' value={sel.weight} onChange={e => update(sel.id, { weight: +e.target.value })}>
                        <option value={400}>Regular</option><option value={500}>Medium</option><option value={700}>Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className='label'>Text anchor</label>
                      <select className='field !min-h-10' value={sel.align} onChange={e => update(sel.id, { align: e.target.value })}>
                        <option value='left'>Left edge at X</option><option value='center'>Centred on X</option><option value='right'>Right edge at X</option>
                      </select>
                    </div>
                    <div>
                      <label className='label'>Colour</label>
                      <input type='color' className='field !min-h-10 !p-1' value={sel.color} onChange={e => update(sel.id, { color: e.target.value })} />
                    </div>
                  </div>
                </>
              )}
              {!(sel.type === 'text' && sel.key === 'name') && (
                <button className='btn btn-danger btn-sm self-start' onClick={() => remove(sel.id)}>Remove element</button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
