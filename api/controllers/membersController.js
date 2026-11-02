const User = require('../models/userModel.js');
const Certificate = require('../models/certModel.js');
const CertTemplate = require('../models/certTemplateModel.js');
const TeamOverride = require('../models/teamOverrideModel.js');
const { cleanLink, LINKS, mergedTeam, GROUPS } = require('../services/team.js');
const { serverError, removeImage } = require('../utils/crudFactory.js');
const { userIsAdmin } = require('../middleware/auth.js');

const LABELS = { website: 'Website', linkedin: 'LinkedIn', github: 'GitHub', twitter: 'X', instagram: 'Instagram' };
const PUBLIC = { isVerified: true, isPrivate: { $ne: true }, hiddenByAdmin: { $ne: true }, firstName: { $exists: true, $ne: '' } };
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isId = (id) => /^[a-f\d]{24}$/i.test(String(id));

const linksOf = (u) => Object.fromEntries(LINKS.map((f) => [f, u.links?.[f] || '']).filter(([, v]) => v));
// Never includes the email. That stays private.
const view = (u) => ({
    _id: u._id, name: [u.firstName, u.lastName].filter(Boolean).join(' '), avatar: u.avatar?.url || '',
    bio: u.showBio === false ? '' : u.bio || '', links: u.showLinks === false ? {} : linksOf(u), joinedOn: u.joinedOn,
});

// email -> { role, team, key } for accounts an admin linked to an organizer / lead card
const leadMap = async () => {
    const linked = await TeamOverride.find({ userEmail: { $exists: true, $ne: '' } }).select('key userEmail').lean();
    if (!linked.length) return new Map();
    const team = await mergedTeam();
    const byKey = new Map(team.map((m) => [m.key, m]));
    return new Map(linked.filter((o) => byKey.has(o.key)).map((o) => {
        const m = byKey.get(o.key);
        return [o.userEmail, { key: o.key, role: m.role, team: m.team }];
    }));
};

// Team badge for a user: a linked GDG card wins, otherwise the role an admin set directly.
const leadOf = (u, leads) =>
    leads.get(String(u.email || '').toLowerCase()) || (u.teamGroup ? { role: u.teamRole || u.teamGroup, team: u.teamGroup } : null);

const certsFor = async (email) => {
    const certs = await Certificate.find({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') })
        .select('certificate templateId createdAt').sort({ createdAt: -1 }).lean();
    const ids = [...new Set(certs.map((c) => c.templateId).filter(Boolean))];
    const tpl = ids.length ? await CertTemplate.find({ _id: { $in: ids } }).select('name').lean() : [];
    const names = new Map(tpl.map((t) => [String(t._id), t.name]));
    return certs.map((c) => ({ _id: c._id, title: names.get(c.templateId) || c.certificate || 'Certificate', createdAt: c.createdAt }));
};

// ---- public
exports.list = async (req, res) => {
    try {
        const users = await User.find(PUBLIC).select('firstName lastName avatar bio links joinedOn email showCerts showBio showLinks teamGroup teamRole').sort({ joinedOn: -1 }).limit(500).lean();
        const counts = await Certificate.aggregate([{ $group: { _id: { $toLower: '$email' }, n: { $sum: 1 } } }]);
        const byEmail = new Map(counts.map((c) => [c._id, c.n]));
        const leads = await leadMap();
        const items = users.map((u) => ({ ...view(u), lead: leadOf(u, leads), certificates: u.showCerts === false ? 0 : byEmail.get(String(u.email || '').toLowerCase()) || 0 }));
        res.status(200).json({ success: true, items });
    } catch (e) { serverError(res, e); }
};

exports.get = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(404).json({ success: false, msg: 'Member not found!' });
        const u = await User.findOne({ _id: req.params.id, ...PUBLIC }).select('firstName lastName avatar bio links joinedOn email showCerts showBio showLinks teamGroup teamRole').lean();
        if (!u) return res.status(404).json({ success: false, msg: 'This profile is private or does not exist.' });
        const certificates = u.showCerts === false || !u.email ? [] : await certsFor(u.email);
        const lead = leadOf(u, await leadMap());
        res.status(200).json({ success: true, member: { ...view(u), lead, certificates, certsHidden: u.showCerts === false } });
    } catch (e) { serverError(res, e); }
};

// ---- the signed-in member's own page settings
const mine = (u) => ({ bio: u.bio || '', links: Object.fromEntries(LINKS.map((f) => [f, u.links?.[f] || ''])), isPrivate: !!u.isPrivate, showCerts: u.showCerts !== false, showBio: u.showBio !== false, showLinks: u.showLinks !== false, hiddenByAdmin: !!u.hiddenByAdmin, _id: u._id });

exports.myGet = async (req, res) => res.status(200).json({ success: true, profile: mine(req.user) });

const apply = (user, body) => {
    if (body.bio !== undefined) user.bio = String(body.bio).trim().slice(0, 240);
    for (const f of LINKS) {
        if (body.links?.[f] === undefined) continue;
        const v = cleanLink(f, body.links[f]);
        if (v === null) return `${LABELS[f]}: that doesn't look like a valid link!`;
        user.set(`links.${f}`, v || undefined);
    }
    return '';
};

exports.mySave = async (req, res) => {
    try {
        const err = apply(req.user, req.body);
        if (err) return res.status(400).json({ success: false, msg: err });
        if (req.body.isPrivate !== undefined) req.user.isPrivate = !!req.body.isPrivate;
        if (req.body.showCerts !== undefined) req.user.showCerts = !!req.body.showCerts;
        if (req.body.showBio !== undefined) req.user.showBio = !!req.body.showBio;
        if (req.body.showLinks !== undefined) req.user.showLinks = !!req.body.showLinks;
        await req.user.save();
        res.status(200).json({ success: true, msg: req.user.isPrivate ? 'Saved. Your page is private.' : 'Saved! Your public page is up to date.', profile: mine(req.user) });
    } catch (e) { serverError(res, e); }
};

// ---- admin override: hide anyone from the public pages, or fix their bio / links
exports.adminList = async (req, res) => {
    try {
        const users = await User.find({ isVerified: true }).select('firstName lastName email avatar bio links isPrivate showCerts showBio showLinks hiddenByAdmin joinedOn teamGroup teamRole').sort({ joinedOn: -1 }).limit(1000).lean();
        const leads = await leadMap();
        res.status(200).json({ success: true, items: users.map((u) => ({ ...view(u), bio: u.bio || '', email: u.email, lead: leadOf(u, leads), teamGroup: u.teamGroup || '', teamRole: u.teamRole || '', isPrivate: !!u.isPrivate, hiddenByAdmin: !!u.hiddenByAdmin, links: Object.fromEntries(LINKS.map((f) => [f, u.links?.[f] || ''])) })) });
    } catch (e) { serverError(res, e); }
};

exports.adminSave = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(404).json({ success: false, msg: 'Member not found!' });
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, msg: 'Member not found!' });
        const err = apply(user, req.body);
        if (err) return res.status(400).json({ success: false, msg: err });
        if (req.body.hiddenByAdmin !== undefined) user.hiddenByAdmin = !!req.body.hiddenByAdmin;
        if (req.body.teamGroup !== undefined) {
            if (req.body.teamGroup && !GROUPS.includes(req.body.teamGroup)) return res.status(400).json({ success: false, msg: 'Choose Organizer, Lead or Core.' });
            user.teamGroup = req.body.teamGroup || undefined;
            if (!user.teamGroup) user.teamRole = undefined;
        }
        if (req.body.teamRole !== undefined && user.teamGroup) user.teamRole = String(req.body.teamRole).trim().slice(0, 80) || undefined;
        await user.save();
        res.status(200).json({ success: true, msg: 'Member updated!' });
    } catch (e) { serverError(res, e); }
};

// Deletes an account for good. Certificates already issued to the email are kept (they are records, and
// the verify links must keep working). Admins have to be demoted first, and you cannot delete yourself.
exports.adminRemove = async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(404).json({ success: false, msg: 'Member not found!' });
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, msg: 'Member not found!' });
        if (String(user._id) === String(req.user._id)) return res.status(400).json({ success: false, msg: 'You cannot delete your own account here.' });
        if (await userIsAdmin(user)) return res.status(400).json({ success: false, msg: 'This person is an admin. Remove their admin access first.' });
        await removeImage(user.avatar);
        if (user.email) await TeamOverride.updateMany({ userEmail: user.email.toLowerCase() }, { $unset: { userEmail: '' } });
        await user.deleteOne();
        res.status(200).json({ success: true, msg: 'Member deleted.' });
    } catch (e) { serverError(res, e); }
};
