const mongoose = require('mongoose');

// Event photos. Stored in MongoDB (full size + thumbnail, both compressed in the browser before upload).
const GallerySchema = mongoose.Schema({
    title: { type: String, trim: true, default: '' },
    caption: { type: String, trim: true, default: '' },
    event: { type: String, trim: true, default: '' }, // which event the photo is from
    width: Number,
    height: Number,
    mime: { type: String, default: 'image/jpeg' },
    image: { type: Buffer, select: false },
    thumb: { type: Buffer, select: false },
    // resized copies (WebP/JPEG) kept after the first request so they are never re-generated, even after a deploy
    variants: { type: [{ key: String, data: Buffer }], select: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GalleryItem', GallerySchema);
