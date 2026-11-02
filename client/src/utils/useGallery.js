import useApi from './useApi'
import { sized } from './images'

const widths = (make, list) => list.map(w => `${make(w)} ${w}w`).join(', ')
const base = u => String(u || '').split('?')[0]

/** Photos uploaded by admins + event posters from the GDG page, as one list. */
export default function useGallery () {
  const photos = useApi('/gallery')
  const events = useApi('/events')
  const items = [
    ...photos.items.map(p => ({ id: p._id, kind: 'photo', src: p.url, thumb: p.thumbUrl, srcSet: widths(w => `${base(p.thumbUrl)}?w=${w}`, [240, 480, 720]), title: p.title || p.event || 'Event photo', caption: p.caption || p.event, w: p.width, h: p.height })),
    ...events.items.filter(e => e.image?.url).map(e => ({ id: e._id, kind: 'poster', src: sized(e.image.url, 1400), thumb: sized(e.image.url, 640), srcSet: widths(w => sized(e.image.url, w), [320, 640, 960]), title: e.title, caption: '', link: e.link, w: 1, h: 1 }))
  ]
  return { items, photoCount: photos.items.length, loading: photos.loading || events.loading, error: photos.error && events.error }
}
