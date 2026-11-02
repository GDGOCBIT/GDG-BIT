import { FaDiscord, FaGithub, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'
import { LuMail } from 'react-icons/lu'

// One place for every brand / contact icon on the site, so they all come from the same library and colours.
const ICONS = {
  instagram: [FaInstagram, '#e4405f'],
  linkedin: [FaLinkedinIn, '#0a66c2'],
  github: [FaGithub, '#181717'],
  discord: [FaDiscord, '#5865f2'],
  x: [FaXTwitter, '#000000'],
  twitter: [FaXTwitter, '#000000'],
  youtube: [FaYoutube, '#ff0000'],
  email: [LuMail, '#ea4335'],
  google: [FcGoogle, undefined]
}

/** Icon for a platform key (instagram, github, community…). `community` is the GDG mark. */
export default function SocialIcon ({ name, className = 'w-5 h-5', fallback }) {
  const entry = ICONS[name]
  if (entry) {
    const [Icon, color] = entry
    return <Icon className={className} style={color ? { color } : undefined} aria-hidden='true' />
  }
  if (name === 'community') return <img src='/brand/gdg-mark-256.png' alt='' className={`${className} object-contain`} />
  return fallback ? <img src={fallback} alt='' className={`${className} object-contain`} /> : null
}
