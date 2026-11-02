const LABELS = { website: 'Website', linkedin: 'LinkedIn', github: 'GitHub', twitter: 'X', instagram: 'Instagram' }

/** Row of link pills from an { website, linkedin, ... } object. Empty values are skipped. */
export default function SocialPills ({ links = {}, className = '' }) {
  const list = Object.keys(LABELS).filter(k => links[k])
  if (!list.length) return null
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {list.map(k => <a key={k} href={links[k]} target='_blank' rel='noreferrer noopener' className='pill hover:bg-[var(--sunken)]'>{LABELS[k]}</a>)}
    </div>
  )
}
