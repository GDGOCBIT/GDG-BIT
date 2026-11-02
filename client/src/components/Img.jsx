import { useEffect, useRef, useState } from 'react'

/** <img> that fades in once it has loaded (instantly if it was already cached). Put a background on the parent. */
export default function Img ({ className = '', onLoad, onError, alt = '', ...props }) {
  const ref = useRef(null)
  const [ok, setOk] = useState(false)
  useEffect(() => {
    setOk(!!(ref.current && ref.current.complete && ref.current.naturalWidth))
  }, [props.src])
  return (
    <img ref={ref} alt={alt} decoding='async' {...props} className={`${className} img-fade${ok ? ' is-in' : ''}`}
      onLoad={e => { setOk(true); onLoad?.(e) }} onError={e => { setOk(true); onError?.(e) }} />
  )
}
