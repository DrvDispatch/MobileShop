/**
 * Upload all device images and brand logos from assets folder to MinIO
 * Run with: npx ts-node scripts/upload-assets.ts
 * 
 * Uploads to: repairs/assets/{Brand}/{Model}/ for device images
 *             repairs/assets/BrandLogos/ for brand logos
 *             repairs/assets/_icons/ for repair icons
 */

import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const ASSETS_DIR = 'C:\\Users\\saidm\\MuhsinWeb\\assets';
const BUCKET = process.env.MINIO_BUCKET_PRODUCTS || 'products';
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9002';

// Initialize S3 client for MinIO
const minioHost = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = process.env.MINIO_PORT || '9002';
const useSSL = process.env.MINIO_USE_SSL === 'true';
const protocol = useSSL ? 'https' : 'http';
const endpoint = minioHost.startsWith('http') ? minioHost : `${protocol}://${minioHost}:${minioPort}`;

const s3Client = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    },
    forcePathStyle: true,
});

// Get MIME type from extension
function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    };
    return mimes[ext] || 'application/octet-stream';
}

// Get all image files recursively (including SVG for icons)
function getImageFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getImageFiles(filePath, fileList);
        } else if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file)) {
            fileList.push(filePath);
        }
    }

    return fileList;
}

// Generate key from file path - use repairs/assets as base
function generateKey(filePath: string): string {
    const relativePath = path.relative(ASSETS_DIR, filePath);
    // Convert Windows path to URL-friendly key
    // Upload to repairs/assets/ instead of devices/
    const key = `repairs/assets/${relativePath.replace(/\\/g, '/')}`;
    return key;
}

// Upload a single file
async function uploadFile(filePath: string): Promise<{ url: string; key: string }> {
    const key = generateKey(filePath);
    const fileContent = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);

    await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileContent,
        ContentType: mimeType,
    }));

    return {
        url: `${PUBLIC_URL}/${BUCKET}/${key}`,
        key,
    };
}

// Main function
async function main() {
    console.log('🔍 Scanning for images in:', ASSETS_DIR);
    console.log('📦 Bucket:', BUCKET);
    console.log('🔗 Endpoint:', endpoint);
    console.log('');

    // Check if bucket exists
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
        console.log('✅ Connected to MinIO bucket\n');
    } catch (error) {
        console.error('❌ Cannot connect to MinIO. Make sure MinIO is running.');
        console.error('   Error:', (error as Error).message);
        process.exit(1);
    }

    const images = getImageFiles(ASSETS_DIR);
    console.log(`📸 Found ${images.length} images to upload\n`);

    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < images.length; i++) {
        const imagePath = images[i];
        const relativePath = path.relative(ASSETS_DIR, imagePath);
        process.stdout.write(`[${i + 1}/${images.length}] ${relativePath}... `);

        try {
            const result = await uploadFile(imagePath);
            console.log('✅');
            uploaded++;
        } catch (error) {
            console.log(`❌ ${(error as Error).message}`);
            failed++;
        }
    }

    console.log(`\n📊 Results: ${uploaded} uploaded, ${failed} failed`);
    console.log(`\n💡 Images are now available in the Asset Library!`);
}

main().catch(console.error);
