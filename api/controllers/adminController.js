const Certificate = require('../models/certModel.js');
const User = require('../models/userModel.js');
const Event = require('../models/eventModel.js');
const TeamMember = require('../models/teamModel.js');
const Project = require('../models/projectModel.js');
const CertTemplate = require('../models/certTemplateModel.js');
const crypto = require('crypto');
const { crudFactory, serverError, uploadImage, removeImage } = require('../utils/crudFactory.js');

exports.events = crudFactory(Event, {
    label: 'Event',
    folder: 'BIT/Events',
    sort: { startDate: -1 },
    fields: ['title', 'description', 'startDate', 'endDate', 'mode', 'link', 'featured'],
});

exports.team = crudFactory(TeamMember, {
    label: 'Team member',
    folder: 'BIT/Team',
    sort: { order: 1, name: 1 },
    fields: ['name', 'role', 'team', 'order', 'linkedin', 'github', 'twitter'],
});

exports.projects = crudFactory(Project, {
    label: 'Project',
    folder: 'BIT/Projects',
    fields: ['title', 'description', 'tags', 'repoLink', 'demoLink'],
});

const CERT_FIELDS = ['fullName', 'email', 'verifyURL', 'verifyQR', 'skillBoostQR', 'certificate', 'appreciation'];
const pickCert = (body) => {
    const data = {};
    CERT_FIELDS.forEach((f) => { if (body[f] !== undefined) data[f] = body[f]; });
    return data;
};

exports.listCerts = async (req, res) => {
    try {
        const { q = '' } = req.query;
        const filter = q
            ? { $or: [{ _id: new RegExp(escapeRegex(q), 'i') }, { fullName: new RegExp(escapeRegex(q), 'i') }, { email: new RegExp(escapeRegex(q), 'i') }] }
            : {};
        const items = await Certificate.find(filter).sort({ createdAt: -1 }).limit(200);
        res.status(200).json({ success: true, items });
    } catch (e) { serverError(res, e); }
};

exports.createCert = async (req, res) => {
    try {
        const { _id } = req.body;
        if (!_id) return res.status(400).json({ success: false, msg: 'Certificate ID is required!' });
        if (await Certificate.exists({ _id })) {
            return res.status(400).json({ success: false, msg: 'Certificate ID already exists!' });
        }
        const item = await Certificate.create({ _id, ...pickCert(req.body) });
        res.status(201).json({ success: true, msg: 'Certificate created!', item });
    } catch (e) { serverError(res, e); }
};

exports.updateCert = async (req, res) => {
    try {
        const item = await Certificate.findByIdAndUpdate(req.params.id, pickCert(req.body), { new: true });
        if (!item) return res.status(404).json({ success: false, msg: 'Certificate not found!' });
        res.status(200).json({ success: true, msg: 'Certificate updated!', item });
    } catch (e) { serverError(res, e); }
};

exports.deleteCert = async (req, res) => {
    try {
        const item = await Certificate.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, msg: 'Certificate not found!' });
        res.status(200).json({ success: true, msg: 'Certificate deleted!' });
    } catch (e) { serverError(res, e); }
};

// Replaces python/postData.py: body = { rows: [{ _id, fullName, ... }] }
exports.bulkCerts = async (req, res) => {
    try {
        const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
        const valid = rows.filter((r) => r && r._id);
        if (!valid.length) return res.status(400).json({ success: false, msg: 'No valid rows (each needs an _id)!' });
        await Certificate.bulkWrite(valid.map((r) => ({
            updateOne: { filter: { _id: String(r._id) }, update: { $set: pickCert(r) }, upsert: true },
        })));
        res.status(200).json({ success: true, msg: `${valid.length} certificate(s) saved!`, skipped: rows.length - valid.length });
    } catch (e) { serverError(res, e); }
};

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------- certificate designer
const parseFields = (raw) => {
    let fields = raw;
    if (typeof raw === 'string') fields = JSON.parse(raw);
    if (!Array.isArray(fields)) throw new Error('fields must be an array');
    return fields.map((f) => ({
        id: String(f.id || crypto.randomBytes(4).toString('hex')),
        type: ['text', 'qr', 'id'].includes(f.type) ? f.type : 'text',
        key: String(f.key || '').trim(),
        label: String(f.label || f.key || ''),
        x: Math.min(100, Math.max(0, Number(f.x) || 0)),
        y: Math.min(100, Math.max(0, Number(f.y) || 0)),
        size: Math.min(100, Math.max(0.5, Number(f.size) || 4)),
        color: /^#[0-9a-f]{3,8}$/i.test(f.color) ? f.color : '#1e1e1e',
        font: String(f.font || 'Google Sans').slice(0, 40),
        weight: [400, 500, 700].includes(Number(f.weight)) ? Number(f.weight) : 400,
        align: ['left', 'center', 'right'].includes(f.align) ? f.align : 'center',
        maxWidth: Math.min(100, Math.max(0, Number(f.maxWidth) || 0)),
    }));
};

exports.listTemplates = async (req, res) => {
    try {
        const items = await CertTemplate.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, items });
    } catch (e) { serverError(res, e); }
};

exports.saveTemplate = async (req, res) => {
    try {
        const isNew = !req.params.id;
        const tpl = isNew ? new CertTemplate() : await CertTemplate.findById(req.params.id);
        if (!tpl) return res.status(404).json({ success: false, msg: 'Template not found!' });
        if (isNew && !req.file) return res.status(400).json({ success: false, msg: 'Upload the blank certificate image first!' });
        if (req.file) {
            if (!/^image\/(png|jpeg|webp)$/.test(req.file.mimetype)) {
                return res.status(400).json({ success: false, msg: 'Use a PNG, JPG or WebP image!' });
            }
            if (req.file.size > 4 * 1024 * 1024) {
                return res.status(400).json({ success: false, msg: 'Image is over 4 MB. Export a smaller one (2000-3000px wide is plenty)!' });
            }
        }

        const fields = parseFields(req.body.fields);
        if (!fields.some((f) => f.type === 'text' && f.key === 'name')) {
            return res.status(400).json({ success: false, msg: 'Add a “name” text field to the template!' });
        }
        tpl.name = String(req.body.name || '').trim();
        if (!tpl.name) return res.status(400).json({ success: false, msg: 'Give the template a name!' });
        tpl.fields = fields;
        if (req.file) {
            const old = tpl.image;
            tpl.imageData = req.file.buffer;
            tpl.imageType = req.file.mimetype;
            tpl.image = { url: `/api/cert-templates/${tpl._id}/image?v=${Date.now()}` };
            tpl.width = Number(req.body.width);
            tpl.height = Number(req.body.height);
            if (old?.public_id) await removeImage(old);
        }
        await tpl.save();
        res.status(isNew ? 201 : 200).json({ success: true, msg: isNew ? 'Template saved!' : 'Template updated!', item: tpl });
    } catch (e) {
        if (e instanceof SyntaxError || e.name === 'ValidationError') {
            return res.status(400).json({ success: false, msg: 'Invalid template data!' });
        }
        serverError(res, e);
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        if (await Certificate.exists({ templateId: req.params.id })) {
            return res.status(400).json({ success: false, msg: 'Certificates were issued with this template. Delete them first!' });
        }
        const tpl = await CertTemplate.findByIdAndDelete(req.params.id);
        if (!tpl) return res.status(404).json({ success: false, msg: 'Template not found!' });
        await removeImage(tpl.image);
        res.status(200).json({ success: true, msg: 'Template deleted!' });
    } catch (e) { serverError(res, e); }
};

// body: { templateId, origin, rows: [{ name, email?, ...otherFields }] }
exports.generateBatch = async (req, res) => {
    try {
        const { templateId, rows, origin } = req.body;
        const tpl = await CertTemplate.findById(templateId);
        if (!tpl) return res.status(404).json({ success: false, msg: 'Template not found!' });
        if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ success: false, msg: 'The CSV has no rows!' });
        if (rows.length > 2000) return res.status(400).json({ success: false, msg: 'Max 2000 certificates per batch!' });
        const base = String(process.env.PUBLIC_URL || origin || '').replace(/\/$/, '');
        if (!/^https?:\/\//.test(base)) return res.status(400).json({ success: false, msg: 'Missing site URL for the QR code!' });

        const docs = [];
        const skipped = [];
        rows.forEach((row, i) => {
            const clean = {};
            Object.entries(row || {}).forEach(([k, v]) => { clean[String(k).trim().toLowerCase()] = String(v ?? '').trim(); });
            const name = clean.name || clean.fullname || clean['full name'];
            if (!name) { skipped.push(i + 2); return; } // +2: header row + 1-based
            const id = crypto.randomBytes(9).toString('hex');
            docs.push({
                _id: id, fullName: name, email: clean.email || '', certificate: tpl.name, templateId: String(tpl._id),
                verifyURL: `${base}/cert/verify/${id}`, values: { ...clean, name },
            });
        });
        if (!docs.length) return res.status(400).json({ success: false, msg: 'No row has a name!', skipped });
        await Certificate.insertMany(docs);
        res.status(201).json({ success: true, msg: `${docs.length} certificate(s) generated!`, skipped, items: docs });
    } catch (e) { serverError(res, e); }
};

exports.stats = async (req, res) => {
    try {
        const [users, certificates, templates, projects, photos] = await Promise.all([
            User.countDocuments({ isVerified: true }),
            Certificate.countDocuments(),
            CertTemplate.countDocuments(),
            Project.countDocuments(),
            require('../models/galleryModel.js').countDocuments(),
        ]);
        res.status(200).json({ success: true, stats: { users, certificates, templates, projects, photos } });
    } catch (e) { serverError(res, e); }
};

// Public: serves the blank certificate image (needed by the verify page to draw a certificate).
exports.templateImage = async (req, res) => {
    try {
        const tpl = await CertTemplate.findById(req.params.id).select('+imageData imageType image');
        if (!tpl) return res.status(404).end();
        if (tpl.imageData?.length) {
            res.set({ 'Content-Type': tpl.imageType || 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' });
            return res.send(tpl.imageData);
        }
        // Templates created before images moved to the database still point at an external URL.
        if (/^https?:\/\//.test(tpl.image?.url || '')) return res.redirect(tpl.image.url);
        res.status(404).end();
    } catch (e) { res.status(404).end(); }
};
