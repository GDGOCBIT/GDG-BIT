const CryptoJS = require('crypto-js');
const { uploadImage, removeImage, serverError } = require('../utils/crudFactory.js');
const { userIsAdmin } = require('../middleware/auth.js');

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const user = req.user;
        if (firstName !== undefined) user.firstName = String(firstName).trim();
        if (lastName !== undefined) user.lastName = String(lastName).trim();
        if (req.file) {
            await removeImage(user.avatar);
            user.avatar = await uploadImage(req.file, 'BIT/Account');
        }
        await user.save();

        const data = CryptoJS.AES.encrypt(
            JSON.stringify({
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar: user.avatar,
                    joinedOn: user.joinedOn,
                    isAdmin: userIsAdmin(user),
                },
            }),
            process.env.DATA_ENCRYPTION_SECRET_KEY
        ).toString();

        res.status(200).json({ success: true, msg: 'Profile updated!', data });
    } catch (e) { serverError(res, e); }
};
