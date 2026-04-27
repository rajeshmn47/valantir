const express = require('express');
const { uploadPDF, uploadMiddleware } = require('../controllers/uploadController');
const router = express.Router();

router.post('/', uploadMiddleware, uploadPDF);

module.exports = router;