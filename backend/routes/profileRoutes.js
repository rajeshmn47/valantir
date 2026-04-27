const express = require('express');
const { getProfile, createProfile, updateProfile, getAllProfiles, searchProfiles } = require('../controllers/profileController');
const router = express.Router();

router.get('/allprofiles', getAllProfiles);
router.get('/searchprofiles', searchProfiles);
router.get('/:id', getProfile);
router.post('/', createProfile);
router.put('/:id', updateProfile);

module.exports = router;