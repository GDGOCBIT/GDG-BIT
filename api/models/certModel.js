const mongoose = require('mongoose');

const CertificateSchema = mongoose.Schema({
    _id: String,
    fullName: String,
    email: String,
    verifyURL: String,
    verifyQR: String,
    skillBoostQR: String,
    certificate: String,
    appreciation: String,
    templateId: String, // set for certificates made with the certificate designer
    values: mongoose.Schema.Types.Mixed, // CSV row values used to draw the template fields
    createdAt: { type: Date, default: Date.now }
});

const Certificate = mongoose.model('Certificate', CertificateSchema)
module.exports = Certificate