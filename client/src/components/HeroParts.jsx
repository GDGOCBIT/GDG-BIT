/** Little pulsing green "live" dot. `keep` marks the one pulse that stays animated on phones. */
export const Live = ({ keep = false }) => (
  <span className={`relative flex w-2 h-2 shrink-0${keep ? ' keep-ping' : ''}`} aria-hidden='true'>
    <span className='absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping' />
    <span className='relative inline-flex w-2 h-2 rounded-full bg-emerald-500' />
  </span>
)
