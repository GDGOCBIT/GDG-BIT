import { useEffect, useRef, useState } from 'react'

/**
 * <img> that fades in once it has loaded (instantly if it was already cached). Put a background on the parent.
 * `fallbacks`: other URLs to try, in order, if the picture fails to load (e.g. the original, then a placeholder),
 * so a bad link never shows as a broken-image icon.
 */
export default function Img ({ className = '', onLoad, onError, alt = '', src, srcSet, fallbacks = [], ...props }) {
  const ref = useRef(null)
  const [ok, setOk] = useState(false)
  const [tried, setTried] = useState(0) // how many fallbacks have been used
  useEffect(() => { setTried(0) }, [src])
  useEffect(() => {
    setOk(!!(ref.current && ref.current.complete && ref.current.naturalWidth))
  }, [src, tried])
  const failed = tried > 0
  return (
    <img ref={ref} alt={alt} decoding='async' {...props} src={failed ? fallbacks[tried - 1] : src} srcSet={failed ? undefined : srcSet}
      className={`${className} img-fade${ok ? ' is-in' : ''}`}
      onLoad={e => { setOk(true); onLoad?.(e) }}
      onError={e => {
        if (tried < fallbacks.length) setTried(tried + 1)
        else { setOk(true); onError?.(e) }
      }} />
  )
}
