const mongoose = require('mongoose');

// ============================
// Family Relation Subdocument
// ============================
const familyRelationSchema = new mongoose.Schema({
  relativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  relationType: {
    type: String,
    enum: ['spouse', 'parent', 'child', 'sibling', 'grandparent', 'grandchild', 'aunt', 'uncle', 'cousin', 'in-law', 'other'],
    required: true
  },
  confidence: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1
  },
  notes: String,
  verifiedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// ============================
// Voting History Subdocument
// ============================
const votingHistorySchema = new mongoose.Schema({
  electionDate: Date,
  electionType: {
    type: String,
    enum: ['general', 'assembly', 'local', 'by-election']
  },
  partyVotedFor: String,
  boothId: String,
  verified: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// ============================
// Main Profile Schema
// ============================
const profileSchema = new mongoose.Schema({

  // ----- Core Identity -----
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },

  // ----- Location & Address -----
  location: {
    type: String,          // simple string (e.g., "Bengaluru, Karnataka")
    trim: true
  },
  address: {
    street: String,
    locality: String,
    pincode: {
      type: String,
      index: true
    },
    constituency: {
      type: String,        // assembly/parliamentary constituency
      index: true
    },
    ward: String,
    boothId: {
      type: String,        // polling booth identifier
      index: true
    }
  },
  latitude: {
    type: Number,
    index: true
  },
  longitude: {
    type: Number,
    index: true
  },

  // ----- Contact -----
  phone: {
    type: String,
    index: true,
    sparse: true
  },
  email: {
    type: String,
    lowercase: true,
    index: true,
    sparse: true
  },

  // ----- Work & Skills -----
  work: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],

  // ----- Economic & Demographic -----
  incomeBracket: {
    type: String,
    enum: ['below poverty', '0-5L', '5-10L', '10-25L', '25L+']
  },
  educationLevel: {
    type: String,
    enum: ['illiterate', 'primary', 'secondary', 'higher secondary', 'graduate', 'postgraduate', 'doctorate']
  },
  homeOwnership: {
    type: String,
    enum: ['owned', 'rented', 'leased', 'others']
  },
  vehicles: [{
    type: String,
    enum: ['bicycle', 'motorcycle', 'car', 'tractor', 'none']
  }],

  // ----- Political & Voting Behavior -----
  partyAffiliation: {
    type: String,
    index: true
  },
  votingHistory: [votingHistorySchema],
  turnoutLikelihood: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5,
    index: true
  },
  swingVoter: {
    type: Boolean,
    default: false
  },
  influencerScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5,
    comment: 'propensity to influence others in community'
  },

  // ----- Digital & Social Footprint -----
  socialLinks: {
    type: Map,
    of: String,
    default: {}
  },
  hasSmartphone: {
    type: Boolean,
    default: false
  },
  primaryPlatform: {
    type: String,
    enum: ['WhatsApp', 'Facebook', 'Instagram', 'Telegram', 'Other', 'None']
  },

  avatar: { type: String, default: '' },   // <-- ADD THIS LINE

  // ----- Family & Relatives -----
  family: [familyRelationSchema],

  // ----- Family Grouping (optional) -----
  householdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    index: true
  },

  // ----- Data Quality & Operations -----
  confidenceScore: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1,
    index: true
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'partial', 'verified', 'field-confirmed'],
    default: 'unverified',
    index: true
  },
  dataSources: [{
    type: String,
    enum: ['electoral roll', 'manual entry', 'social scraping', 'web scraping', 'api', 'field survey', 'other']
  }],
  tags: [{
    type: String,
    lowercase: true,
    index: true
  }],
  notes: {
    type: String,
    trim: true
  },
  lastContacted: Date,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // ----- Privacy & Compliance -----
  consentGiven: {
    type: Boolean,
    default: false,
    comment: 'explicit consent to store/process personal data'
  },
  optOut: {
    type: Boolean,
    default: false,
    comment: 'voter requested to be removed from all systems'
  },
  dataRetentionDate: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from creation
    comment: 'when this record should be automatically anonymized'
  },

  // ----- Merging & Source Metadata -----
  mergedFrom: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  }],
  sourceMetadata: {
    sourceType: String,
    sourceId: String,
    extractedAt: Date
  }

}, {
  timestamps: true
});

// ============================
// Indexes for Performance
// ============================
profileSchema.index({ name: 'text', location: 'text', work: 'text', skills: 'text', tags: 'text' });
profileSchema.index({ 'family.relativeId': 1 });
profileSchema.index({ 'family.relationType': 1 });
profileSchema.index({ createdAt: -1 });
profileSchema.index({ updatedAt: -1 });
profileSchema.index({ 'address.pincode': 1, isActive: 1 });
profileSchema.index({ 'address.constituency': 1, partyAffiliation: 1 });
profileSchema.index({ turnoutLikelihood: -1, swingVoter: 1 });
profileSchema.index({ optOut: 1, consentGiven: 1 }); // for privacy filters

// ============================
// Virtuals
// ============================
profileSchema.virtual('addressFull').get(function () {
  const parts = [
    this.address?.street,
    this.address?.locality,
    this.address?.pincode,
    this.address?.constituency
  ].filter(Boolean);
  return parts.join(', ');
});

profileSchema.virtual('ageGroup').get(function () {
  if (this.age < 18) return 'under 18';
  if (this.age < 30) return '18-29';
  if (this.age < 45) return '30-44';
  if (this.age < 60) return '45-59';
  return '60+';
});

// ============================
// Instance Methods (example)
// ============================
profileSchema.methods.addRelative = async function (relativeId, relationType, notes = '') {
  if (this.family.some(r => r.relativeId.toString() === relativeId.toString())) {
    throw new Error('Relative already added');
  }
  this.family.push({
    relativeId,
    relationType,
    notes
  });
  return this.save();
};

// ============================
// Static Methods (example)
// ============================
profileSchema.statics.findByConstituency = function (constituency) {
  return this.find({ 'address.constituency': constituency, isActive: true });
};

module.exports = mongoose.model('Profile', profileSchema);