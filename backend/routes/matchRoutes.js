const express = require('express');
const { matchProfiles } = require('../controllers/matchController');
const router = express.Router();

router.post('/', matchProfiles);

module.exports = router;