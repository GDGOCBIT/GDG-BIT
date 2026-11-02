// Photos on Cloudinary (event posters, member avatars) are often stored at full size. Ask for the size
// actually shown; WebP/AVIF is picked automatically from the browser's Accept header. Other URLs are untouched.

export const sized = (url, width) => {
  if (!url || !/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) return url
  const t = `c_limit,w_${width},f_auto,q_auto:good`
  const m = url.match(/^(.*?\/image\/upload\/)(.*)$/)
  const rest = m[2]
  // already has a transformation segment (anything before the v123 version): replace it, otherwise insert ours
  return /^v\d+\//.test(rest) ? `${m[1]}${t}/${rest}` : `${m[1]}${t}/${rest.replace(/^[^/]+\//, '')}`
}
