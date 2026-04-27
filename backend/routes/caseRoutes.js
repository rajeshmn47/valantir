const express = require('express');
const { createCase, getAllCases, getCase, addProfileToCase, addNoteToCase } = require('../controllers/caseController');
const router = express.Router();

router.post('/', createCase);
router.get('/', getAllCases);
router.get('/:id', getCase);
router.post('/:id/profiles', addProfileToCase);
router.post('/:id/notes', addNoteToCase);

module.exports = router;