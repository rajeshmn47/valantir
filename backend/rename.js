const fs = require('fs');
const path = require('path');

const ORIGINAL_GROUPS = "D:/instagramscraping/face_groups/face_groups";
const REFINED_GROUPS = "D:/instagramscraping/face_groups/refined_groups";
const PREFIX = "orig_";   // prefix for original groups

// Ensure refined_groups exists
if (!fs.existsSync(REFINED_GROUPS)) {
  fs.mkdirSync(REFINED_GROUPS, { recursive: true });
}

// Get list of original group folders
const originalFolders = fs.readdirSync(ORIGINAL_GROUPS)
  .filter(f => f.startsWith('group_'));

let copied = 0;
let skipped = 0;

for (const folder of originalFolders) {
  const src = path.join(ORIGINAL_GROUPS, folder);
  if (!fs.statSync(src).isDirectory()) continue;

  // New name with prefix
  const newName = PREFIX + folder;
  const dest = path.join(REFINED_GROUPS, newName);

  // Skip if destination already exists
  if (fs.existsSync(dest)) {
    console.log(`⏭️ Skipped (already exists): ${newName}`);
    skipped++;
    continue;
  }

  // Copy the entire folder
  fs.cpSync(src, dest, { recursive: true });
  console.log(`✅ Copied and renamed: ${folder} → ${newName}`);
  copied++;
}

console.log(`\n📊 Summary: Copied ${copied} groups, skipped ${skipped} existing.`);