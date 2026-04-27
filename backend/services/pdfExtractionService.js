const pdfParse = require('pdf-parse');
const { pdfToPng } = require('pdf-to-png-converter');
const Tesseract = require('tesseract.js');

function isValidVoter(voter) {
    if (!voter.name || voter.name.length < 2) return false;
    if (voter.age && (voter.age < 18 || voter.age > 120)) return false;
    // Allow names with letters, spaces, dots, hyphens, apostrophes, and even numbers (e.g., "7.0. Arunakumar")
    const cleaned = voter.name.replace(/[^A-Za-z0-9\s\.\'\-]/g, '').trim();
    if (cleaned.length < 2) return false;
    return true;
}

// Simple, robust extraction: scan line by line
function extractVotersFromText(text) {
    const voters = [];
    const lines = text.split('\n');
    const totalLines = lines.length;
    
    for (let i = 0; i < totalLines; i++) {
        const line = lines[i];
        // Look for "Name :" (case insensitive)
        if (!line.match(/Name\s*:/i)) continue;
        
        // Extract name: everything after "Name :" until end of line
        let name = line.replace(/.*Name\s*:\s*/i, '').trim();
        // Remove trailing "Photo" or garbage
        name = name.replace(/\s*Photo\s*$/i, '').trim();
        // Remove Kannada characters (keep English letters, digits, spaces, dots, hyphens, apostrophes)
        name = name.replace(/[^A-Za-z0-9\s\.\'\-]/g, '').trim();
        if (name.length < 2) continue;
        
        // Now look for age in the current line or next 3 lines
        let age = null;
        let gender = null;
        for (let j = i; j <= Math.min(i + 3, totalLines - 1); j++) {
            const ageLine = lines[j];
            const ageMatch = ageLine.match(/Age\s*(?::|\+)\s*(\d{1,3})/i);
            if (ageMatch) {
                age = parseInt(ageMatch[1]);
                // Also try to find gender on the same line
                const genderMatch = ageLine.match(/Gender\s*:\s*(Male|Female)/i);
                if (genderMatch) gender = genderMatch[1];
                break;
            }
        }
        
        // Skip if age is missing or invalid
        if (!age || age < 18 || age > 120) continue;
        
        voters.push({ name, parent: '', age, gender: gender || '', houseNumber: '' });
    }
    
    // Deduplicate by name+age
    const unique = [];
    const seen = new Set();
    for (const v of voters) {
        const key = `${v.name}|${v.age}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(v);
        }
    }
    return unique;
}

async function pdfToImageBuffers(fileBuffer, maxPages = null, scale = 2.0) {
    const pngPages = await pdfToPng(fileBuffer, {
        viewportScale: scale,
        outputFolder: undefined,
        verbosityLevel: 0
    });
    if (maxPages) return pngPages.slice(0, maxPages).map(page => page.content);
    return pngPages.map(page => page.content);
}

async function extractFromPDF(fileBuffer, fileName, options = {}) {
    const { ocrLanguage = 'kan+eng', maxPages = null, viewportScale = 2.0 } = options;
    try {
        let text = '';
        // Try direct text extraction
        try {
            const pdfData = await pdfParse(fileBuffer);
            text = pdfData.text || '';
            console.log(`pdf-parse extracted ${text.length} chars`);
        } catch (err) {
            console.log('pdf-parse failed:', err.message);
        }

        // If insufficient text, use OCR on all pages
        if (!text || text.trim().length < 100) {
            console.log(`Using OCR (${ocrLanguage}) on ${maxPages ? `first ${maxPages}` : 'all'} pages...`);
            const imageBuffers = await pdfToImageBuffers(fileBuffer, maxPages, viewportScale);
            for (let i = 0; i < imageBuffers.length; i++) {
                console.log(`OCR page ${i+1}/${imageBuffers.length}...`);
                const { data: { text: ocrText } } = await Tesseract.recognize(imageBuffers[i], ocrLanguage,{})
                text += ocrText + '\n';
            }
        }

        if (!text || text.trim().length === 0) {
            throw new Error('No text could be extracted');
        }

        console.log(`Total text length: ${text.length} chars`);
        
        const voters = extractVotersFromText(text);
        console.log(`Extracted ${voters.length} unique valid voters from PDF`);

        // Extract location from header
        const locationMatch = text.match(/Assembly Constituency\s*:\s*([^\n]+)/i) ||
                              text.match(/District\s*:\s*([^\n]+)/i);
        let location = locationMatch ? locationMatch[1].trim() : null;
        if (location) location = location.split('Part No.')[0].trim();

        return {
            voters,
            totalExtracted: voters.length,
            location,
            isValid: voters.length > 0
        };
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error(`Failed to extract data: ${error.message}`);
    }
}

module.exports = { extractFromPDF };