import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { api, formatDate } from '../../utils/api'
import ResourceManager from './ResourceManager'
import Certificates from './Certificates'
import AdminGallery from './AdminGallery'
import AdminSettings from './AdminSettings'
import AdminAdmins from './AdminAdmins'
import AdminTeam from './AdminTeam'
import AdminMembers from './AdminMembers'

const thumb = i =>
  <img src={i.image?.url || '/user.svg'} alt='' className='w-10 h-10 rounded-lg object-cover bg-[var(--sunken)]' />

const CONFIGS = {
  projects: {
    title: 'Projects', path: 'projects', image: true,
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'tags', label: 'Tags', type: 'tags' },
      { name: 'repoLink', label: 'Repository URL', type: 'url' },
      { name: 'demoLink', label: 'Demo URL', type: 'url' }
    ],
    columns: [
      { label: '', render: thumb },
      { label: 'Title', render: i => i.title },
      { label: 'Tags', render: i => (i.tags || []).join(', ') }
    ]
  },
}
const STAT_LABELS = [
  ['users', 'Registered members', 'var(--blue-pa)'],
  ['certificates', 'Certificates issued', 'var(--red-pa)'],
  ['templates', 'Certificate templates', 'var(--yellow-pa)'],
  ['photos', 'Gallery photos', 'var(--green-pa)'],
  ['projects', 'Projects added', 'var(--blue-pa)']
]

function Overview () {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    api('/admin/stats', { auth: true }).then(r => r.success && setStats(r.stats))
  }, [])
  return (
    <div className='grid grid-cols-2 lg:grid-cols-5 gap-4'>
      {STAT_LABELS.map(([k, label, color]) => (
        <div key={k} className='band p-5 sm:p-6' style={{ background: color }}>
          <p className='mono text-xs'>{label}</p>
          <p className='text-4xl sm:text-5xl font-medium mt-1'>{stats ? stats[k] : '–'}</p>
        </div>
      ))}
    </div>
  )
}

const TABS = [['overview', 'Overview'], ['certs', 'Certificates'], ['gallery', 'Gallery'], ['projects', 'Projects'], ['team', 'Team'], ['members', 'Members'], ['settings', 'Social links'], ['admins', 'Admins']]

export default function Admin () {
  const { user, verifyLoading } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (!verifyLoading && !localStorage.getItem('login_token')) navigate('/auth')
    else if (!verifyLoading && user && !user.isAdmin) navigate('/')
  }, [verifyLoading, user, navigate])

  if (!user?.isAdmin) return <div className='wrap page-top'><div className='card h-40 skeleton' /></div>

  return (
    <div className='wrap page-top'>
      <div className='band band-ink px-6 py-8 sm:px-10 sm:py-10 flex flex-col gap-2'>
        <p className='mono text-sm text-[var(--muted)]'>{'{ admin }'}</p>
        <h1 className='title-1'>Hi {user.firstName}, <b>manage the site</b></h1>
        <p className='text-[var(--muted)] max-w-2xl'>
          Events and the team list come from the GDG community page automatically. Here you design and issue
          certificates, and add projects that appear next to the ones synced from GitHub.
        </p>
      </div>

      <div role='tablist' aria-label='Admin sections' className='tabs my-8'>
        {TABS.map(([k, label]) => (
          <button key={k} role='tab' aria-selected={tab === k} onClick={() => setTab(k)} className='tab'>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? <Overview /> : tab === 'certs' ? <Certificates /> : tab === 'gallery' ? <AdminGallery /> : tab === 'settings' ? <AdminSettings /> : tab === 'team' ? <AdminTeam /> : tab === 'members' ? <AdminMembers /> : tab === 'admins' ? <AdminAdmins /> : <ResourceManager key={tab} config={CONFIGS[tab]} />}
    </div>
  )
}
