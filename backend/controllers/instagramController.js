const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const LABELS_FILE = path.join(__dirname, 'data', 'face_labels.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(LABELS_FILE))) {
  fs.mkdirSync(path.dirname(LABELS_FILE), { recursive: true });
}

// GET /api/face-labels
router.get('/face-labels', (req, res) => {
  if (fs.existsSync(LABELS_FILE)) {
    const data = fs.readFileSync(LABELS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } else {
    res.json({});
  }
});

// POST /api/face-labels
router.post('/face-labels', (req, res) => {
  const labels = req.body;
  fs.writeFileSync(LABELS_FILE, JSON.stringify(labels, null, 2));
  res.json({ success: true });
});

// GET /api/face-groups – you need to generate this from your refined_groups folder
router.get('/face-groups', (req, res) => {
  // This should return an array of { id, img (base64 or url), size }
  // You can generate this JSON once and serve it, or generate on the fly.
  // For simplicity, assume you have a static file.
  const groups = require('./data/groups.json');
  res.json(groups);
});