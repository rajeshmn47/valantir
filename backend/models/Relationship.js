const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema({
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  sourceType: {
    type: String,
    enum: ['Person', 'Company'],
    default: 'Person'
  },
  relationType: {
    type: String,
    enum: ['worksAt', 'knows', 'collaborates'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['Person', 'Company'],
    required: true
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  confidence: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1
  }
}, {
  timestamps: true
});

relationshipSchema.index({ sourceId: 1, targetId: 1, relationType: 1 }, { unique: true });

module.exports = mongoose.model('Relationship', relationshipSchema);