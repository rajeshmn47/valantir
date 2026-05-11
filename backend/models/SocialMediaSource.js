const mongoose = require('mongoose');

const socialMediaSourceSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    downloadPath: String,
    profilePicsPath: String,
    lastDownloaded: Date,
    lastProcessed: Date,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'error'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('SocialMediaSource', socialMediaSourceSchema);