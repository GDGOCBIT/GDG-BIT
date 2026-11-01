import { useMemo, useState } from 'react'
import useApi from '../utils/useApi'
import EventGrid from '../components/EventGrid'
import PageHeader from '../components/PageHeader'
import { COMMUNITY_URL } from '../components/Brand'

const TABS = [
  { key: 'upcoming', label: 'Upcoming', empty: 'No upcoming events right now' },
  { key: 'live', label: 'Live now', empty: 'Nothing is live at the moment' },
  { key: 'past', label: 'Past', empty: 'No past events yet' },
  { key: 'all', label: 'All', empty: 'No events yet' }
]

export default function Events () {
  const { items, loading, error } = useApi('/events')
  const [tab, setTab] = useState(null)
  const [q, setQ] = useState('')

  const counts = useMemo(() => {
    const c = { all: items.length, upcoming: 0, live: 0, past: 0 }
    items.forEach(e => c[e.status]++)
    return c
  }, [items])

  // Default tab: whatever has something to show, in order of interest.
  const active = tab || (counts.live ? 'live' : counts.upcoming ? 'upcoming' : 'past')
  const current = TABS.find(t => t.key === active)

  const events = items
    .filter(e => active === 'all' || e.status === active)
    .filter(e => !q || `${e.title} ${e.description}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) =>
      active === 'upcoming' || active === 'live'
        ? new Date(a.startDate) - new Date(b.startDate)
        : new Date(b.startDate) - new Date(a.startDate)
    )

  return (
    <>
      <PageHeader
        tag='Events'
        title={<>Workshops, study jams <b>&amp; meetups</b></>}
        text='Everything we have run and everything coming up. RSVPs happen on the official GDG community page.'
        tone='blue'
      />
      <section className='wrap pt-10'>
        <div className='flex flex-col md:flex-row gap-4 md:items-center justify-between mb-8'>
          <div role='tablist' aria-label='Filter events' className='tabs'>
            {TABS.map(t => (
              <button key={t.key} role='tab' aria-selected={active === t.key} onClick={() => setTab(t.key)} className='tab'>
                {t.label} <span className='count'>{counts[t.key]}</span>
              </button>
            ))}
          </div>
          <input
            type='search'
            className='field md:!w-72'
            placeholder='Search events…'
            aria-label='Search events'
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <EventGrid events={events} loading={loading} error={error} count={6}
          empty={q ? `No events match “${q}”` : current.empty} />
        {active === 'upcoming' && !loading && !counts.upcoming && (
          <p className='text-center mt-6 text-[var(--muted)]'>
            Follow us on the{' '}
            <a className='underline' href={COMMUNITY_URL} target='_blank' rel='noreferrer'>GDG community page</a>{' '}
            to hear about the next one first.
          </p>
        )}
      </section>
    </>
  )
}
