const express = require("express");
const passport = require('passport');
require('../config/googleAuth.js');
require('../config/githubAuth.js');
const { googleCallbackController, githubCallbackController } = require("../controllers/socialController");
const router = express.Router();

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', googleCallbackController);
router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/auth/github/callback', githubCallbackController);

module.exports = router;
