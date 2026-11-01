const TOPICS = ['Android', 'Flutter', 'Firebase', 'Gemini', 'Google Cloud', 'Web', 'AI / ML', 'Open source', 'UI / UX', 'DSA', 'CTF', 'Hackathons', 'Study Jams']
const DOT = ['var(--blue)', 'var(--red)', 'var(--yellow)', 'var(--green)']

function Row ({ rev, items, t }) {
  const list = [...items, ...items]
  return (
    <div className='marquee-wrap overflow-hidden py-2.5'>
      <div className={`marquee ${rev ? 'rev' : ''}`} style={{ '--t': t }} aria-hidden='true'>
        {list.map((w, i) => (
          <span key={i} className='flex items-center gap-5 pr-5 text-2xl sm:text-4xl font-medium whitespace-nowrap'>
            {w}
            <svg width='22' height='22' viewBox='0 0 24 24' className='shrink-0' style={{ color: DOT[i % 4] }}>
              <path d='M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6z' fill='currentColor' />
            </svg>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Two counter-scrolling rows of topics on a black band. */
export default function Marquee () {
  return (
    <section aria-label='What we explore' className='my-6 border-y-2 border-[var(--outline)] bg-[var(--black)] text-[var(--offwhite)] overflow-hidden'>
      <Row items={TOPICS} t='55s' />
      <div className='border-t border-white/15' />
      <Row items={[...TOPICS].reverse()} rev t='65s' />
    </section>
  )
}
