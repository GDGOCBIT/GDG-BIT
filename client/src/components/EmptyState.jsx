import { Dots } from './Brand'

export default function EmptyState ({ title, text, tone = 'blue', children }) {
  return (
    <div className={`band band-${tone} p-8 sm:p-10 flex flex-col items-center text-center gap-3`}>
      <Dots color={`var(--${tone === 'red' ? 'red' : tone})`} size={20} />
      <p className='text-xl font-medium'>{title}</p>
      {text && <p className='text-[var(--muted)] max-w-md'>{text}</p>}
      {children}
    </div>
  )
}
