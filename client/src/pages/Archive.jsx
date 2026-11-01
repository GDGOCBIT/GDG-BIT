import useApi from '../utils/useApi'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { formatDate } from '../utils/api'
import { sized } from '../utils/images'

const COLORS = ['var(--blue)', 'var(--red)', 'var(--yellow)', 'var(--green)']

export default function Archive () {
  const { items, loading, error } = useApi('/events')
  const past = items.filter(e => e.status === 'past').sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  const byYear = past.reduce((acc, e) => {
    const y = new Date(e.startDate).getFullYear()
    ;(acc[y] = acc[y] || []).push(e)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a, b) => b - a)

  return (
    <>
      <PageHeader tag='Archive' title={<>Everything we have <b>done so far</b></>}
        text={`${past.length || 'All'} sessions, from our very first meetup to the latest build night.`} tone='green' dot='var(--green)' />
      <section className='wrap pt-10'>
        {loading ? (
          <div className='flex flex-col gap-3'>{[0, 1, 2, 3].map(i => <div key={i} className='h-20 card skeleton' />)}</div>
        ) : error ? (
          <EmptyState title='Could not load the archive' text={error} tone='red' />
        ) : !years.length ? (
          <EmptyState title='Nothing archived yet' />
        ) : (
          <div className='flex flex-col gap-12'>
            {years.map((y, yi) => (
              <div key={y} className='grid md:grid-cols-[8rem_1fr] gap-4'>
                <div className='md:sticky md:top-24 self-start flex md:flex-col items-center md:items-start gap-3'>
                  <span className='text-4xl font-medium'>{y}</span>
                  <span className='pill'>{byYear[y].length} events</span>
                </div>
                <ol className='flex flex-col gap-3'>
                  {byYear[y].map(e => (
                    <li key={e._id}>
                      <a href={e.link} target='_blank' rel='noreferrer' className='card lift flex items-center gap-4 p-3 pr-5'>
                        {e.image?.url ? (
                          <img src={sized(e.image.url, 160)} alt='' width='80' height='80' loading='lazy' decoding='async' className='w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[var(--outline)] shrink-0' />
                        ) : (
                          <span className='w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[var(--outline)] shrink-0' style={{ background: COLORS[yi % 4] }} />
                        )}
                        <div className='min-w-0 flex-1'>
                          <p className='font-medium leading-snug line-clamp-2'>{e.title}</p>
                          <p className='mono text-xs text-[var(--muted)] mt-1'>{formatDate(e.startDate)} · {e.mode}</p>
                        </div>
                        <span aria-hidden='true' className='max-sm:hidden'>→</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
