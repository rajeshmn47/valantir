const Relationship = require('../models/Relationship');
const Profile = require('../models/Profile');

exports.createRelationship = async (req, res) => {
  try {
    const { sourceId, relationType, targetId, targetType, confidence } = req.body;
    
    const relationship = new Relationship({
      sourceId,
      relationType,
      targetId,
      targetType,
      confidence: confidence || 1.0
    });
    
    await relationship.save();
    res.status(201).json(relationship);
  } catch (error) {
    console.error('Create relationship error:', error);
    res.status(500).json({ error: 'Failed to create relationship' });
  }
};

exports.getRelationships = async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const relationships = await Relationship.find({ sourceId: profileId });
    
    // Fetch target profiles for person-person relationships
    const enrichedRelationships = await Promise.all(relationships.map(async (rel) => {
      if (rel.targetType === 'Person') {
        const targetProfile = await Profile.findById(rel.targetId);
        return { ...rel.toObject(), targetProfile };
      }
      return rel;
    }));
    
    res.json(enrichedRelationships);
  } catch (error) {
    console.error('Get relationships error:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
};