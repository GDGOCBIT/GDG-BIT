const Event = require('../models/eventModel.js');
const TeamMember = require('../models/teamModel.js');
const Project = require('../models/projectModel.js');
const { getOrgProjects } = require('../services/github.js');
const { getCommunityEvents, getCommunityTeam } = require('../services/gdgCommunity.js');
const { serverError } = require('../utils/crudFactory.js');

const statusOf = (start, end) => {
    const now = Date.now();
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : s + 3 * 60 * 60 * 1000;
    return now < s ? 'upcoming' : now <= e ? 'live' : 'past';
};

// Site events = events added in the admin dashboard + events published on gdg.community.dev.
// An admin event with the same link as a community event replaces it.
exports.listEvents = async (req, res) => {
    try {
        const [local, community] = await Promise.all([
            Event.find().sort({ startDate: -1 }).lean({ virtuals: true }),
            getCommunityEvents(),
        ]);
        const localLinks = new Set(local.map((e) => e.link).filter(Boolean));
        const items = [
            ...local.map((e) => ({ ...e, source: 'local', status: statusOf(e.startDate, e.endDate) })),
            ...community
                .filter((e) => !localLinks.has(e.link))
                .map((e) => ({ ...e, status: statusOf(e.startDate, e.endDate) })),
        ].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        res.status(200).json({ success: true, items });
    } catch (e) { serverError(res, e); }
};

exports.listTeam = async (req, res) => {
    try {
        const [local, community] = await Promise.all([
            TeamMember.find().sort({ order: 1, name: 1 }).lean(),
            getCommunityTeam(),
        ]);
        const names = new Set(local.map((m) => m.name.trim().toLowerCase()));
        const items = [
            ...local.map((m) => ({ ...m, source: 'local' })),
            ...community.filter((m) => !names.has(m.name.toLowerCase())),
        ];
        res.status(200).json({ success: true, items });
    } catch (e) { serverError(res, e); }
};

// Projects = admin-added projects + public repos of the GitHub org (admin entries win on same repo link).
exports.listProjects = async (req, res) => {
    try {
        const [local, repos] = await Promise.all([Project.find().sort({ _id: -1 }).lean(), getOrgProjects()]);
        const links = new Set(local.map((p) => (p.repoLink || '').toLowerCase()).filter(Boolean));
        const items = [
            ...local.map((p) => ({ ...p, source: 'local' })),
            ...repos.filter((r) => !links.has(r.repoLink.toLowerCase())),
        ];
        res.status(200).json({ success: true, items });
    } catch (e) { serverError(res, e); }
};
