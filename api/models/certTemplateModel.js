const mongoose = require('mongoose');

// A blank certificate design: background image + where each element goes (positions/sizes are % of image width).
const CertTemplateSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    // Blank certificate image: stored in MongoDB (not a third-party host) so certificates can always be drawn.
    image: { public_id: String, url: String },
    imageData: { type: Buffer, select: false },
    imageType: String,
    width: { type: Number, required: true },  // natural pixel size of the uploaded image
    height: { type: Number, required: true },
    // [{ id, type: 'text'|'qr'|'id', key, label, x, y, size, color, font, weight, align, maxWidth }]
    fields: { type: [mongoose.Schema.Types.Mixed], default: [] },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CertTemplate', CertTemplateSchema);
