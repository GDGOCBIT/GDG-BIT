const express = require("express");
const c = require("../controllers/adminController.js");
const { isLoginToken, isAdmin } = require("../middleware/auth.js");
const singleUpload = require("../middleware/multer.js");
const galleryUpload = require("../middleware/galleryUpload.js");
const gallery = require("../controllers/galleryController.js");
const settings = require("../controllers/settingsController.js");
const admins = require("../controllers/adminUsersController.js");

const router = express.Router();
router.use("/admin", isLoginToken, isAdmin);

router.get("/admin/stats", c.stats);

const crudRoutes = (path, h) => {
    router.get(`/admin/${path}`, h.list);
    router.post(`/admin/${path}`, singleUpload, h.create);
    router.put(`/admin/${path}/:id`, singleUpload, h.update);
    router.delete(`/admin/${path}/:id`, h.remove);
};
crudRoutes("projects", c.projects);

router.get("/admin/certs", c.listCerts);
router.post("/admin/certs", c.createCert);
router.post("/admin/certs/bulk", c.bulkCerts);
router.put("/admin/certs/:id", c.updateCert);
router.delete("/admin/certs/:id", c.deleteCert);

router.get("/admin/admins", admins.list);
router.post("/admin/admins", admins.add);
router.delete("/admin/admins/:email", admins.remove);
router.get("/admin/settings", settings.adminSettings);
router.put("/admin/settings", settings.saveSettings);
router.post("/admin/gallery", galleryUpload, gallery.create);
router.put("/admin/gallery/:id", gallery.update);
router.delete("/admin/gallery/:id", gallery.remove);

router.get("/admin/cert-templates", c.listTemplates);
router.post("/admin/cert-templates", singleUpload, c.saveTemplate);
router.put("/admin/cert-templates/:id", singleUpload, c.saveTemplate);
router.delete("/admin/cert-templates/:id", c.deleteTemplate);
router.post("/admin/cert-batches", c.generateBatch);

module.exports = router;
