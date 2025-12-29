/**
 * Upload all device images from assets folder to MinIO
 * Run with: node scripts/upload-assets.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const FormData = require('form-data');

// Configuration
const ASSETS_DIR = 'C:\\Users\\saidm\\MuhsinWeb\\assets';
const API_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Get all image files recursively
function getImageFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getImageFiles(filePath, fileList);
        } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
            fileList.push(filePath);
        }
    }

    return fileList;
}

// Upload a single file
async function uploadFile(filePath) {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const url = new URL(`${API_URL}/api/upload/image`);
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
            },
        };

        const httpModule = url.protocol === 'https:' ? https : http;
        const req = httpModule.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve({ success: true, raw: data });
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        form.pipe(req);
    });
}

// Main function
async function main() {
    console.log('🔍 Scanning for images in:', ASSETS_DIR);

    const images = getImageFiles(ASSETS_DIR);
    console.log(`📸 Found ${images.length} images to upload\n`);

    if (!ADMIN_TOKEN) {
        console.log('⚠️  No ADMIN_TOKEN provided. Set it with:');
        console.log('   $env:ADMIN_TOKEN="your-jwt-token"');
        console.log('   node scripts/upload-assets.js\n');
        console.log('Get your token from localStorage.getItem("adminAccessToken") in the browser.\n');
        return;
    }

    let uploaded = 0;
    let failed = 0;

    for (const imagePath of images) {
        const relativePath = path.relative(ASSETS_DIR, imagePath);
        process.stdout.write(`Uploading: ${relativePath}... `);

        try {
            const result = await uploadFile(imagePath);
            console.log('✅');
            uploaded++;
        } catch (error) {
            console.log(`❌ ${error.message}`);
            failed++;
        }

        // Small delay to avoid overwhelming the server
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n📊 Results: ${uploaded} uploaded, ${failed} failed`);
}

main().catch(console.error);
