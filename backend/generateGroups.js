const fs = require('fs');
const path = require('path');

// ===== CONFIGURATION =====
// Use forward slashes (works on Windows too) or double backslashes
const REFINED_GROUPS_DIR = "D:/instagramscraping/face_groups/refined_groups"; // Path to your refined groups folder

// Output folder for groups.json (inside backend/data/)
const OUTPUT_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'groups.json');

// ===== Helper: Convert image to base64 data URL =====
function imageToBase64(filePath) {
  const data = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${data.toString('base64')}`;
}

// ===== Main =====
function generateGroups() {
  if (!fs.existsSync(REFINED_GROUPS_DIR)) {
    console.error(`❌ Refined groups folder not found: ${REFINED_GROUPS_DIR}`);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const groups = [];
  const folders = fs.readdirSync(REFINED_GROUPS_DIR);

  for (const folder of folders) {
    if (!folder.startsWith('group_')&&(!folder.startsWith('orig_'))&&(!folder.startsWith('person_'))) continue;
    const groupPath = path.join(REFINED_GROUPS_DIR, folder);
    if (!fs.statSync(groupPath).isDirectory()) continue;

    // Get all image files in the group folder
    const files = fs.readdirSync(groupPath).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    if (files.length === 0) continue;

    // Use the first image as representative
    const firstImage = path.join(groupPath, files[0]);
    const imgBase64 = imageToBase64(firstImage);

    groups.push({
      id: folder,
      img: imgBase64,
      size: files.length,
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(groups, null, 2));
  console.log(`✅ Generated groups.json with ${groups.length} groups at ${OUTPUT_FILE}`);
}

generateGroups();