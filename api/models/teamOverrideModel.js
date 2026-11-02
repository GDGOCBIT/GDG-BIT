const mongoose = require('mongoose');

// Admin / lead edits layered on top of a team member that comes from gdg.community.dev (or the local list).
// `key` is the member's original name, lower-cased. Only the fields that are set replace the original data.
const TeamOverrideSchema = mongoose.Schema({
    key: { type: String, required: true, unique: true },
    name: String,
    role: String,
    team: String,
    website: String,
    linkedin: String,
    github: String,
    twitter: String,
    instagram: String,
    // The website account allowed to edit this card's links from its own profile page (set by an admin).
    userEmail: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TeamOverride', TeamOverrideSchema);
