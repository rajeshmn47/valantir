const SocialMediaSource = require('../models/SocialMediaSource');
const FaceCluster = require('../models/FaceCluster');
const FaceImage = require('../models/FaceImage');
const Suggestion = require('../models/Suggestion');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const fsPromises = require('fs').promises;

// Helper to run shell commands
async function runCommand(cmd, logPrefix = '') {
    console.log(`${logPrefix} Running: ${cmd}`);
    try {
        const { stdout, stderr } = await execPromise(cmd);
        if (stderr) console.error(`${logPrefix} stderr:`, stderr);
        console.log(`${logPrefix} stdout:`, stdout);
        return { stdout, stderr };
    } catch (error) {
        console.error(`${logPrefix} Error:`, error);
        throw error;
    }
}

async function getSourceId(username) {
    const source = await SocialMediaSource.findOne({ username });
    if (!source) throw new Error(`Source not found: ${username}`);
    return source._id;
}

// GET /api/sources
exports.getSources = async (req, res) => {
    try {
        const sources = await SocialMediaSource.find({}).select('username');
        res.json(sources.map(s => s.username));
    } catch (error) {
        console.error('Error fetching sources:', error);
        res.status(500).json({ error: 'Failed to fetch sources' });
    }
};

// GET /api/face-groups?source=username
exports.getFaceGroups = async (req, res) => {
    try {
        const { source } = req.query;
        if (!source) return res.status(400).json({ error: 'Missing source parameter' });
        const sourceId = await getSourceId(source);
        const clusters = await FaceCluster.find({ sourceId })
            .select('clusterName label faceCount representativeImage')
            .sort({ faceCount: -1 });
        const groups = clusters.map(c => ({
            id: c.clusterName,
            img: `${req.protocol}://${req.get('host')}/groups/${source}/${c.clusterName}/${path.basename(c.representativeImage)}`,
            size: c.faceCount,
            label: c.label || ''
        }));
        res.json(groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Failed to fetch face groups' });
    }
};

// GET /api/face-labels?source=username
exports.getFaceLabels = async (req, res) => {
    try {
        const { source } = req.query;
        if (!source) return res.status(400).json({ error: 'Missing source parameter' });
        const sourceId = await getSourceId(source);
        const clusters = await FaceCluster.find({ sourceId }).select('clusterName label updatedAt createdAt');
        const labels = {};
        clusters.forEach(c => {
            labels[c.clusterName] = {
                label: c.label || '',
                lastUpdated: c.updatedAt || c.createdAt
            };
        });
        res.json(labels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Failed to fetch face labels' });
    }
};

// POST /api/face-labels?source=username
exports.postFaceLabels = async (req, res) => {
    try {
        const { source } = req.query;
        if (!source) return res.status(400).json({ error: 'Missing source parameter' });
        const sourceId = await getSourceId(source);
        const labelsUpdate = req.body;
        for (const [clusterName, info] of Object.entries(labelsUpdate)) {
            const label = info.label?.trim();
            if (!label) continue;
            const cluster = await FaceCluster.findOne({ sourceId, clusterName });
            if (cluster && cluster.label !== label) {
                cluster.labelHistory.push({ oldLabel: cluster.label, newLabel: label, changedAt: new Date() });
                cluster.label = label;
                await cluster.save();
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Failed to save face labels' });
    }
};

// GET /api/suggestions?source=username
exports.getSuggestions = async (req, res) => {
    try {
        const { source } = req.query;
        if (!source) return res.status(400).json({ error: 'Missing source parameter' });
        const sourceId = await getSourceId(source);
        const suggestions = await Suggestion.find({ sourceId, isUsed: false })
            .limit(100)
            .select('username');
        res.json(suggestions.map(s => s.username));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Failed to fetch suggestions' });
    }
};

// POST /api/sources
exports.createSource = async (req, res) => {
    try {
        const { username, downloadPath, profilePicsPath, platform = 'instagram' } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const existing = await SocialMediaSource.findOne({ username });
        if (existing) {
            return res.status(409).json({ error: 'Source already exists' });
        }
        const source = await SocialMediaSource.create({
            username,
            platform,
            downloadPath: downloadPath || `D:/instagramscraping/accounts/${username}/downloads`,
            profilePicsPath: profilePicsPath || `D:/instagramscraping/accounts/${username}/profile_pics`,
            status: 'pending'
        });
        res.status(201).json({ _id: source._id, username: source.username });
    } catch (error) {
        console.error('Error creating source:', error);
        res.status(500).json({ error: 'Failed to create source' });
    }
};

// ========================
// Face extraction & clustering pipeline (Python)
// ========================

async function runPipelineForSource(source) {
    const username = source.username;
    const downloadDir = source.downloadPath;
    const extractionDir = `D:/instagramscraping/face_extractions/${username}`;
    const groupsDir = `D:/instagramscraping/face_groups/${username}`;

    for (const dir of [extractionDir, groupsDir]) {
        if (!fs.existsSync(dir)) {
            await fsPromises.mkdir(dir, { recursive: true });
        }
    }

    console.log(`[${username}] Extracting faces...`);
    const extractCmd = `python C:/Users/Lenovo/pythonocr/instagram/face_tool/extract_faces.py --input "${downloadDir}" --output "${extractionDir}"`;
    await runCommand(extractCmd, `[${username}]`);

    console.log(`[${username}] Clustering faces...`);
    const clusterCmd = `python C:/Users/Lenovo/pythonocr/instagram/face_tool/cluster_faces.py --input "${extractionDir}" --output "${groupsDir}"`;
    await runCommand(clusterCmd, `[${username}]`);

    await importGroupsForSource(source._id, groupsDir);

    source.status = 'completed';
    source.lastProcessed = new Date();
    await source.save();
    console.log(`[${username}] Pipeline completed.`);
}

async function importGroupsForSource(sourceId, groupsDir) {
    const items = await fsPromises.readdir(groupsDir);
    for (const item of items) {
        const groupPath = path.join(groupsDir, item);
        const stat = await fsPromises.stat(groupPath);
        if (!stat.isDirectory()) continue;

        const faceFiles = (await fsPromises.readdir(groupPath)).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        if (faceFiles.length === 0) continue;

        const representative = path.join(groupPath, faceFiles[0]);

        let cluster = await FaceCluster.findOne({ sourceId, clusterName: item });
        if (!cluster) {
            cluster = new FaceCluster({
                sourceId,
                clusterName: item,
                faceCount: faceFiles.length,
                representativeImage: representative,
            });
        } else {
            cluster.faceCount = faceFiles.length;
            cluster.representativeImage = representative;
        }
        await cluster.save();

        for (const faceFile of faceFiles) {
            const imagePath = path.join(groupPath, faceFile);
            const existing = await FaceImage.findOne({ clusterId: cluster._id, imagePath });
            if (!existing) {
                await FaceImage.create({
                    clusterId: cluster._id,
                    imagePath,
                    sourceImage: 'unknown',
                });
            }
        }
    }
}

// POST /api/process-source
exports.processSource = async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const source = await SocialMediaSource.findOne({ username });
    if (!source) return res.status(404).json({ error: 'Source not found' });
    if (source.status === 'processing') return res.status(409).json({ error: 'Already processing' });

    source.status = 'processing';
    await source.save();

    runPipelineForSource(source).catch(async (err) => {
        console.error(`Pipeline failed for ${username}:`, err);
        source.status = 'error';
        await source.save();
    });

    res.json({ message: `Processing started for ${username}` });
};

// GET /api/process-status?source=username
exports.getProcessStatus = async (req, res) => {
    const { source } = req.query;
    if (!source) return res.status(400).json({ error: 'Missing source parameter' });
    const src = await SocialMediaSource.findOne({ username: source }).select('status lastProcessed');
    if (!src) return res.status(404).json({ error: 'Source not found' });
    res.json({ status: src.status, lastProcessed: src.lastProcessed });
};

// ========================
// Annotation pipeline (Python)
// ========================

// Helper to generate labels JSON file from MongoDB
async function generateLabelsFileForSource(sourceId, outputPath) {
    const clusters = await FaceCluster.find({ sourceId }).select('clusterName label');
    const labels = {};
    clusters.forEach(c => {
        if (c.label && c.label.trim() !== '') {
            labels[c.clusterName] = c.label;
        }
    });
    fs.writeFileSync(outputPath, JSON.stringify(labels, null, 2));
    console.log(`Generated labels file at ${outputPath}`);
}

async function runAnnotationForSource(source) {
    const username = source.username;
    const groupsDir = `D:/instagramscraping/face_groups/${username}`;
    const inputFolder = source.downloadPath;
    const outputDir = `D:/instagramscraping/annotated/${username}`;
    const labelsFile = `D:/instagramscraping/annotated/${username}_labels.json`;

    if (!fs.existsSync(groupsDir)) {
        console.error(`Groups directory not found: ${groupsDir}`);
        return;
    }

    if (!fs.existsSync(outputDir)) {
        await fsPromises.mkdir(outputDir, { recursive: true });
    }

    await generateLabelsFileForSource(source._id, labelsFile);

    const cmd = `python C:/Users/Lenovo/pythonocr/instagram/annotate_folder.py --training "${groupsDir}" --input "${inputFolder}" --output "${outputDir}" --labels "${labelsFile}" --tolerance 0.5 --min-confidence 60`;
    await runCommand(cmd, `[${username}] Annotation`);
}

// POST /api/annotate-source
exports.annotateSource = async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const source = await SocialMediaSource.findOne({ username });
    if (!source) return res.status(404).json({ error: 'Source not found' });

    runAnnotationForSource(source).catch(async (err) => {
        console.error(`Annotation failed for ${username}:`, err);
    });

    res.json({ message: `Annotation started for ${username}` });
};

// GET /api/annotation-status?source=username
exports.getAnnotationStatus = async (req, res) => {
    const { source } = req.query;
    if (!source) return res.status(400).json({ error: 'Missing source parameter' });
    // For simplicity, we don't track annotation status separately yet.
    // You could extend this to read a status file or add a field to SocialMediaSource.
    // Here we just return a placeholder.
    res.json({ status: 'idle', lastAnnotated: null });
};

// GET /api/annotated-images?source=username
exports.getAnnotatedImages = async (req, res) => {
    const { source } = req.query;
    if (!source) return res.status(400).json({ error: 'Missing source parameter' });

    const annotatedDir = `D:/instagramscraping/annotated/${source}`;
    if (!fs.existsSync(annotatedDir)) {
        return res.json({ images: [] });
    }

    const files = await fsPromises.readdir(annotatedDir);
    const images = files
        .filter(f => /\.(jpg|jpeg|png|bmp)$/i.test(f))
        .map(f => `/annotated/${source}/${f}`);  // we will serve static files

    res.json({ images });
};

// GET /api/stats?source=username&startHour=8&endHour=20
exports.getStatss = async (req, res) => {
    const { source, startHour, endHour } = req.query;
    if (!source) return res.status(400).json({ error: 'Missing source parameter' });

    const sourceDoc = await SocialMediaSource.findOne({ username: source });
    if (!sourceDoc) return res.status(404).json({ error: 'Source not found' });

    const downloadPath = sourceDoc.downloadPath;
    const sourceId = sourceDoc._id;

    // 1. Count original photos with timestamps
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp'];
    let allFiles = [];
    if (fs.existsSync(downloadPath)) {
        allFiles = fs.readdirSync(downloadPath).filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));
    }
    const totalPhotos = allFiles.length;

    // Helper to get file timestamp (modification time)
    const getFileHour = (filePath) => {
        try {
            const stats = fs.statSync(filePath);
            return stats.mtime.getHours(); // hour of day (0‑23)
        } catch (e) {
            return null;
        }
    };

    // Gather photo timestamps (hour)
    const photoHours = [];
    for (const file of allFiles) {
        const hour = getFileHour(path.join(downloadPath, file));
        if (hour !== null) photoHours.push(hour);
    }

    // 2. Get all face images with their source photo path and cluster info
    const faceImages = await FaceImage.find({})
        .populate('clusterId')
        .lean();

    // Map source photo path → list of faces (and their cluster labels)
    const photoFaces = new Map();
    for (const img of faceImages) {
        if (img.clusterId && img.clusterId.sourceId.toString() === sourceId.toString() && img.sourceImage) {
            const photoPath = img.sourceImage;
            if (!photoFaces.has(photoPath)) photoFaces.set(photoPath, []);
            photoFaces.get(photoPath).push(img);
        }
    }

    // 3. Aggregate stats per hour
    const hourlyStats = {};
    for (let hour = 0; hour < 24; hour++) {
        hourlyStats[hour] = {
            photos: 0,
            totalFaces: 0,
            knownFaces: 0,
            unknownFaces: 0,
            uniquePersons: new Set()
        };
    }

    // For each photo, get its hour and add its faces
    for (const [photoPath, faces] of photoFaces.entries()) {
        let hour = getFileHour(photoPath);
        if (hour === null) hour = 0; // fallback
        if (startHour !== undefined && endHour !== undefined) {
            const start = parseInt(startHour);
            const end = parseInt(endHour);
            if (hour < start || hour > end) continue; // filter by hour range
        }
        hourlyStats[hour].photos++;
        hourlyStats[hour].totalFaces += faces.length;
        for (const face of faces) {
            const label = face.clusterId?.label;
            if (label && label.trim() !== '') {
                hourlyStats[hour].knownFaces++;
                hourlyStats[hour].uniquePersons.add(label);
            } else {
                hourlyStats[hour].unknownFaces++;
            }
        }
    }

    // Convert hour buckets to arrays
    const hourlyBreakdown = [];
    for (let hour = 0; hour < 24; hour++) {
        if (startHour !== undefined && endHour !== undefined) {
            const start = parseInt(startHour);
            const end = parseInt(endHour);
            if (hour < start || hour > end) continue;
        }
        hourlyBreakdown.push({
            hour,
            photos: hourlyStats[hour].photos,
            totalFaces: hourlyStats[hour].totalFaces,
            knownFaces: hourlyStats[hour].knownFaces,
            unknownFaces: hourlyStats[hour].unknownFaces,
            uniquePersons: hourlyStats[hour].uniquePersons.size
        });
    }

    // Overall totals
    const totalFaces = hourlyBreakdown.reduce((sum, h) => sum + h.totalFaces, 0);
    const unknownFaces = hourlyBreakdown.reduce((sum, h) => sum + h.unknownFaces, 0);
    const uniquePersonsSet = new Set();
    for (let hour = 0; hour < 24; hour++) {
        hourlyStats[hour].uniquePersons.forEach(p => uniquePersonsSet.add(p));
    }

    res.json({
        totalPhotos,
        totalFaces,
        unknownFaces,
        uniquePersons: uniquePersonsSet.size,
        hourlyBreakdown
    });
};


exports.getStats = async (req, res) => {
    const { source, startHour, endHour } = req.query;
    if (!source) return res.status(400).json({ error: 'Missing source parameter' });

    const sourceDoc = await SocialMediaSource.findOne({ username: source });
    if (!sourceDoc) return res.status(404).json({ error: 'Source not found' });

    const downloadPath = sourceDoc.downloadPath;
    const sourceId = sourceDoc._id;

    // 1. Count all original images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp'];
    let allFiles = [];
    if (fs.existsSync(downloadPath)) {
        allFiles = fs.readdirSync(downloadPath).filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));
    }
    const totalImagesInFolder = allFiles.length;

    // Helper: reconstruct original photo path from cropped face path
    const getOriginalPhotoPath = (croppedFacePath) => {
        const croppedFileName = path.basename(croppedFacePath);
        // Remove "_face_N" or "_face_NN" suffix
        const originalFileName = croppedFileName.replace(/_(face_\d+)(\.\w+)$/, '$2');
        const candidate = path.join(downloadPath, originalFileName);
        return fs.existsSync(candidate) ? candidate : null;
    };

    // Helper: extract year and hour from original filename (Unix timestamp inside)
    const getYearAndHourFromOriginal = (originalFilePath) => {
        const filename = path.basename(originalFilePath);
        const match = filename.match(/(\d{10})/);  // 10-digit Unix seconds
        if (match && match[1]) {
            const date = new Date(parseInt(match[1]) * 1000);
            return {
                year: date.getUTCFullYear(),
                hour: date.getUTCHours()   // Use UTC for consistency
            };
        }
        // Fallback to file modification time
        try {
            const stats = fs.statSync(originalFilePath);
            return {
                year: stats.mtime.getUTCFullYear(),
                hour: stats.mtime.getUTCHours()
            };
        } catch (e) {
            return null;
        }
    };

    // 2. Get all face images with cluster info
    const faceImages = await FaceImage.find({})
        .populate('clusterId')
        .lean();

    // Map original photo path → list of faces
    const photoFaces = new Map();
    for (const img of faceImages) {
        if (!img.clusterId || img.clusterId.sourceId?.toString() !== sourceId.toString()) continue;

        let originalPath = null;
        if (img.sourceImage && img.sourceImage !== 'unknown') {
            originalPath = img.sourceImage;
        } else {
            originalPath = getOriginalPhotoPath(img.imagePath);
        }
        if (!originalPath) continue;

        if (!photoFaces.has(originalPath)) photoFaces.set(originalPath, []);
        photoFaces.get(originalPath).push(img);
    }

    // 3. Aggregate stats by (year, hour)
    const yearHourStats = new Map(); // key = "year_hour", value = stats object

    // Helper to get or create a bucket
    const getBucket = (year, hour) => {
        const key = `${year}_${hour}`;
        if (!yearHourStats.has(key)) {
            yearHourStats.set(key, {
                year,
                hour,
                photos: 0,
                totalFaces: 0,
                knownFaces: 0,
                unknownFaces: 0,
                uniquePersons: new Set()
            });
        }
        return yearHourStats.get(key);
    };

    const allUniquePersons = new Set();
    const photosWithFacesSet = new Set();

    for (const [originalPath, faces] of photoFaces.entries()) {
        const info = getYearAndHourFromOriginal(originalPath);
        if (!info) continue;

        let { year, hour } = info;

        // Apply hour range filter (optional)
        if (startHour !== undefined && endHour !== undefined) {
            const start = parseInt(startHour);
            const end = parseInt(endHour);
            if (hour < start || hour > end) continue;
        }

        photosWithFacesSet.add(originalPath);
        const bucket = getBucket(year, hour);
        bucket.photos++;
        bucket.totalFaces += faces.length;

        for (const face of faces) {
            const label = face.clusterId?.label;
            if (label && label.trim() !== '') {
                bucket.knownFaces++;
                bucket.uniquePersons.add(label);
                allUniquePersons.add(label);
            } else {
                bucket.unknownFaces++;
            }
        }
    }

    // Convert to sorted array
    const yearlyHourlyBreakdown = Array.from(yearHourStats.values())
        .map(b => ({
            year: b.year,
            hour: b.hour,
            photos: b.photos,
            totalFaces: b.totalFaces,
            knownFaces: b.knownFaces,
            unknownFaces: b.unknownFaces,
            uniquePersons: b.uniquePersons.size
        }))
        .sort((a, b) => a.year - b.year || a.hour - b.hour);

    // Overall totals
    const totalFaces = yearlyHourlyBreakdown.reduce((s, h) => s + h.totalFaces, 0);
    const unknownFaces = yearlyHourlyBreakdown.reduce((s, h) => s + h.unknownFaces, 0);

    res.json({
        totalImagesInFolder,
        totalPhotosWithFaces: photosWithFacesSet.size,
        totalFaces,
        unknownFaces,
        uniquePersons: allUniquePersons.size,
        yearlyHourlyBreakdown   // main data for the frontend
    });
};

// GET /api/photos-by-hour?source=username&year=2021&hour=6
exports.getPhotosByHour = async (req, res) => {
    const { source, year, hour } = req.query;
    if (!source || !year || hour === undefined) {
        return res.status(400).json({ error: 'Missing source, year, or hour parameter' });
    }

    const sourceDoc = await SocialMediaSource.findOne({ username: source });
    if (!sourceDoc) return res.status(404).json({ error: 'Source not found' });

    const downloadPath = sourceDoc.downloadPath;
    const annotatedBase = `D:/instagramscraping/annotated/${source}`;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp'];

    // 1. List all original images in the download folder
    let allFiles = [];
    if (fs.existsSync(downloadPath)) {
        allFiles = fs.readdirSync(downloadPath).filter(f =>
            imageExtensions.includes(path.extname(f).toLowerCase())
        );
    }

    // 2. Helper to get year and hour from filename (Unix timestamp)
    const getYearAndHour = (filename) => {
        const match = filename.match(/(\d{10})/);
        if (!match) return null;
        const date = new Date(parseInt(match[1]) * 1000);
        return {
            year: date.getUTCFullYear(),
            hour: date.getUTCHours()
        };
    };

    const resultImages = [];

    for (const file of allFiles) {
        const yh = getYearAndHour(file);
        if (!yh) continue;
        if (yh.year == year && yh.hour == hour) {
            // Prefer annotated version if exists
            const annotatedPath = path.join(annotatedBase, file);
            let url = null;
            if (fs.existsSync(annotatedPath)) {
                url = `/annotated/${source}/${file}`;
            } else if (fs.existsSync(path.join(downloadPath, file))) {
                // Fallback to original image (no annotations)
                url = `/original/${source}/downloads/${file}`;
                // Note: you must also serve static files for '/original'
                // app.use('/original', express.static('D:/instagramscraping/accounts'));
            }
            if (url) resultImages.push(url);
        }
    }

    res.json({ images: resultImages });
};

const XLSX = require('xlsx');

// Simple in‑memory cache: { sourceUsername: [usernames] }
const followerCache = {};

function getFollowersFromExcel(source) {
    if (followerCache[source]) return followerCache[source];

    const excelPath = `D:/instagramscraping/accounts/${source}/followers.xlsx`;
    if (!fs.existsSync(excelPath)) return [];

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Assuming column index 2 (third column) contains usernames – adjust if different
    const usernames = rows.slice(1).map(row => row[6]).filter(v => v && v !== 'nan').map(v => String(v));
    followerCache[source] = usernames;
    return usernames;
}

exports.autocompleteLabels = async (req, res) => {
    const { source, q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    // 1. Existing cluster labels (global, not per source)
    const clusters = await FaceCluster.find({
        label: { $regex: '^' + q, $options: 'i' },
        label: { $ne: null, $ne: '' }
    }).limit(10).select('label');
    const clusterNames = clusters.map(c => c.label);

    // 2. Usernames from the selected source's followers Excel
    const excelNames = source ? getFollowersFromExcel(source) : [];
    const matchedExcel = excelNames
        .filter(name => name.toLowerCase().startsWith(q.toLowerCase()))
        .slice(0, 10);

    // Combine and deduplicate
    const suggestions = [...new Set([...clusterNames, ...matchedExcel])].sort();
    res.json(suggestions.slice(0, 20));
};

exports.autoLabel = async (req, res) => {
    const { source } = req.body;
    if (!source) return res.status(400).json({ error: 'Missing source' });

    const scriptPath = 'C:/Users/Lenovo/pythonocr/instagram/auto_label_clusters.py';
    const cmd = `python "${scriptPath}" --source "${source}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Auto-label error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }
        console.log(stdout);
        res.json({ message: 'Auto‑labeling completed', output: stdout });
    });
};

// GET /api/cluster-images?source=username&clusterId=group_0001
// GET /api/cluster-images?source=username&clusterId=group_0001
exports.getClusterImages = async (req, res) => {
    const { source, clusterId } = req.query;
    if (!source || !clusterId) {
        return res.status(400).json({ error: 'Missing source or clusterId' });
    }

    const sourceDoc = await SocialMediaSource.findOne({ username: source });
    if (!sourceDoc) return res.status(404).json({ error: 'Source not found' });

    const sourceId = sourceDoc._id;
    const groupsBase = `/groups/${source}`;

    // Find the cluster
    const cluster = await FaceCluster.findOne({ sourceId, clusterName: clusterId });
    if (!cluster) {
        return res.status(404).json({ error: 'Cluster not found' });
    }

    // Find all face images belonging to this cluster
    const faceImages = await FaceImage.find({ clusterId: cluster._id })
        .select('imagePath')
        .lean();

    // Get all cropped face images
    const photos = [];

    for (const face of faceImages) {
        const croppedPath = face.imagePath;
        const croppedFilename = path.basename(croppedPath);

        // Build the URL to serve the cropped face image
        // Path pattern: /face_groups/{source}/{clusterName}/{filename}
        const imageUrl = `/groups/${source}/${clusterId}/${croppedFilename}`;

        // Check if file exists
        let exists = false;
        try {
            await fsPromises.access(croppedPath);
            exists = true;
        } catch (e) {
            console.log(`Face image not found: ${croppedPath}`);
        }
        if (!exists) continue;

        // Get timestamp from filename for sorting (if present)
        const match = croppedFilename.match(/(\d{10})/);
        let date = null, hour = null;
        if (match) {
            const timestamp = new Date(parseInt(match[1]) * 1000);
            date = timestamp.toISOString().slice(0, 10);
            hour = timestamp.getHours();
        }

        photos.push({
            filename: croppedFilename,
            date,
            hour,
            imageUrl
        });
    }

    res.json({
        clusterName: cluster.clusterName,
        label: cluster.label || '',
        faceCount: faceImages.length,
        photoCount: photos.length,
        photos
    });
};

// GET /api/network?source=username
// GET /api/network?source=username
exports.getNetwork = async (req, res) => {
    const { source } = req.query;
    if (!source) return res.status(400).json({ error: 'Missing source parameter' });

    const sourceDoc = await SocialMediaSource.findOne({ username: source });
    if (!sourceDoc) return res.status(404).json({ error: 'Source not found' });

    const sourceId = sourceDoc._id;
    const downloadPath = sourceDoc.downloadPath;

    // Get all clusters for this source
    const clusters = await FaceCluster.find({ sourceId })
        .select('clusterName label faceCount representativeImage')
        .lean();

    console.log(`Found ${clusters.length} raw clusters`);

    // STEP 1: Merge clusters with the SAME LABEL
    const labelGroups = new Map();
    for (const cluster of clusters) {
        const label = cluster.label?.trim();
        if (label) {
            if (!labelGroups.has(label)) labelGroups.set(label, []);
            labelGroups.get(label).push(cluster);
        }
    }

    // STEP 2: Merge clusters with SIMILAR FACE ENCODINGS (if no label)
    // We'll use a similarity threshold to merge unlabeled clusters

    // Build representative image paths for unlabeled clusters
    const unlabeledClusters = clusters.filter(c => !c.label || !c.label.trim());

    // You can call a Python script to compute face encoding similarity
    // Or use a simpler approach: clusters that share many common photos

    // STEP 3: Merge clusters that appear in the SAME PHOTOS frequently
    // Get all face images
    const faceImages = await FaceImage.find({})
        .populate('clusterId')
        .lean();

    // Build photo -> cluster mapping
    const photoClusters = new Map(); // photoPath -> Set of clusterIds
    const clusterPhotos = new Map(); // clusterId -> Set of photoPaths

    for (const face of faceImages) {
        const cluster = face.clusterId;
        if (!cluster || cluster.sourceId?.toString() !== sourceId.toString()) continue;

        const clusterId = cluster._id.toString();
        let photoPath = face.sourceImage;

        if (!photoPath || photoPath === 'unknown') {
            const croppedFileName = path.basename(face.imagePath);
            const originalFileName = croppedFileName.replace(/_(face_\d+)(\.\w+)$/, '$2');
            photoPath = path.join(downloadPath, originalFileName);
        }

        if (!photoPath) continue;

        if (!photoClusters.has(photoPath)) photoClusters.set(photoPath, new Set());
        photoClusters.get(photoPath).add(clusterId);

        if (!clusterPhotos.has(clusterId)) clusterPhotos.set(clusterId, new Set());
        clusterPhotos.get(clusterId).add(photoPath);
    }

    // Find clusters that share many photos (same person)
    const mergeGroups = [];
    const processedClusters = new Set();

    for (const cluster of clusters) {
        const clusterId = cluster._id.toString();
        if (processedClusters.has(clusterId)) continue;

        const photos1 = clusterPhotos.get(clusterId) || new Set();
        const group = [cluster];
        processedClusters.add(clusterId);

        // Find other clusters that share > 30% of photos with this cluster
        for (const otherCluster of clusters) {
            const otherId = otherCluster._id.toString();
            if (processedClusters.has(otherId)) continue;

            const photos2 = clusterPhotos.get(otherId) || new Set();

            // Calculate overlap
            let overlap = 0;
            for (const photo of photos1) {
                if (photos2.has(photo)) overlap++;
            }

            const overlapRatio = overlap / Math.min(photos1.size, photos2.size);

            // If they share > 30% of photos, they're likely the same person
            if (overlapRatio > 0.3 && overlap > 2) {
                group.push(otherCluster);
                processedClusters.add(otherId);
            }
        }

        if (group.length > 1) {
            mergeGroups.push(group);
        }
    }

    console.log(`Identified ${mergeGroups.length} groups of clusters to merge`);

    // STEP 4: Create merged person records
    const personMap = new Map(); // original clusterId -> merged person id
    const persons = []; // final list of persons for the graph
    let personCounter = 0;

    // First, handle merged groups
    for (const group of mergeGroups) {
        const personId = `person_${personCounter++}`;
        const primaryCluster = group.reduce((a, b) =>
            (a.faceCount > b.faceCount) ? a : b
        );

        // Use the label from the largest cluster, or combine
        const labels = group.map(c => c.label).filter(l => l && l.trim());
        const label = labels.length > 0 ? labels[0] : primaryCluster.clusterName;

        // Combine all photos from all clusters
        const allPhotos = new Set();
        for (const cluster of group) {
            const clusterId = cluster._id.toString();
            const photos = clusterPhotos.get(clusterId) || new Set();
            for (const photo of photos) {
                allPhotos.add(photo);
            }
            personMap.set(clusterId, personId);
        }

        const totalAppearances = allPhotos.size;
        const totalFaces = group.reduce((sum, c) => sum + c.faceCount, 0);

        persons.push({
            id: personId,
            label: label,
            appearances: totalAppearances,
            faceCount: totalFaces,
            mergedFrom: group.map(c => c.clusterName),
            representativeImage: primaryCluster.representativeImage,
            size: Math.sqrt(totalAppearances) * 10
        });
    }

    // Now handle unmerged clusters (each becomes its own person)
    for (const cluster of clusters) {
        const clusterId = cluster._id.toString();
        if (personMap.has(clusterId)) continue;

        const personId = `person_${personCounter++}`;
        personMap.set(clusterId, personId);

        const photos = clusterPhotos.get(clusterId) || new Set();

        persons.push({
            id: personId,
            label: cluster.label || cluster.clusterName,
            appearances: photos.size,
            faceCount: cluster.faceCount,
            representativeImage: cluster.representativeImage,
            size: Math.sqrt(photos.size) * 10
        });
    }

    console.log(`Reduced ${clusters.length} clusters to ${persons.length} persons`);

    // STEP 5: Build edges between persons (using the merged photo mapping)
    const edges = new Map(); // key: "personA|personB", value: weight
    const personPhotoMap = new Map(); // personId -> Set of photoPaths

    // Build person -> photos mapping
    for (const cluster of clusters) {
        const clusterId = cluster._id.toString();
        const personId = personMap.get(clusterId);
        if (!personId) continue;

        const photos = clusterPhotos.get(clusterId) || new Set();
        if (!personPhotoMap.has(personId)) personPhotoMap.set(personId, new Set());
        for (const photo of photos) {
            personPhotoMap.get(personId).add(photo);
        }
    }

    // Now build edges based on co-appearance in photos
    for (const [photoPath, clusterIdsInPhoto] of photoClusters.entries()) {
        // Get the persons for each cluster in this photo
        const personsInPhoto = new Set();
        for (const clusterId of clusterIdsInPhoto) {
            const personId = personMap.get(clusterId);
            if (personId) personsInPhoto.add(personId);
        }

        const personList = Array.from(personsInPhoto);
        for (let i = 0; i < personList.length; i++) {
            for (let j = i + 1; j < personList.length; j++) {
                const personA = personList[i];
                const personB = personList[j];
                const key = [personA, personB].sort().join('|');
                edges.set(key, (edges.get(key) || 0) + 1);
            }
        }
    }

    // Build edges list
    const edgesList = [];
    for (const [key, weight] of edges.entries()) {
        const [source, target] = key.split('|');
        edgesList.push({
            source,
            target,
            weight,
            width: Math.min(weight * 2, 10)
        });
    }

    res.json({
        nodes: persons,
        edges: edgesList,
        totalPhotos: photoClusters.size,
        totalPeople: persons.length,
        totalRawClusters: clusters.length,
        totalMerged: mergeGroups.length,
        totalCoAppearances: edgesList.length
    });
};

exports.downloadProfiles = async (req, res) => {
    const { sourceUsername } = req.body;
    const excelPath = `D:/instagramscraping/accounts/${sourceUsername}/followers.xlsx`;
    const outputFolder = `D:/instagramscraping/accounts/${sourceUsername}/downloaded_profiles`;
    const cookieFile = `C:/Users/Lenovo/pythonocr/instagram/cookies.txt`;

    const pythonScript = 'C:/Users/Lenovo/pythonocr/instagram/download_profiles_api.py';
    const cmd = `python "${pythonScript}" "${sourceUsername}" "${excelPath}" "${outputFolder}" "${cookieFile}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: stderr });
        try {
            const result = JSON.parse(stdout);
            res.json(result);
        } catch (e) {
            res.status(500).json({ error: 'Failed to parse Python output', raw: stdout });
        }
    });
}

exports.checkFollowersFile = async (req, res) => {
    const { source } = req.query;
    if (!source) return res.status(400).json({ error: 'Missing source parameter' });
    const excelPath = `D:/instagramscraping/accounts/${source}/followers.xlsx`;
    const exists = fs.existsSync(excelPath);
    res.json({ exists });
};