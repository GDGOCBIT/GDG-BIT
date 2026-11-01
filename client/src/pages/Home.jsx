import { lazy, Suspense } from 'react'
import useApi from '../utils/useApi'
import useSettings from '../utils/useSettings'
import Hero from '../components/Hero'
import Marquee from '../components/Marquee'
import LazyMount from '../components/LazyMount'

// Everything under the hero is a separate chunk that is only fetched when the visitor scrolls near it.
const HomeBelow = lazy(() => import('./HomeBelow'))

export default function Home () {
  const { members } = useSettings()
  const { items: events, loading, error } = useApi('/events')
  const { items: team } = useApi('/team')

  return (
    <>
      <Hero events={events} team={team.length} members={members} />
      <Marquee />
      <LazyMount>
        <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
          <HomeBelow events={events} team={team} members={members} loading={loading} error={error} />
        </Suspense>
      </LazyMount>
    </>
  )
}
