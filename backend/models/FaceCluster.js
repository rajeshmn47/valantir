const mongoose = require('mongoose');

const faceClusterSchema = new mongoose.Schema({
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialMediaSource',
    required: true,
    index: true
  },
  clusterName: {
    type: String,
    required: true,
    trim: true,
    comment: 'Original folder name, e.g., "group_0001"'
  },
  label: {
    type: String,
    trim: true,
    comment: 'User-assigned name (e.g., "Manoj")'
  },
  representativeImage: {
    type: String,
    trim: true,
    comment: 'Path to a sample face image for UI preview'
  },
  faceCount: {
    type: Number,
    default: 0,
    min: 0
  },
  labelHistory: [{
    oldLabel: { type: String, trim: true },
    newLabel: { type: String, trim: true },
    changedAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
faceClusterSchema.index({ sourceId: 1, clusterName: 1 }, { unique: true });
faceClusterSchema.index({ label: 1 });

module.exports = mongoose.model('FaceCluster', faceClusterSchema);