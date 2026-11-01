import EventCard from './EventCard'
import EmptyState from './EmptyState'

export default function EventGrid ({ events = [], loading, error, empty, count = 3 }) {
  if (loading)
    return (
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className='card h-[22rem] skeleton' />
        ))}
      </div>
    )
  if (error) return <EmptyState title='Could not load events' text={error} tone='red' />
  if (!events.length) return <EmptyState title={empty || 'Nothing here yet'} />
  return (
    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
      {events.map((e, i) => <EventCard key={e._id} event={e} index={i} />)}
    </div>
  )
}
