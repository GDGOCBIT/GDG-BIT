const express = require("express");
const { updateProfile } = require("../controllers/profileController.js");
const { isLoginToken } = require("../middleware/auth.js");
const singleUpload = require("../middleware/multer.js");

const team = require("../controllers/teamController.js");

const members = require("../controllers/membersController.js");

const router = express.Router();

router.put("/profile", isLoginToken, singleUpload, updateProfile);
router.get("/my/public-profile", isLoginToken, members.myGet);
router.put("/my/public-profile", isLoginToken, members.mySave);
router.get("/my/certificates", isLoginToken, team.myCertificates);
router.get("/my/team-card", isLoginToken, team.myCard);
router.put("/my/team-card", isLoginToken, team.mySaveCard);

module.exports = router;
