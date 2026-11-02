const mongoose = require('mongoose');

// Single document holding site-wide settings edited from the admin dashboard.
const SettingsSchema = mongoose.Schema({
    key: { type: String, default: 'site', unique: true },
    socials: { type: Map, of: String, default: {} },   // platform key -> url ('' hides the link)
    adminEmails: { type: [String], default: [] },     // emails granted admin before they have an account
    revokedEmails: { type: [String], default: [] },   // ADMIN_EMAILS owners an admin removed from the website (never the first one)
    membersOverride: { type: Number, default: null },  // null = use the live count from gdg.community.dev
});

module.exports = mongoose.model('Settings', SettingsSchema);
