const User = require("../models/userModel.js");
const JWT = require("jsonwebtoken");

const fail = (res, msg, status = 401) =>
    res.status(status).json({ success: false, msg });

// Builds a middleware that validates a token sent in `header`, stored on the user as `field`.
const tokenGuard = (header, field, { requireVerified = false, select = "" } = {}) =>
    async (req, res, next) => {
        try {
            const token = req.headers[header];
            if (!token) return fail(res, "Session expired... Try again!");

            let payload;
            try {
                payload = JWT.verify(token, process.env.JWT_SECRET);
            } catch (e) {
                return fail(res, "Session expired... Try again!");
            }

            const user = await User.findOne({ _id: payload.userId, [field]: token }).select(select);
            if (!user) return fail(res, "Invalid Token!");

            if (requireVerified && !user.isVerified) {
                return fail(res, "You are not authorized to perform this action!", 403);
            }

            req.user = user;
            next();
        } catch (error) {
            console.log(error);
            fail(res, "Something went wrong... Try again later!", 500);
        }
    };

const isLoginToken = tokenGuard("login_token", "jwtLoginToken", { requireVerified: true });
const isRegisterToken = tokenGuard("register_token", "jwtRegisterToken", { select: "+registerOTP +otpCreatedAt" });
const isForgotToken = tokenGuard("forgot_token", "jwtForgotToken", { requireVerified: true });

// Admin = role "admin", an owner listed in ADMIN_EMAILS (cannot be removed from the website),
// or an email that was granted admin from the dashboard before the person signed up.
const ownerEmails = () =>
    (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

const isOwnerEmail = (email) => ownerEmails().includes(String(email || "").toLowerCase());

const userIsAdmin = async (user) => {
    if (!user) return false;
    if (user.role === "admin" || isOwnerEmail(user.email)) return true;
    const email = String(user.email || "").toLowerCase();
    if (!email) return false;
    const Settings = require("../models/settingsModel.js");
    const doc = await Settings.findOne({ key: "site" }).select("adminEmails");
    return !!doc && doc.adminEmails.includes(email);
};

const isAdmin = async (req, res, next) => {
    try {
        if (!(await userIsAdmin(req.user))) return fail(res, "Admin access required!", 403);
        next();
    } catch (error) {
        console.log(error);
        fail(res, "Something went wrong... Try again later!", 500);
    }
};

module.exports = { isLoginToken, isRegisterToken, isForgotToken, isAdmin, userIsAdmin, isOwnerEmail, ownerEmails };
