const mongoose = require('mongoose');

const identityLinkSchema = new mongoose.Schema({
  clusterIdA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FaceCluster',
    required: true,
    index: true
  },
  clusterIdB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FaceCluster',
    required: true,
    index: true
  },
  similarityScore: {
    type: Number,
    min: 0,
    max: 1,
    comment: 'Face distance similarity (higher = more similar)'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
    index: true
  },
  confirmedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Unique index to prevent duplicate pairs
identityLinkSchema.index({ clusterIdA: 1, clusterIdB: 1 }, { unique: true });

module.exports = mongoose.model('IdentityLink', identityLinkSchema);