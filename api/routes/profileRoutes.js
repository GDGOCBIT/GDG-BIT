const express = require("express");
const { updateProfile } = require("../controllers/profileController.js");
const { isLoginToken } = require("../middleware/auth.js");
const singleUpload = require("../middleware/multer.js");

const router = express.Router();

router.put("/profile", isLoginToken, singleUpload, updateProfile);

module.exports = router;
