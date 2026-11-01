import { useEffect, useRef, useState } from 'react'

/**
 * Renders children only once the placeholder is close to the viewport. Keeps the first load light:
 * below-the-fold code, images and API calls start when the visitor actually scrolls toward them.
 */
export default function LazyMount ({ children, minHeight = '60vh', rootMargin = '600px' }) {
  const ref = useRef(null)
  const [show, setShow] = useState(typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (show) return undefined
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setShow(true); io.disconnect() }
    }, { rootMargin })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [show, rootMargin])
  return show ? children : <div ref={ref} style={{ minHeight }} aria-hidden='true' />
}
