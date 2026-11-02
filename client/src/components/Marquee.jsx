const TOPICS = ['Android', 'Flutter', 'Firebase', 'Gemini', 'Google Cloud', 'Web', 'AI / ML', 'Open source', 'UI / UX', 'DSA', 'CTF', 'Hackathons', 'Study Jams']
const DOT = ['var(--blue)', 'var(--red)', 'var(--yellow)', 'var(--green)']

function Band ({ items, rev, t, tone }) {
  // two identical halves (each long enough to cover a wide screen) so the -50% loop is seamless
  const half = [...items, ...items]
  const list = [...half, ...half]
  return (
    <div className={`marquee-band marquee-wrap ${tone}`}>
      <div className={`marquee ${rev ? 'rev' : ''}`} style={{ '--t': t }} aria-hidden='true'>
        {list.map((w, i) => (
          <span key={i} className='flex items-center gap-5 pr-5 text-2xl sm:text-4xl font-medium whitespace-nowrap'>
            {w}
            <svg width='22' height='22' viewBox='0 0 24 24' className='shrink-0' style={{ color: tone === 'marquee-b' ? 'var(--black)' : DOT[i % 4] }}>
              <path d='M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6z' fill='currentColor' />
            </svg>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Two tilted bands of topics that cross in an X, scrolling in opposite directions. */
export default function Marquee () {
  return (
    <section aria-label='What we explore' className='marquee-x'>
      <Band items={TOPICS} t='70s' tone='marquee-a' />
      <Band items={[...TOPICS].reverse()} rev t='80s' tone='marquee-b' />
    </section>
  )
}
