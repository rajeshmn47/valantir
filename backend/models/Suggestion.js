const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialMediaSource',
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  profilePicPath: {
    type: String,
    trim: true,
    comment: 'Local path to the downloaded profile picture'
  },
  isUsed: {
    type: Boolean,
    default: false,
    comment: 'Whether this username has already been suggested/used'
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes
suggestionSchema.index({ sourceId: 1, username: 1 }, { unique: true });
suggestionSchema.index({ sourceId: 1, isUsed: 1 });

module.exports = mongoose.model('Suggestion', suggestionSchema);