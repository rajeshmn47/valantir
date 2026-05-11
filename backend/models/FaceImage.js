const mongoose = require('mongoose');

const faceImageSchema = new mongoose.Schema({
  clusterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FaceCluster',
    required: true,
    index: true
  },
  imagePath: {
    type: String,
    required: true,
    trim: true,
    comment: 'File system path to the cropped face image'
  },
  encoding: {
    type: Buffer,
    comment: 'Binary face encoding (128 float vector, pickled)'
  },
  sourceImage: {
    type: String,
    trim: true,
    comment: 'Original photo path where the face was extracted'
  },
  width: {
    type: Number,
    min: 0
  },
  height: {
    type: Number,
    min: 0
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1.0,
    comment: 'Face detection quality (0-1)'
  }
}, {
  timestamps: { createdAt: 'addedAt' }
});

// Indexes
faceImageSchema.index({ clusterId: 1, addedAt: -1 });

module.exports = mongoose.model('FaceImage', faceImageSchema);