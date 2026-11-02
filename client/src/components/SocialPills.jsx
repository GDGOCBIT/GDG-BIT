import IconLink from './IconLink'

const LABELS = { website: 'Website', linkedin: 'LinkedIn', github: 'GitHub', twitter: 'X', instagram: 'Instagram' }

/** Row of round icon links from an { website, linkedin, ... } object. Empty values are skipped. */
export default function SocialPills ({ links = {}, className = '' }) {
  const list = Object.keys(LABELS).filter(k => links[k])
  if (!list.length) return null
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {list.map(k => <IconLink key={k} name={k} label={LABELS[k]} href={links[k]} />)}
    </div>
  )
}
