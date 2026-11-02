const passport = require('passport');
require('../config/googleAuth.js');
require('../config/githubAuth.js');

// Shared by every provider: hand the browser back to the site with a short-lived token.
const callback = (provider) => async function (req, res, next) {
    passport.authenticate(provider, { session: false }, async function (err, user) {
        const back = (qs) => res.redirect(`${process.env.FRONTEND_URL}/auth?${qs}`);
        if (err) {
            console.error(err);
            return back(`error=${encodeURIComponent(err.message)}`);
        }
        if (!user) return back('error=User not found');
        try {
            const userData = {
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: { public_id: user.avatar?.public_id, url: user.avatar?.url },
            };
            const resp = encodeURIComponent(JSON.stringify(userData));
            if (user.authType === 'register') {
                const registerToken = user.getRegisterToken();
                await user.save();
                return back(`type=register&response=${resp}&registerToken=${registerToken}`);
            }
            const loginToken = user.getLoginToken();
            await user.save();
            return back(`type=login&response=${resp}&loginToken=${loginToken}`);
        } catch (e) {
            console.error(e);
            return back('error=Something went wrong... Try again later!');
        }
    })(req, res, next);
};

exports.googleCallbackController = callback('google');
exports.githubCallbackController = callback('github');
