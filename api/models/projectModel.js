const mongoose = require('mongoose');

const ProjectSchema = mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    tags: [String],
    repoLink: String,
    demoLink: String,
    image: { public_id: String, url: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', ProjectSchema);
