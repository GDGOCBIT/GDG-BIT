const mongoose = require('mongoose');

const TeamSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true }, // e.g. "Lead", "Web Developer"
    team: { type: String, default: 'Core' }, // grouping: Core, Tech, Design, ...
    order: { type: Number, default: 100 },
    image: { public_id: String, url: String },
    linkedin: String,
    github: String,
    twitter: String,
});

module.exports = mongoose.model('TeamMember', TeamSchema);
