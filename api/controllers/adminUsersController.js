const User = require('../models/userModel.js');
const Settings = require('../models/settingsModel.js');
const { ownerEmails, isOwnerEmail } = require('../middleware/auth.js');
const { serverError } = require('../utils/crudFactory.js');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const siteSettings = async () => (await Settings.findOne({ key: 'site' })) || new Settings({ key: 'site' });
const person = (u) => (u ? {
    name: [u.firstName, u.lastName].filter(Boolean).join(' '), avatar: u.avatar?.url || '', registered: !!u.isVerified,
} : { name: '', avatar: '', registered: false });

// Everyone with admin access: owners (ADMIN_EMAILS), people granted from the dashboard, and pending invites.
exports.list = async (req, res) => {
    try {
        const doc = await siteSettings();
        const granted = await User.find({ role: 'admin' }).select('email firstName lastName avatar isVerified');
        const emails = new Map(); // email -> source (owner wins over granted wins over invited)
        doc.adminEmails.forEach((e) => emails.set(e, 'invited'));
        granted.forEach((u) => u.email && emails.set(u.email.toLowerCase(), 'granted'));
        ownerEmails().forEach((e) => emails.set(e, 'owner'));

        const users = await User.find({ email: { $in: [...emails.keys()].map((e) => new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) } })
            .select('email firstName lastName avatar isVerified');
        const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
        const me = (req.user.email || '').toLowerCase();

        const order = { owner: 0, granted: 1, invited: 2 };
        const items = [...emails].map(([email, source]) => ({ email, source, you: email === me, ...person(byEmail.get(email)) }))
            .sort((a, b) => order[a.source] - order[b.source] || a.email.localeCompare(b.email));
        res.status(200).json({ success: true, items });
    } catch (e) { serverError(res, e); }
};

exports.add = async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!EMAIL.test(email)) return res.status(400).json({ success: false, msg: 'Enter a valid email address!' });
        if (isOwnerEmail(email)) return res.status(400).json({ success: false, msg: 'That email is already an owner!' });

        const user = await User.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).select('role');
        if (user) {
            if (user.role === 'admin') return res.status(400).json({ success: false, msg: 'That person is already an admin!' });
            user.role = 'admin';
            await user.save();
            return res.status(200).json({ success: true, msg: 'Admin access granted!' });
        }
        const doc = await siteSettings();
        if (doc.adminEmails.includes(email)) return res.status(400).json({ success: false, msg: 'That email is already invited!' });
        doc.adminEmails.push(email);
        await doc.save();
        res.status(200).json({ success: true, msg: 'Invited. They become an admin as soon as they sign up with this email.' });
    } catch (e) { serverError(res, e); }
};

exports.remove = async (req, res) => {
    try {
        const email = String(req.params.email || '').trim().toLowerCase();
        if (isOwnerEmail(email)) return res.status(400).json({ success: false, msg: 'Owners are set in the server settings (ADMIN_EMAILS) and cannot be removed here!' });
        if (email === String(req.user.email || '').toLowerCase()) return res.status(400).json({ success: false, msg: 'You cannot remove your own admin access!' });

        const doc = await siteSettings();
        const was = doc.adminEmails.includes(email);
        doc.adminEmails = doc.adminEmails.filter((e) => e !== email);
        const r = await User.updateMany({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), role: 'admin' }, { role: 'user' });
        if (!was && !r.modifiedCount) return res.status(404).json({ success: false, msg: 'That person is not an admin!' });
        await doc.save();
        res.status(200).json({ success: true, msg: 'Admin access removed!' });
    } catch (e) { serverError(res, e); }
};
