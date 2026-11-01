const Certificate = require('../models/certModel.js')
const CertTemplate = require('../models/certTemplateModel.js')
const CryptoJS = require('crypto-js')

exports.verifyCertificate = async (req, res) => {
  try {
    const certData = await Certificate.findById(
      req.params.certificateID
    ).select('fullName verifyURL verifyQR skillBoostQR certificate appreciation templateId values')
    if (!certData) {
      return res.status(400).json({
        success: false,
        msg: 'Certificate not found',
      })
    }
    const payload = certData.toObject()
    if (certData.templateId) {
      payload.template = await CertTemplate.findById(certData.templateId).lean()
    }
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      process.env.DATA_ENCRYPTION_SECRET_KEY
    ).toString()
    res.status(200).json({
      success: true,
      data: encryptedData,
    })
  } catch (error) {
    res.send('Try again after some time!')
  }
}
