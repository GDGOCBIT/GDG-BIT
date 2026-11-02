const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const User = require('../models/userModel.js')
const cloudinary = require('cloudinary')

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          $or: [{ email: profile.emails[0].value }, { googleId: profile.id }],
        })
        if (!user) {
          const imageUpload = await cloudinary.v2.uploader.upload(
            profile.photos[0].value,
            { folder: 'BIT/Account' }
          )
          user = await User.create({
            googleId: profile.id,
            authType: 'register',
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            avatar: {
              public_id: imageUpload.public_id,
              url: imageUpload.secure_url,
            },
          })

          return done(null, user)
        }

        // someone who never finished sign-up still has to finish it
        user.authType = user.isVerified ? 'login' : 'register'
        if (!user.googleId) user.googleId = profile.id
        await user.save()
        return done(null, user)
      } catch (error) {
        done(error, false)
      }
    }
  )
)
