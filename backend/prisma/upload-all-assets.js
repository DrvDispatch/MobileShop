/**
 * Upload ALL device images to MinIO
 * Run with: node prisma/upload-all-assets.js
 */
const Minio = require('minio');
const fs = require('fs');
const path = require('path');

// MinIO client configuration
const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9002,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin123',
});

const BUCKET_NAME = 'repairs';
const SOURCE_DIR = 'C:/Users/saidm/MuhsinWeb/assets';
const TARGET_PREFIX = 'assets/';

// Brands to upload (skip Apple and Samsung which already work)
const BRANDS_TO_UPLOAD = [
    'Google',
    'Motorola',
    'Nokia',
    'Sony',
    'Fairphone',
    'Asus',
    'Cat',
    'Huawei',
    'Oneplus',
    'Oppo',
    'Xiaomi',
];

function getAllFiles(dirPath, arrayOfFiles = []) {
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

async function uploadAllAssets() {
    console.log('Uploading device images to MinIO...\n');

    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
        console.log(`Creating bucket: ${BUCKET_NAME}`);
        await minioClient.makeBucket(BUCKET_NAME);
    }

    let uploadCount = 0;
    let errorCount = 0;

    for (const brand of BRANDS_TO_UPLOAD) {
        const brandDir = path.join(SOURCE_DIR, brand);

        if (!fs.existsSync(brandDir)) {
            console.log(`✗ Skipping ${brand}: Directory not found`);
            continue;
        }

        const files = getAllFiles(brandDir);
        console.log(`\n📁 ${brand}: Found ${files.length} files`);

        for (const localPath of files) {
            // Get relative path from SOURCE_DIR
            const relativePath = path.relative(SOURCE_DIR, localPath).replace(/\\/g, '/');
            const minioPath = TARGET_PREFIX + relativePath;

            // Get content type based on extension
            const ext = path.extname(localPath).toLowerCase();
            const contentType = ext === '.webp' ? 'image/webp'
                : ext === '.png' ? 'image/png'
                    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
                        : 'application/octet-stream';

            try {
                await minioClient.fPutObject(BUCKET_NAME, minioPath, localPath, {
                    'Content-Type': contentType,
                });
                uploadCount++;
                process.stdout.write('.');
            } catch (err) {
                console.log(`\n✗ Failed: ${minioPath} - ${err.message}`);
                errorCount++;
            }
        }
    }

    console.log(`\n\n✅ Uploaded ${uploadCount} files`);
    if (errorCount > 0) {
        console.log(`❌ ${errorCount} errors`);
    }
    console.log('\nDone!');
}

uploadAllAssets().catch(console.error);
