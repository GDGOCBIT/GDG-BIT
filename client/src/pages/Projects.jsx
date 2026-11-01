import useApi from '../utils/useApi'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

const TONES = ['band-blue', 'band-red', 'band-yellow', 'band-green']

export default function Projects () {
  const { items, loading, error } = useApi('/projects')
  return (
    <>
      <PageHeader tag='Projects' title={<>Things our community <b>has built</b></>}
        text='Open-source projects from members and the core team. Want yours here? Talk to an organizer.' tone='red' dot='var(--red)' />
      <section className='wrap pt-10'>
        {loading && <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>{[0, 1, 2].map(i => <div key={i} className='card h-64 skeleton' />)}</div>}
        {error && <EmptyState title='Could not load projects' text={error} tone='red' />}
        {!loading && !error && !items.length && (
          <EmptyState title='Projects coming soon'>
            <a className='btn btn-ink btn-sm' href='https://github.com/GDGOCBIT' target='_blank' rel='noreferrer'>See our GitHub</a>
          </EmptyState>
        )}
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {items.map((p, i) => (
            <article key={p._id} className='card lift flex flex-col'>
              {p.image?.url ? (
                <img src={p.image.url} alt='' loading='lazy' className='aspect-[16/9] w-full object-cover border-b-2 border-[var(--outline)]' />
              ) : (
                <div className={`band ${TONES[i % 4]} !rounded-none !border-0 border-b-2 aspect-[16/9] flex items-center justify-center`}
                  style={{ borderBottom: '2px solid var(--outline)' }}>
                  <span className='mono text-2xl sm:text-3xl px-4 text-center break-all'>{'{ '}{p.title}{' }'}</span>
                </div>
              )}
              <div className='p-5 flex flex-col gap-3 flex-1'>
                <div className='flex items-start justify-between gap-3'>
                  <h3 className='text-lg font-medium'>{p.title}</h3>
                  {p.stars > 0 && <span className='pill shrink-0'>★ {p.stars}</span>}
                </div>
                {p.description && <p className='text-sm text-[var(--muted)] flex-1'>{p.description}</p>}
                {!!p.tags?.length && (
                  <div className='flex flex-wrap gap-1.5'>{p.tags.map(t => <span key={t} className='pill'>{t}</span>)}</div>
                )}
                <div className='flex flex-wrap gap-2 pt-1 mt-auto'>
                  {p.repoLink && <a className='btn btn-ghost btn-sm' href={p.repoLink} target='_blank' rel='noreferrer'>Code</a>}
                  {p.demoLink && <a className='btn btn-ink btn-sm' href={p.demoLink} target='_blank' rel='noreferrer'>Live demo</a>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
