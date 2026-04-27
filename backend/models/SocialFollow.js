// models/SocialFollow.js
const mongoose = require('mongoose');
const socialFollowSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  platform: { type: String, enum: ['instagram', 'twitter', 'facebook'], required: true },
  followerId: String,         // platform‑specific ID (username, page ID, etc.)
  followerName: String,       // display name
  followerAvatar: String,
  followedAt: { type: Date, default: Date.now }
});
socialFollowSchema.index({ profileId: 1, platform: 1, followerId: 1 });
module.exports = mongoose.model('SocialFollow', socialFollowSchema);