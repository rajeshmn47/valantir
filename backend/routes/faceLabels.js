const express = require('express');
const router = express.Router();
const faceLabelsController = require('../controllers/faceLabelsController');

router.get('/face-groups', faceLabelsController.getFaceGroups);
router.get('/face-labels', faceLabelsController.getFaceLabels);
router.post('/face-labels', faceLabelsController.postFaceLabels);
router.get('/suggestions', faceLabelsController.getSuggestions);
router.get('/sources', faceLabelsController.getSources);
router.post('/sources', faceLabelsController.createSource);

// Add these two lines:
router.post('/process-source', faceLabelsController.processSource);
router.get('/process-status', faceLabelsController.getProcessStatus);
router.post('/annotate-source', faceLabelsController.annotateSource);
router.get('/annotated-images', faceLabelsController.getAnnotatedImages);
router.get('/stats', faceLabelsController.getStats);
router.get('/photos-by-hour', faceLabelsController.getPhotosByHour);
router.get('/autocomplete/labels', faceLabelsController.autocompleteLabels);
router.post('/auto-label', faceLabelsController.autoLabel);
router.get('/cluster-images', faceLabelsController.getClusterImages);
router.get('/network', faceLabelsController.getNetwork)

module.exports = router;