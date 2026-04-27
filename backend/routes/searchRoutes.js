const express = require('express');
const { searchProfiles } = require('../controllers/searchController');
const router = express.Router();

router.get('/', searchProfiles);

module.exports = router;