import { Link } from 'react-router-dom'
import SocialIcon from './SocialIcon'

const base = 'w-9 h-9 rounded-full bg-white border-2 border-[var(--outline)] flex items-center justify-center shrink-0 transition-colors hover:bg-[var(--sunken)] focus-visible:bg-[var(--sunken)]'

/** Round icon button for a link (external) or a page on this site (`to`). `name` picks the icon, `label` is the tooltip. */
export default function IconLink ({ name, label, href, to }) {
  if (!href && !to) return null
  const icon = <SocialIcon name={name} className='w-[1.1rem] h-[1.1rem]' />
  return to
    ? <Link to={to} className={base} aria-label={label} title={label}>{icon}</Link>
    : <a href={href} target='_blank' rel='noreferrer noopener' className={base} aria-label={label} title={label}>{icon}</a>
}
