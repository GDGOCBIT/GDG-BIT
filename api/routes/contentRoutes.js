const express = require("express");
const { events, templateImage } = require("../controllers/adminController.js");
const gallery = require("../controllers/galleryController.js");
const settings = require("../controllers/settingsController.js");
const { listEvents, listTeam, listProjects } = require("../controllers/contentController.js");

const router = express.Router();

// Public, read-only
router.get("/events", listEvents);
router.get("/events/:id", events.get);
router.get("/team", listTeam);
router.get("/projects", listProjects);
router.get("/cert-templates/:id/image", templateImage);
router.get("/settings", settings.publicSettings);
router.get("/gallery", gallery.list);
router.get("/gallery/:id/image", gallery.image);

module.exports = router;
