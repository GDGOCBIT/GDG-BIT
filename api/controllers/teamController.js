const Certificate = require('../models/certModel.js');
const CertTemplate = require('../models/certTemplateModel.js');
const TeamOverride = require('../models/teamOverrideModel.js');
const User = require('../models/userModel.js');
const { mergedTeam, cleanLink, keyOf, LINKS, TEXT } = require('../services/team.js');
const { serverError } = require('../utils/crudFactory.js');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LABELS = { website: 'Website', linkedin: 'LinkedIn', github: 'GitHub', twitter: 'X', instagram: 'Instagram' };

const findAccount = (email) => User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
const writeLinks = (acct, set, unset) => {
    LINKS.forEach((f) => {
        if (set[f]) acct.set(`links.${f}`, set[f]);
        else if (unset[f] !== undefined) acct.set(`links.${f}`, undefined);
    });
};

// Validates the link fields in `body`; returns { set, unset } for a Mongo update, or { error }.
const readLinks = (body) => {
    const set = {}; const unset = {};
    for (const f of LINKS) {
        if (body[f] === undefined) continue;
        const v = cleanLink(f, body[f]);
        if (v === null) return { error: `${LABELS[f]}: that doesn't look like a valid link!` };
        if (v) set[f] = v; else unset[f] = '';
    }
    return { set, unset };
};

const apply = async (key, set, unset) => {
    const update = { $set: { ...set, updatedAt: new Date() } };
    if (Object.keys(unset).length) update.$unset = unset;
    return TeamOverride.findOneAndUpdate({ key }, { ...update, $setOnInsert: { key } }, { upsert: true, new: true });
};

// ---- admin: everyone on the team, with what is overridden
exports.adminList = async (req, res) => {
    try { res.status(200).json({ success: true, items: await mergedTeam({ admin: true }) }); } catch (e) { serverError(res, e); }
};

exports.adminSave = async (req, res) => {
    try {
        const key = keyOf(req.params.key);
        const team = await mergedTeam();
        if (!team.some((m) => m.key === key)) return res.status(404).json({ success: false, msg: 'Team member not found!' });
        const { set, unset, error } = readLinks(req.body);
        if (error) return res.status(400).json({ success: false, msg: error });
        for (const f of TEXT) {
            if (req.body[f] === undefined) continue;
            const v = String(req.body[f]).trim().slice(0, 80);
            if (v) set[f] = v; else unset[f] = '';
        }
        if (req.body.userEmail !== undefined) {
            const email = String(req.body.userEmail).trim().toLowerCase();
            if (email) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, msg: 'That email address is not valid!' });
                if (await TeamOverride.exists({ userEmail: email, key: { $ne: key } })) return res.status(400).json({ success: false, msg: 'That account is already linked to another team member!' });
                set.userEmail = email;
            } else unset.userEmail = '';
        }
        const existing = await TeamOverride.findOne({ key }).lean();
        await apply(key, set, unset);
        // Keep the account's public page in sync with the card: they share one set of links.
        const linkedEmail = set.userEmail || (unset.userEmail === undefined ? existing?.userEmail : '');
        const acct = linkedEmail ? await findAccount(linkedEmail) : null;
        if (acct) {
            writeLinks(acct, set, unset);
            if (set.userEmail && existing?.userEmail !== set.userEmail) { // newly linked: bring the card's current links over
                const card = team.find((m) => m.key === key);
                LINKS.forEach((f) => { if (!acct.links?.[f] && card?.[f]) acct.set(`links.${f}`, card[f]); });
            }
            await acct.save();
        }
        res.status(200).json({ success: true, msg: 'Team card saved!' });
    } catch (e) { serverError(res, e); }
};

exports.adminReset = async (req, res) => {
    try {
        await TeamOverride.deleteOne({ key: keyOf(req.params.key) });
        res.status(200).json({ success: true, msg: 'Back to the original details!' });
    } catch (e) { serverError(res, e); }
};

// ---- a lead editing their own links (only if an admin linked their account to a card)
const myOverride = (user) => TeamOverride.findOne({ userEmail: String(user.email || '').toLowerCase() }).lean();

exports.myCard = async (req, res) => {
    try {
        const o = await myOverride(req.user);
        if (!o) return res.status(200).json({ success: true, linked: false });
        const member = (await mergedTeam()).find((m) => m.key === o.key);
        if (!member) return res.status(200).json({ success: true, linked: false });
        const { name, role, team, image } = member;
        res.status(200).json({ success: true, linked: true, member: { key: member.key, name, role, team, image, ...Object.fromEntries(LINKS.map((f) => [f, req.user.links?.[f] || member[f] || ''])) } });
    } catch (e) { serverError(res, e); }
};

exports.mySaveCard = async (req, res) => {
    try {
        const o = await myOverride(req.user);
        if (!o) return res.status(403).json({ success: false, msg: 'Your account is not linked to a team card. Ask an admin to link it.' });
        const { set, unset, error } = readLinks(req.body);
        if (error) return res.status(400).json({ success: false, msg: error });
        // the links live on the account, so the public member page and the team card always match
        writeLinks(req.user, set, unset);
        await req.user.save();
        res.status(200).json({ success: true, msg: 'Your links are updated on your team card and your public page!' });
    } catch (e) { serverError(res, e); }
};

// ---- certificates issued to the signed-in member (matched on their verified email)
exports.myCertificates = async (req, res) => {
    try {
        const email = String(req.user.email || '').trim();
        if (!email) return res.status(200).json({ success: true, items: [] });
        const certs = await Certificate.find({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') })
            .select('fullName certificate appreciation templateId createdAt').sort({ createdAt: -1 }).lean();
        const ids = [...new Set(certs.map((c) => c.templateId).filter(Boolean))];
        const templates = ids.length ? await CertTemplate.find({ _id: { $in: ids } }).select('name').lean() : [];
        const names = new Map(templates.map((t) => [String(t._id), t.name]));
        res.status(200).json({
            success: true,
            items: certs.map((c) => ({ _id: c._id, fullName: c.fullName, title: names.get(c.templateId) || c.certificate || 'Certificate', appreciation: c.appreciation, createdAt: c.createdAt })),
        });
    } catch (e) { serverError(res, e); }
};
