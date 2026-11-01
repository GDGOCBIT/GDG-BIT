const GalleryItem = require('../models/galleryModel.js');
const { serverError } = require('../utils/crudFactory.js');
const sharp = require('sharp');

// Widths the site is allowed to ask for (anything else is rounded up to the next one).
const WIDTHS = [240, 480, 720, 1200, 1600];

const OK_TYPES = /^image\/(jpeg|png|webp)$/;
const view = (g) => ({
    _id: g._id, title: g.title, caption: g.caption, event: g.event, width: g.width, height: g.height, createdAt: g.createdAt,
    url: `/api/gallery/${g._id}/image?w=1400`, thumbUrl: `/api/gallery/${g._id}/image?w=480`,
});

// ---- public
exports.list = async (req, res) => {
    try {
        const items = await GalleryItem.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, items: items.map(view) });
    } catch (e) { serverError(res, e); }
};

// Serves a photo at the size it will be shown (?w=480) and as WebP when the browser supports it.
// Responses are immutable and CDN-cacheable, so each size is only ever generated once.
exports.image = async (req, res) => {
    try {
        const g = await GalleryItem.findById(req.params.id).select('+image +thumb mime');
        if (!g) return res.status(404).end();
        const want = parseInt(req.query.w, 10);
        const forever = 'public, max-age=31536000, s-maxage=31536000, immutable';

        if (want > 0) {
            const w = WIDTHS.find((x) => x >= want) || WIDTHS[WIDTHS.length - 1];
            const src = w <= 700 && g.thumb?.length ? g.thumb : g.image;
            if (!src?.length) return res.status(404).end();
            const webp = /image\/webp/.test(req.headers.accept || '');
            try {
                const out = await sharp(src).rotate().resize({ width: w, withoutEnlargement: true })
                    [webp ? 'webp' : 'jpeg'](webp ? { quality: 76 } : { quality: 80, mozjpeg: true }).toBuffer();
                res.set({ 'Content-Type': webp ? 'image/webp' : 'image/jpeg', 'Cache-Control': forever, Vary: 'Accept' });
                return res.send(out);
            } catch (e) { /* fall through to the stored original */ }
        }

        const buf = req.query.size === 'thumb' && g.thumb?.length ? g.thumb : g.image;
        if (!buf?.length) return res.status(404).end();
        res.set({ 'Content-Type': g.mime || 'image/jpeg', 'Cache-Control': forever });
        res.send(buf);
    } catch (e) { res.status(404).end(); }
};

// ---- admin
exports.create = async (req, res) => {
    try {
        const file = req.files?.file?.[0];
        const thumb = req.files?.thumb?.[0];
        if (!file) return res.status(400).json({ success: false, msg: 'Choose a photo first!' });
        if (!OK_TYPES.test(file.mimetype) || (thumb && !OK_TYPES.test(thumb.mimetype))) {
            return res.status(400).json({ success: false, msg: 'Use JPG, PNG or WebP photos!' });
        }
        const g = await GalleryItem.create({
            title: req.body.title || '', caption: req.body.caption || '', event: req.body.event || '',
            width: Number(req.body.width) || undefined, height: Number(req.body.height) || undefined,
            mime: file.mimetype, image: file.buffer, thumb: thumb?.buffer || file.buffer,
        });
        res.status(201).json({ success: true, msg: 'Photo added!', item: view(g) });
    } catch (e) {
        if (e.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, msg: 'Photo is over 4 MB after compression!' });
        serverError(res, e);
    }
};

exports.update = async (req, res) => {
    try {
        const g = await GalleryItem.findById(req.params.id).select('title caption event width height createdAt');
        if (!g) return res.status(404).json({ success: false, msg: 'Photo not found!' });
        ['title', 'caption', 'event'].forEach((k) => { if (req.body[k] !== undefined) g[k] = String(req.body[k]).slice(0, 200); });
        await g.save();
        res.status(200).json({ success: true, msg: 'Photo updated!', item: view(g) });
    } catch (e) { serverError(res, e); }
};

exports.remove = async (req, res) => {
    try {
        const g = await GalleryItem.findByIdAndDelete(req.params.id);
        if (!g) return res.status(404).json({ success: false, msg: 'Photo not found!' });
        res.status(200).json({ success: true, msg: 'Photo deleted!' });
    } catch (e) { serverError(res, e); }
};
