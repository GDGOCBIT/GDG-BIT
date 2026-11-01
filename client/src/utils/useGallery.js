import useApi from './useApi'

/** Photos uploaded by admins + event posters from the GDG page, as one list. */
export default function useGallery () {
  const photos = useApi('/gallery')
  const events = useApi('/events')
  const items = [
    ...photos.items.map(p => ({ id: p._id, kind: 'photo', src: p.url, thumb: p.thumbUrl, title: p.title || p.event || 'Event photo', caption: p.caption || p.event, w: p.width, h: p.height })),
    ...events.items.filter(e => e.image?.url).map(e => ({ id: e._id, kind: 'poster', src: e.image.url, thumb: e.image.url, title: e.title, caption: '', link: e.link, w: 1, h: 1 }))
  ]
  return { items, photoCount: photos.items.length, loading: photos.loading || events.loading, error: photos.error && events.error }
}
