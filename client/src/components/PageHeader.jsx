import { BraceTag, Globe, Dots } from './Brand'

/** Pastel banner at the top of inner pages. */
export default function PageHeader ({ tag, title, text, tone = 'blue', dot = 'var(--blue)', children }) {
  return (
    <section className='wrap page-top'>
      <div className={`band band-${tone} relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14`}>
        <div className='relative z-10 max-w-2xl flex flex-col gap-4'>
          {tag && <BraceTag>{tag}</BraceTag>}
          <h1 className='title-1'>{title}</h1>
          {text && <p className='lead'>{text}</p>}
          {children}
        </div>
        <Globe size={150} className='absolute -right-6 -bottom-8 opacity-90 max-sm:hidden' />
        <Dots color={dot} size={22} className='absolute right-10 top-8 max-md:hidden' />
      </div>
    </section>
  )
}
