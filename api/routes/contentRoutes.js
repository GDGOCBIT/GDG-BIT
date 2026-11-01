const express = require("express");
const { events, templateImage } = require("../controllers/adminController.js");
const gallery = require("../controllers/galleryController.js");
const settings = require("../controllers/settingsController.js");
const { listEvents, listTeam, listProjects } = require("../controllers/contentController.js");

const router = express.Router();

// Public lists change rarely: let the CDN keep them for 30s and serve a stale copy while it refreshes.
// Admin screens add ?fresh=1 to skip this, and the image endpoints set their own (immutable) headers.
router.use(["/events", "/team", "/projects", "/gallery", "/settings"], (req, res, next) => {
    if (req.method === "GET" && !req.query.fresh && !req.headers.login_token) {
        res.set("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=300");
    }
    next();
});

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
