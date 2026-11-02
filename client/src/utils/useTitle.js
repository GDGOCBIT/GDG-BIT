import { useEffect } from 'react'

const BASE = 'GDG on Campus · Bengal Institute of Technology'

/** Sets the browser tab title for a page (and restores the default when leaving it). */
export default function useTitle (title) {
  useEffect(() => {
    if (title) document.title = `${title} · GDG on Campus BIT`
    return () => { document.title = BASE }
  }, [title])
}
