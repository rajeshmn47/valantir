const stringSimilarity = require('string-similarity');

function calculateProfileSimilarity(profile1, profile2) {
  let score = 0;
  let totalWeight = 0;
  
  // Name similarity (weight: 0.5)
  if (profile1.name && profile2.name) {
    const nameSimilarity = stringSimilarity.compareTwoStrings(
      profile1.name.toLowerCase(),
      profile2.name.toLowerCase()
    );
    score += nameSimilarity * 0.5;
    totalWeight += 0.5;
  }
  
  // Location similarity (weight: 0.3)
  if (profile1.location && profile2.location) {
    const locationSimilarity = stringSimilarity.compareTwoStrings(
      profile1.location.toLowerCase(),
      profile2.location.toLowerCase()
    );
    score += locationSimilarity * 0.3;
    totalWeight += 0.3;
  }
  
  // Work similarity (weight: 0.2)
  if (profile1.work && profile2.work) {
    const workSimilarity = stringSimilarity.compareTwoStrings(
      profile1.work.toLowerCase(),
      profile2.work.toLowerCase()
    );
    score += workSimilarity * 0.2;
    totalWeight += 0.2;
  }
  
  return totalWeight > 0 ? score / totalWeight : 0;
}

async function mergeProfiles(profile1, profile2, Profile) {
  const mergedData = {
    name: profile1.confidenceScore >= profile2.confidenceScore ? profile1.name : profile2.name,
    age: profile1.age || profile2.age,
    location: profile1.location || profile2.location,
    work: profile1.work || profile2.work,
    skills: [...new Set([...profile1.skills, ...profile2.skills])],
    socialLinks: { ...profile1.socialLinks, ...profile2.socialLinks },
    confidenceScore: Math.max(profile1.confidenceScore, profile2.confidenceScore),
    mergedFrom: [...profile1.mergedFrom, ...profile2.mergedFrom, profile1._id, profile2._id]
  };
  
  const mergedProfile = new Profile(mergedData);
  await mergedProfile.save();
  
  // Delete old profiles
  await Profile.deleteOne({ _id: profile1._id });
  await Profile.deleteOne({ _id: profile2._id });
  
  return mergedProfile;
}

module.exports = { calculateProfileSimilarity, mergeProfiles };