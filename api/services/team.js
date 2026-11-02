const TeamMember = require('../models/teamModel.js');
const TeamOverride = require('../models/teamOverrideModel.js');
const { getCommunityTeam } = require('./gdgCommunity.js');

const LINKS = ['website', 'linkedin', 'github', 'twitter', 'instagram'];
const TEXT = ['name', 'role', 'team'];
const keyOf = (name) => String(name || '').trim().toLowerCase();

// Turns whatever someone typed into a safe https link. '' means "no value"; null means invalid.
const cleanLink = (field, raw) => {
    let v = String(raw ?? '').trim();
    if (!v) return '';
    if (v.length > 300) return null;
    if (field === 'twitter' && !/^https?:\/\//i.test(v)) v = `https://x.com/${v.replace(/^@/, '')}`;
    if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
    try {
        const u = new URL(v);
        if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null;
        return u.toString().replace(/\/$/, '');
    } catch { return null; }
};

// Community + local members, with any overrides applied. `admin` adds the raw override and linked account.
const mergedTeam = async ({ admin = false } = {}) => {
    const [local, community, overrides] = await Promise.all([
        TeamMember.find().sort({ order: 1, name: 1 }).lean(),
        getCommunityTeam(),
        TeamOverride.find().lean(),
    ]);
    const byKey = new Map(overrides.map((o) => [o.key, o]));
    const names = new Set(local.map((m) => keyOf(m.name)));
    const base = [
        ...local.map((m) => ({ ...m, source: 'local' })),
        ...community.filter((m) => !names.has(keyOf(m.name))),
    ];
    return base.map((m) => {
        const key = keyOf(m.name);
        const o = byKey.get(key);
        const out = { ...m, key };
        if (o) {
            [...TEXT, ...LINKS].forEach((f) => { if (o[f]) out[f] = o[f]; });
        }
        if (admin) {
            out.original = { name: m.name, role: m.role, team: m.team, ...Object.fromEntries(LINKS.map((f) => [f, m[f] || ''])) };
            out.override = o ? Object.fromEntries([...TEXT, ...LINKS].map((f) => [f, o[f] || ''])) : {};
            out.userEmail = o?.userEmail || '';
        }
        return out;
    });
};

module.exports = { mergedTeam, cleanLink, keyOf, LINKS, TEXT };
