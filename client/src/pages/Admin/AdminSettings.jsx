import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../utils/api'
import { refreshSettings } from '../../utils/useSettings'

const HINTS = {
  email: 'name@example.com or mailto: link',
  discord: 'https://discord.gg/…',
  x: 'https://x.com/yourhandle'
}

export default function AdminSettings () {
  const [socials, setSocials] = useState(null)
  const [urls, setUrls] = useState({})
  const [live, setLive] = useState(0)
  const [override, setOverride] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const r = await api('/admin/settings', { auth: true })
    if (!r.success) return toast.error(r.msg || 'Could not load settings')
    setSocials(r.socials)
    setUrls(Object.fromEntries(r.socials.map(s => [s.key, s.url])))
    setLive(r.members.live)
    setOverride(r.members.override ?? '')
  }
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    const res = await api('/admin/settings', { method: 'PUT', auth: true, body: { socials: urls, membersOverride: override } })
    setSaving(false)
    if (res.success) { toast.success(res.msg); refreshSettings(); load() } else toast.error(res.msg)
  }

  if (!socials) return <div className='card h-64 skeleton' />

  return (
    <form onSubmit={save} className='flex flex-col gap-8'>
      <div>
        <h2 className='title-2 mb-1'>Social links</h2>
        <p className='text-[var(--muted)]'>These appear in the home page “Find us online” section and the footer. Leave a field empty to hide that link.</p>
      </div>

      <div className='grid md:grid-cols-2 gap-4'>
        {socials.map(s => (
          <div key={s.key} className='card p-4 flex flex-col gap-2'>
            <label htmlFor={`s-${s.key}`} className='flex items-center gap-3'>
              <span className='w-10 h-10 rounded-full bg-white border-2 border-[var(--outline)] flex items-center justify-center shrink-0'>
                <img src={s.icon} alt='' className='w-5 h-5 object-contain' />
              </span>
              <span className='font-medium'>{s.label}</span>
              {!urls[s.key] && <span className='pill !py-0 ml-auto'>hidden</span>}
            </label>
            <div className='flex gap-2'>
              <input id={`s-${s.key}`} className='field' placeholder={HINTS[s.key] || `https://…`} value={urls[s.key] || ''}
                onChange={e => setUrls({ ...urls, [s.key]: e.target.value })} inputMode={s.key === 'email' ? 'email' : 'url'} />
              {s.default && urls[s.key] !== s.default && (
                <button type='button' className='btn btn-ghost btn-sm shrink-0' title='Restore the original link' onClick={() => setUrls({ ...urls, [s.key]: s.default })}>Reset</button>
              )}
            </div>
            {urls[s.key] && (
              <a href={/^mailto:/.test(urls[s.key]) || !/\./.test(urls[s.key]) ? undefined : (/^https?:/.test(urls[s.key]) ? urls[s.key] : `https://${urls[s.key]}`)} target='_blank' rel='noreferrer'
                className='text-xs text-[var(--muted)] hover:underline truncate'>Test link ↗</a>
            )}
          </div>
        ))}
      </div>

      <div>
        <h2 className='title-2 mb-1'>Chapter members</h2>
        <p className='text-[var(--muted)] mb-3'>Shown on the home page. By default this is the live count from your GDG community page (<b>{live.toLocaleString('en-IN')}</b> right now).</p>
        <div className='flex flex-wrap items-end gap-3'>
          <div>
            <label className='label' htmlFor='mo'>Override (optional)</label>
            <input id='mo' type='number' min='0' className='field !w-48' placeholder={String(live)} value={override} onChange={e => setOverride(e.target.value)} />
          </div>
          {override !== '' && <button type='button' className='btn btn-ghost btn-sm' onClick={() => setOverride('')}>Use the live count</button>}
        </div>
      </div>

      <div><button className='btn btn-ink' disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  )
}
