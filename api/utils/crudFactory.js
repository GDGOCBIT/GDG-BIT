const { v2 } = require('cloudinary');
const getDataUrl = require('../middleware/dataURL.js');

const serverError = (res, error) => {
    console.log(error);
    return res.status(500).json({ success: false, msg: 'Something went wrong... Try again later!' });
};

const uploadImage = async (file, folder) => {
    const { content } = getDataUrl(file);
    const img = await v2.uploader.upload(content, { folder });
    return { public_id: img.public_id, url: img.secure_url };
};

const removeImage = async (image) => {
    if (image?.public_id) {
        await v2.uploader.destroy(image.public_id).catch(() => { });
    }
};

/**
 * Builds list/get/create/update/remove handlers for a mongoose model.
 * `fields` is the whitelist of body fields the client may set; an uploaded `file` becomes `image`.
 */
const crudFactory = (Model, { fields, folder, sort = { _id: -1 }, label = 'Item' }) => {
    const pick = (body) => {
        const data = {};
        fields.forEach((f) => {
            if (body[f] !== undefined) data[f] = body[f];
        });
        return data;
    };

    return {
        list: async (req, res) => {
            try {
                const items = await Model.find().sort(sort);
                res.status(200).json({ success: true, items });
            } catch (e) { serverError(res, e); }
        },
        get: async (req, res) => {
            try {
                const item = await Model.findById(req.params.id);
                if (!item) return res.status(404).json({ success: false, msg: `${label} not found!` });
                res.status(200).json({ success: true, item });
            } catch (e) { serverError(res, e); }
        },
        create: async (req, res) => {
            try {
                const data = pick(req.body);
                if (req.file) data.image = await uploadImage(req.file, folder);
                const item = await Model.create(data);
                res.status(201).json({ success: true, msg: `${label} created!`, item });
            } catch (e) {
                if (e.name === 'ValidationError') {
                    return res.status(400).json({ success: false, msg: e.message });
                }
                serverError(res, e);
            }
        },
        update: async (req, res) => {
            try {
                const item = await Model.findById(req.params.id);
                if (!item) return res.status(404).json({ success: false, msg: `${label} not found!` });
                item.set(pick(req.body));
                if (req.file) {
                    await removeImage(item.image);
                    item.image = await uploadImage(req.file, folder);
                }
                await item.save();
                res.status(200).json({ success: true, msg: `${label} updated!`, item });
            } catch (e) {
                if (e.name === 'ValidationError') {
                    return res.status(400).json({ success: false, msg: e.message });
                }
                serverError(res, e);
            }
        },
        remove: async (req, res) => {
            try {
                const item = await Model.findByIdAndDelete(req.params.id);
                if (!item) return res.status(404).json({ success: false, msg: `${label} not found!` });
                await removeImage(item.image);
                res.status(200).json({ success: true, msg: `${label} deleted!` });
            } catch (e) { serverError(res, e); }
        },
    };
};

module.exports = { crudFactory, serverError, uploadImage, removeImage };
