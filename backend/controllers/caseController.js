const Case = require('../models/Case');

exports.createCase = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const newCase = new Case({ title, description, tags: tags || [] });
    await newCase.save();
    res.status(201).json(newCase);
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
};

exports.getAllCases = async (req, res) => {
  try {
    const cases = await Case.find().populate('profiles.profileId');
    res.json(cases);
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
};

exports.getCase = async (req, res) => {
  try {
    const { id } = req.params;
    const case_ = await Case.findById(id).populate('profiles.profileId');
    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(case_);
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
};

exports.addProfileToCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { profileId } = req.body;
    
    const case_ = await Case.findById(id);
    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    case_.profiles.push({ profileId });
    await case_.save();
    
    res.json(case_);
  } catch (error) {
    console.error('Add profile to case error:', error);
    res.status(500).json({ error: 'Failed to add profile to case' });
  }
};

exports.addNoteToCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, tags } = req.body;
    
    const case_ = await Case.findById(id);
    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    case_.notes.push({ text, tags: tags || [] });
    await case_.save();
    
    res.json(case_);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
};