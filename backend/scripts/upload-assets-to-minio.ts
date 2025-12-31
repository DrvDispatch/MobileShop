/**
 * Script to upload all repair assets to MinIO
 * 
 * This script uploads the contents of mobile-shop/assets/ folder to MinIO
 * at the path: repairs/assets/...
 * 
 * Usage: 
 *   npm run upload:assets           (uses .env for local MinIO)
 *   npm run upload:assets -- --prod (uses production MinIO at smartphoneservice.be)
 */

import {
    S3Client,
    PutObjectCommand,
    ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Check for --prod flag
const isProd = process.argv.includes('--prod');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Production configuration 
// Upload to local MinIO (Docker), serve via Cloudflare tunnel public URL
const PROD_CONFIG = {
    MINIO_ENDPOINT: 'http://localhost:9000',  // Local MinIO Docker (port 9000)
    MINIO_USE_SSL: false,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    MINIO_BUCKET: 'products',
    MINIO_PUBLIC_URL: 'https://images.servicespulse.com',  // Public URL via Cloudflare tunnel
};

// Local configuration
const LOCAL_CONFIG = {
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
    MINIO_PORT: process.env.MINIO_PORT || '9002',
    MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    MINIO_BUCKET: process.env.MINIO_BUCKET_PRODUCTS || 'products',
    MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL || 'http://localhost:9002',
};

// Use prod or local config based on flag
const config = isProd ? PROD_CONFIG : LOCAL_CONFIG;

// Assets path
const ASSETS_PATH = path.resolve(__dirname, '..', '..', 'assets');
const UPLOAD_PREFIX = 'repairs/assets'; // Will be uploaded to repairs/assets/...

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// Create S3 client
function createS3Client(): S3Client {
    let endpoint: string;

    if (isProd) {
        // Production: direct endpoint
        endpoint = config.MINIO_ENDPOINT;
    } else {
        // Local: construct from host and port
        const protocol = config.MINIO_USE_SSL ? 'https' : 'http';
        const localConfig = config as typeof LOCAL_CONFIG;
        endpoint = config.MINIO_ENDPOINT.startsWith('http')
            ? config.MINIO_ENDPOINT
            : `${protocol}://${config.MINIO_ENDPOINT}:${localConfig.MINIO_PORT}`;
    }

    console.log(`Connecting to MinIO at: ${endpoint}`);
    console.log(`Mode: ${isProd ? 'PRODUCTION' : 'LOCAL'}`);

    return new S3Client({
        endpoint,
        region: 'us-east-1',
        credentials: {
            accessKeyId: config.MINIO_ACCESS_KEY,
            secretAccessKey: config.MINIO_SECRET_KEY,
        },
        forcePathStyle: true,
    });
}

// Get all files recursively
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

// Get MIME type from file extension
function getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

// Upload a single file
async function uploadFile(
    s3Client: S3Client,
    localPath: string,
    relativePath: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    // Build the S3 key: repairs/assets/Apple/iPhone 16 Pro/image.webp
    const s3Key = `${UPLOAD_PREFIX}/${relativePath}`;

    try {
        const fileContent = fs.readFileSync(localPath);
        const mimeType = getMimeType(localPath);

        await s3Client.send(
            new PutObjectCommand({
                Bucket: config.MINIO_BUCKET,
                Key: s3Key,
                Body: fileContent,
                ContentType: mimeType,
            })
        );

        const url = `${config.MINIO_PUBLIC_URL}/${config.MINIO_BUCKET}/${s3Key}`;
        return { success: true, url };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Check if assets already uploaded
async function checkExistingAssets(s3Client: S3Client): Promise<number> {
    try {
        const response = await s3Client.send(
            new ListObjectsV2Command({
                Bucket: config.MINIO_BUCKET,
                Prefix: UPLOAD_PREFIX + '/',
                MaxKeys: 10,
            })
        );
        return response.KeyCount || 0;
    } catch {
        return 0;
    }
}

// Main upload function
async function uploadAssets() {
    console.log('========================================');
    console.log('   MinIO Asset Upload Script');
    console.log('========================================\n');

    // Check if assets folder exists
    if (!fs.existsSync(ASSETS_PATH)) {
        console.error(`❌ Assets folder not found: ${ASSETS_PATH}`);
        process.exit(1);
    }

    console.log(`📁 Assets folder: ${ASSETS_PATH}`);
    console.log(`🎯 Upload destination: ${config.MINIO_BUCKET}/${UPLOAD_PREFIX}/`);
    console.log(`🌐 Public URL: ${config.MINIO_PUBLIC_URL}/${config.MINIO_BUCKET}/${UPLOAD_PREFIX}/\n`);

    // Create S3 client
    const s3Client = createS3Client();

    // Check for existing assets
    const existingCount = await checkExistingAssets(s3Client);
    if (existingCount > 0) {
        console.log(`⚠️  Found ${existingCount}+ existing assets. Continuing will overwrite existing files.\n`);
    }

    // Get all files
    const allFiles = getAllFiles(ASSETS_PATH);
    console.log(`📊 Found ${allFiles.length} files to upload\n`);

    // Upload files with progress
    let uploaded = 0;
    let failed = 0;
    const startTime = Date.now();

    for (const filePath of allFiles) {
        // Get relative path from assets folder
        const relativePath = path.relative(ASSETS_PATH, filePath).replace(/\\/g, '/');

        const result = await uploadFile(s3Client, filePath, relativePath);

        if (result.success) {
            uploaded++;
            // Show progress every 50 files
            if (uploaded % 50 === 0) {
                console.log(`✓ Uploaded ${uploaded}/${allFiles.length} files...`);
            }
        } else {
            failed++;
            console.log(`✗ Failed: ${relativePath} - ${result.error}`);
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n========================================');
    console.log('   Upload Complete');
    console.log('========================================');
    console.log(`✅ Uploaded: ${uploaded} files`);
    console.log(`❌ Failed: ${failed} files`);
    console.log(`⏱️  Time: ${elapsed}s`);
    console.log(`\n🔗 Example URL: ${config.MINIO_PUBLIC_URL}/${config.MINIO_BUCKET}/${UPLOAD_PREFIX}/Apple/iPhone%2016%20Pro/iphone-16-pro-front.webp`);
}

// Run the script
uploadAssets().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
