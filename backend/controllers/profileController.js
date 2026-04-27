const Profile = require('../models/Profile');
const Relationship = require('../models/Relationship');
const Case = require('../models/Case');

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Add .populate('family.relativeId', 'name avatar work')
    const profile = await Profile.findById(id)
      .populate('family.relativeId', 'name avatar work');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get relationships
    const relationships = await Relationship.find({ sourceId: id });

    // Get cases containing this profile
    const cases = await Case.find({ 'profiles.profileId': id });

    res.json({ profile, relationships, cases });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.createProfile = async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findByIdAndUpdate(id, req.body, { new: true });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ createdAt: -1 });
    res.json(profiles);
  } catch (error) {
    console.error('Get all profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};

exports.searchProfiles = async (req, res) => {
  try {
    const { q } = req.query;
    const profiles = await Profile.find({ $text: { $search: q } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } });
    res.json(profiles);
  } catch (error) {
    console.error('Search profiles error:', error);
    res.status(500).json({ error: 'Failed to search profiles' });
  }
};