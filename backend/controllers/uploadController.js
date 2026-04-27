const multer = require('multer');
const { extractFromPDF } = require('../services/pdfExtractionService');
const Profile = require('../models/Profile');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

exports.uploadPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Extract voters from PDF
        const extractionResult = await extractFromPDF(req.file.buffer, req.file.originalname);

        if (!extractionResult.isValid || extractionResult.voters.length === 0) {
            return res.status(400).json({ error: 'No valid voters found in PDF' });
        }

        console.log(`Extracted ${extractionResult.voters.length} voters.`);

        const createdProfiles = [];

        // Process each extracted voter individually
        for (const voter of extractionResult.voters) {
            // Skip if name is missing or invalid
            if (!voter.name || voter.name.length < 2) {
                console.warn('Skipping invalid voter (no name):', voter);
                continue;
            }

            // Prepare clean data for the Profile schema
            const profileData = {
                name: voter.name.trim(),
                age: voter.age || null,
                location: extractionResult.location || null,
                confidenceScore: 0.9
                // socialLinks will default to empty Map (no error)
                // skills, work, sourceMetadata, mergedFrom are left undefined
            };

            // Create and save the profile
            const profile = new Profile(profileData);
            await profile.save();
            createdProfiles.push(profile);
            console.log(`Created profile: ${profile.name} (age ${profile.age})`);
        }

        res.json({
            success: true,
            message: `Created ${createdProfiles.length} profiles out of ${extractionResult.voters.length} extracted voters`,
            createdProfiles: createdProfiles.map(p => ({ name: p.name, age: p.age })),
            totalExtracted: extractionResult.voters.length
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to process PDF' });
    }
};

exports.uploadMiddleware = upload.single('pdf');