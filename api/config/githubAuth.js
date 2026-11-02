const passport = require('passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const User = require('../models/userModel.js');
const cloudinary = require('cloudinary');

// Not used for sessions (login uses our own tokens), but passport wants these defined.
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Only an email GitHub has verified may identify an account: otherwise someone could add
// somebody else's address to their GitHub profile and sign in as them.
const verifiedEmail = (profile) => {
    const list = (profile.emails || []).filter((e) => e.verified !== false && e.value);
    const pick = list.find((e) => e.primary) || list[0];
    return pick ? pick.value.toLowerCase() : null;
};

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
            scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = verifiedEmail(profile);
                if (!email) return done(new Error('Your GitHub account has no verified email. Verify one on GitHub and try again.'), false);

                let user = await User.findOne({ $or: [{ email }, { githubId: String(profile.id) }] });
                if (!user) {
                    const [first, ...rest] = String(profile.displayName || profile.username || 'GitHub user').trim().split(/\s+/);
                    const photo = profile.photos?.[0]?.value;
                    const img = photo ? await cloudinary.v2.uploader.upload(photo, { folder: 'BIT/Account' }) : null;
                    user = await User.create({
                        githubId: String(profile.id),
                        authType: 'register',
                        firstName: first,
                        lastName: rest.join(' '),
                        email,
                        avatar: img ? { public_id: img.public_id, url: img.secure_url } : undefined,
                    });
                    return done(null, user);
                }
                if (!user.githubId) user.githubId = String(profile.id);
                // someone who never finished sign-up still has to finish it
                user.authType = user.isVerified ? 'login' : 'register';
                await user.save();
                return done(null, user);
            } catch (error) {
                done(error, false);
            }
        }
    )
);
