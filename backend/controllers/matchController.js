const Profile = require('../models/Profile');
const { calculateProfileSimilarity, mergeProfiles } = require('../services/similarityService');

exports.matchProfiles = async (req, res) => {
  try {
    const { profileId1, profileId2 } = req.body;
    
    if (!profileId1 || !profileId2) {
      return res.status(400).json({ error: 'Both profile IDs are required' });
    }
    
    const profile1 = await Profile.findById(profileId1);
    const profile2 = await Profile.findById(profileId2);
    
    if (!profile1 || !profile2) {
      return res.status(404).json({ error: 'One or both profiles not found' });
    }
    
    const similarityScore = calculateProfileSimilarity(profile1, profile2);
    const confidenceThreshold = 0.7;
    
    if (similarityScore >= confidenceThreshold) {
      const mergedProfile = await mergeProfiles(profile1, profile2, Profile);
      res.json({ 
        merged: true, 
        similarityScore, 
        mergedProfile,
        message: 'Profiles merged successfully'
      });
    } else {
      res.json({ 
        merged: false, 
        similarityScore,
        message: `Similarity score (${similarityScore}) below threshold (${confidenceThreshold})`
      });
    }
  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ error: 'Failed to match profiles' });
  }
};