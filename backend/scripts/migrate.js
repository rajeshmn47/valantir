// scripts/migrateToMongo.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const SocialMediaSource = require('../models/SocialMediaSource');
const FaceCluster = require('../models/FaceCluster');
const FaceImage = require('../models/FaceImage');
const Suggestion = require('../models/Suggestion');

// Connect to MongoDB (no deprecated options)
mongoose.connect('mongodb://localhost:27017/peopleintel');

async function migrate() {
  console.log('Starting migration...');

  // 1. Define accounts (add all your account usernames)
  const accounts = ['_eninem', 'balu_since1995']; // extend as needed

  for (const username of accounts) {
    console.log(`\n📁 Processing account: ${username}`);

    // Create or find SocialMediaSource
    let source = await SocialMediaSource.findOne({ username });
    if (!source) {
      source = await SocialMediaSource.create({
        username,
        downloadPath: `D:/instagramscraping/accounts/${username}/downloads`,
        profilePicsPath: `D:/instagramscraping/accounts/${username}/profile_pics`,
        status: 'completed'
      });
      console.log(`  ✅ Created source: ${username}`);
    } else {
      console.log(`  ✅ Source already exists: ${username}`);
    }

    // 2. Import face groups from refined_groups folder
    const groupsDir = `D:/instagramscraping/face_groups/refined_groups`;
    if (!fs.existsSync(groupsDir)) {
      console.log(`  ⚠️ Groups directory not found: ${groupsDir}`);
      continue;
    }

    const items = fs.readdirSync(groupsDir);
    let groupCount = 0;

    for (const item of items) {
      const itemPath = path.join(groupsDir, item);
      // Skip files, only process directories
      if (!fs.statSync(itemPath).isDirectory()) continue;
      // Only process folders that start with 'group_' (adjust if needed)
      if (!item.startsWith('group_')) continue;

      const faceFiles = fs.readdirSync(itemPath).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
      if (faceFiles.length === 0) continue;

      // Load labels from face_labels.json (if exists)
      const labelsPath = 'D:/identity/backend/data/face_labels.json';
      let label = '';
      if (fs.existsSync(labelsPath)) {
        const labels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));
        label = labels[item]?.label || '';
      }

      const cluster = await FaceCluster.create({
        sourceId: source._id,
        clusterName: item,
        label,
        faceCount: faceFiles.length,
        representativeImage: path.join(itemPath, faceFiles[0])
      });
      groupCount++;
      console.log(`    📸 Imported cluster: ${item} → ${label || '(unnamed)'} (${faceFiles.length} faces)`);

      // Insert each face image
      for (const imgFile of faceFiles) {
        await FaceImage.create({
          clusterId: cluster._id,
          imagePath: path.join(itemPath, imgFile),
          sourceImage: 'unknown',
          width: 0,
          height: 0
        });
      }
    }
    console.log(`  ✅ Imported ${groupCount} face clusters for ${username}`);

    // 3. Import suggestions from profile pictures folder
    const profilePicsDir = source.profilePicsPath;
    if (fs.existsSync(profilePicsDir)) {
      const picFiles = fs.readdirSync(profilePicsDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
      let suggestionCount = 0;
      for (const file of picFiles) {
        const usernameSuggestion = path.basename(file, path.extname(file));
        await Suggestion.updateOne(
          { sourceId: source._id, username: usernameSuggestion },
          { $setOnInsert: { profilePicPath: path.join(profilePicsDir, file), fetchedAt: new Date() } },
          { upsert: true }
        );
        suggestionCount++;
      }
      console.log(`  ✅ Imported ${suggestionCount} suggestions for ${username}`);
    } else {
      console.log(`  ⚠️ Profile pictures folder not found: ${profilePicsDir}`);
    }
  }

  console.log('\n🎉 Migration completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});