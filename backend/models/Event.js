const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  village: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  location: {
    address: String,           // e.g., "Near Hanuman Temple, Main Road"
    latitude: Number,
    longitude: Number
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  endDate: Date,               // optional for multi‑day events
  reason: {
    type: String,
    required: true,
    enum: ['religious', 'harvest', 'cultural', 'political', 'seasonal', 'other']
  },
  description: String,
  culturalNotes: String,       // traditions, rituals, significance
  images: [String],            // array of image URLs (uploaded to your backend or cloud storage)
  organisers: [{
    name: String,
    role: String,
    contact: String
  }],
  estimatedCrowd: Number,      // approximate attendance
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String]               // e.g., "procession", "famous", "annual"
}, { timestamps: true });

// Indexes
eventSchema.index({ village: 1, date: -1 });
eventSchema.index({ location: '2dsphere' }); // if you need geo queries

module.exports = mongoose.model('Event', eventSchema);