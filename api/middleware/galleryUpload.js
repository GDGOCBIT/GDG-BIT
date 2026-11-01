const multer = require('multer');

// "file" = full-size photo, "thumb" = small preview; the browser compresses both before uploading.
module.exports = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024, files: 2 } })
    .fields([{ name: 'file', maxCount: 1 }, { name: 'thumb', maxCount: 1 }]);
