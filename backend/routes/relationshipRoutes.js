const express = require('express');
const { createRelationship, getRelationships } = require('../controllers/relationshipController');
const router = express.Router();

router.post('/', createRelationship);
router.get('/:profileId', getRelationships);

module.exports = router;