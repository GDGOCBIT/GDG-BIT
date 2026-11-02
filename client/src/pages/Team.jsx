import IconLink from '../components/IconLink'
import useApi from '../utils/useApi'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { sized } from '../utils/images'
import Img from '../components/Img'

const TONES = ['var(--blue-pa)', 'var(--red-pa)', 'var(--yellow-pa)', 'var(--green-pa)']
const ORDER = ['Organizers', 'Leads', 'Core']

export default function Team () {
  const { items, loading, error } = useApi('/team')
  const groups = items.reduce((acc, m) => {
    const g = m.team || 'Core'
    ;(acc[g] = acc[g] || []).push(m)
    return acc
  }, {})
  const names = Object.keys(groups).sort((a, b) => {
    const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b)
  })

  return (
    <>
      <PageHeader tag='Team' title={<>The people behind <b>GDG on Campus BIT</b></>}
        text='Organizers and leads who plan the sessions, design the posters and keep the community running.' tone='yellow' dot='var(--yellow)' />
      <section className='wrap pt-10 flex flex-col gap-14'>
        {loading && (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'>
            {[0, 1, 2, 3].map(i => <div key={i} className='card h-72 skeleton' />)}
          </div>
        )}
        {error && <EmptyState title='Could not load the team' text={error} tone='red' />}
        {!loading && !error && !items.length && <EmptyState title='Team coming soon' />}
        {names.map((g, gi) => (
          <div key={g}>
            <div className='flex items-center gap-3 mb-6'>
              <h2 className='title-2'>{g}</h2>
              <span className='pill'>{groups[g].length}</span>
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5'>
              {groups[g].map((m, i) => (
                <article key={m._id} className='card lift flex flex-col'>
                  <div className='aspect-square border-b-2 border-[var(--outline)] overflow-hidden' style={{ background: TONES[(gi + i) % 4] }}>
                    <Img src={sized(m.image?.url, 480) || '/user.svg'} fallbacks={[m.image?.url, '/user.svg'].filter(Boolean)} srcSet={m.image?.url ? `${sized(m.image.url, 240)} 240w, ${sized(m.image.url, 480)} 480w` : undefined} sizes='(min-width: 1024px) 240px, 45vw' alt={m.name} loading='lazy' decoding='async' width='300' height='300' className='w-full h-full object-cover' />
                  </div>
                  <div className='p-4 flex flex-col gap-2 flex-1'>
                    <p className='font-medium leading-snug'>{m.name}</p>
                    <p className='mono text-xs text-[var(--muted)]'>{m.role}</p>
                    <div className='flex flex-wrap gap-2 mt-auto pt-2'>
                      <IconLink name='profile' label='Open profile page' to={m.memberId ? `/members/${m.memberId}` : undefined} />
                      <IconLink name='website' label='Website' href={m.website} />
                      <IconLink name='linkedin' label='LinkedIn' href={m.linkedin} />
                      <IconLink name='github' label='GitHub' href={m.github} />
                      <IconLink name='twitter' label='X' href={m.twitter} />
                      <IconLink name='instagram' label='Instagram' href={m.instagram} />
                      <IconLink name='community' label='GDG community profile' href={m.profile} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
