const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');

const UserSchema = mongoose.Schema({
    googleId: String,
    twitterId: String,
    linkedinId: String,
    authType: String,
    firstName: String,
    lastName: String,
    email: String,
    password: { type: String, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: {
        public_id: String,
        url: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    registerOTP: { type: String, select: false },
    forgotOTP: { type: String, select: false },
    otpCreatedAt: { type: Date, select: false },
    jwtForgotToken: { type: String, select: false },
    jwtRegisterToken: { type: String, select: false },
    jwtLoginToken: { type: String, select: false },
    // Public member page (opt-out: everyone is listed until they switch it off)
    bio: { type: String, maxlength: 240 },
    links: { website: String, linkedin: String, github: String, twitter: String, instagram: String },
    isPrivate: { type: Boolean, default: false },
    showCerts: { type: Boolean, default: true },
    hiddenByAdmin: { type: Boolean, default: false },
    joinedOn: {
        type: Date,
        default: Date.now,
    },
});

UserSchema.methods.comparePassword = async function (enteredPasssword) {
    return bcrypt.compare(enteredPasssword, this.password);
};

UserSchema.methods.getLoginToken = function () {
    const loginToken = JWT.sign(
        { userId: this._id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE,
        }
    );
    this.jwtLoginToken = loginToken;
    return loginToken;
};

UserSchema.methods.getRegisterToken = function () {
    const registerToken = JWT.sign(
        { userId: this._id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE,
        }
    );
    this.jwtRegisterToken = registerToken;
    return registerToken;
};

UserSchema.methods.getForgotToken = function () {
    const forgotToken = JWT.sign(
        { userId: this._id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE,
        }
    );
    this.jwtForgotToken = forgotToken;
    return forgotToken;
};

const User = mongoose.model('User', UserSchema)
module.exports = User