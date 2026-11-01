// Event posters live on Cloudinary at full retina size. Ask for the size actually shown (WebP/AVIF is
// chosen automatically by Cloudinary from the browser's Accept header); other URLs are left untouched.
const CLD = /(res\.cloudinary\.com\/[^/]+\/image\/upload\/)[^/]+\//

export const sized = (url, width) =>
  url && CLD.test(url) ? url.replace(CLD, `$1c_limit,w_${width},f_auto,q_auto:good/`) : url
