import { useRef, useState } from 'react'
import { toast } from 'sonner'
import useApi from '../../utils/useApi'
import { api } from '../../utils/api'
import { compressPhoto } from '../../utils/imageCompress'
import EmptyState from '../../components/EmptyState'

export default function AdminGallery () {
  const { items, loading, error, reload } = useApi('/gallery')
  const [event, setEvent] = useState('')
  const [progress, setProgress] = useState('')
  const [over, setOver] = useState(false)
  const input = useRef(null)

  const upload = async files => {
    const list = [...files].filter(f => /^image\//.test(f.type))
    if (!list.length) return toast.error('Choose image files')
    let done = 0
    for (const f of list) {
      setProgress(`Uploading ${done + 1} / ${list.length}…`)
      try {
        const { full, thumb, width, height } = await compressPhoto(f)
        const form = new FormData()
        form.append('file', full, 'photo.jpg')
        form.append('thumb', thumb, 'thumb.jpg')
        form.append('width', width)
        form.append('height', height)
        form.append('event', event)
        form.append('title', f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
        const res = await api('/admin/gallery', { method: 'POST', body: form, auth: true })
        if (res.success) done++
        else toast.error(`${f.name}: ${res.msg}`)
      } catch (e) {
        toast.error(`${f.name}: ${e.message}`)
      }
    }
    setProgress('')
    if (done) toast.success(`${done} photo${done > 1 ? 's' : ''} added`)
    reload()
  }

  const edit = async p => {
    const caption = window.prompt('Caption (shown in the gallery):', p.caption || '')
    if (caption === null) return
    const res = await api(`/admin/gallery/${p._id}`, { method: 'PUT', body: { caption }, auth: true })
    if (res.success) { toast.success(res.msg); reload() } else toast.error(res.msg)
  }
  const remove = async p => {
    if (!window.confirm('Delete this photo?')) return
    const res = await api(`/admin/gallery/${p._id}`, { method: 'DELETE', auth: true })
    if (res.success) { toast.success(res.msg); reload() } else toast.error(res.msg)
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='title-2 mb-1'>Gallery</h2>
        <p className='text-[var(--muted)]'>Photos from your events. They are resized in your browser, so big camera files are fine. Event posters from the GDG page are added to the public gallery automatically.</p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files) }}
        className={`card p-6 sm:p-8 flex flex-col items-center text-center gap-3 border-dashed ${over ? 'bg-[var(--blue-pa)] text-[var(--black)]' : ''}`}>
        <p className='text-lg font-medium'>{progress || 'Drop photos here'}</p>
        <div className='w-full max-w-sm'>
          <label className='label' htmlFor='ev'>Event (optional, applies to this upload)</label>
          <input id='ev' className='field' placeholder='e.g. Study Jam 2025' value={event} onChange={e => setEvent(e.target.value)} />
        </div>
        <button className='btn btn-ink' disabled={!!progress} onClick={() => input.current.click()}>{progress ? 'Please wait…' : 'Choose photos'}</button>
        <input ref={input} type='file' accept='image/*' multiple hidden onChange={e => { upload(e.target.files); e.target.value = '' }} />
      </div>

      {loading && <div className='card h-40 skeleton' />}
      {error && <p className='text-[var(--red)]'>{error}</p>}
      {!loading && !error && !items.length && <EmptyState title='No photos yet' text='Upload your first event photos above.' tone='green' />}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
        {items.map(p => (
          <figure key={p._id} className='card flex flex-col'>
            <img src={p.thumbUrl} alt={p.title} loading='lazy' className='aspect-square object-cover w-full border-b-2 border-[var(--outline)]' />
            <figcaption className='p-2 text-xs flex flex-col gap-1.5'>
              <span className='truncate text-[var(--muted)]'>{p.caption || p.event || p.title}</span>
              <span className='flex gap-1.5'>
                <button className='btn btn-ghost btn-sm !px-3 !min-h-8' onClick={() => edit(p)}>Caption</button>
                <button className='btn btn-danger btn-sm !px-3 !min-h-8' onClick={() => remove(p)}>Delete</button>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
