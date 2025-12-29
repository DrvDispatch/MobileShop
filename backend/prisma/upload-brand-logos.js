/**
 * Upload brand logos to MinIO
 * Run with: node prisma/upload-brand-logos.js
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
const SOURCE_DIR = 'C:/Users/saidm/MuhsinWeb/assets/_brand_logos/smartphone';
const TARGET_PREFIX = 'assets/BrandLogos/';

// Map local filenames to MinIO expected names
const logoMapping = {
    'apple.webp': 'Apple-logo-300x166.webp',
    'samsung.webp': 'Samsung-logo-300x166.webp',
    'xiaomi.webp': 'Xiaomi-logo-300x166.webp',
    'oneplus.webp': 'Oneplus-logo-300x166.webp',
    'oppo.webp': 'Oppo-logo-300x166.webp',
    'google.webp': 'Google-logo-300x166.webp',
    'huawei.webp': 'Huawei-logo-300x166.webp',
    'motorola.webp': 'Motorola-logo-300x166.webp',
    'nokia.webp': 'Nokia-logo-300x166.webp',
    'sony.webp': 'Sony-logo-300x166.webp',
    'fairphone.webp': 'Fairphone-logo-300x166.webp',
    'asus.webp': 'Asus-logo-300x166.webp',
    'cat.webp': 'Cat-logo-300x166.webp',
    'lenovo.webp': 'Lenovo-logo-300x166.webp',
};

async function uploadLogos() {
    console.log('Uploading brand logos to MinIO...\n');

    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
        console.log(`Creating bucket: ${BUCKET_NAME}`);
        await minioClient.makeBucket(BUCKET_NAME);
    }

    for (const [localFile, minioFile] of Object.entries(logoMapping)) {
        const localPath = path.join(SOURCE_DIR, localFile);
        const minioPath = TARGET_PREFIX + minioFile;

        if (!fs.existsSync(localPath)) {
            console.log(`✗ ${localFile}: File not found at ${localPath}`);
            continue;
        }

        try {
            await minioClient.fPutObject(BUCKET_NAME, minioPath, localPath, {
                'Content-Type': 'image/webp',
            });
            console.log(`✓ Uploaded: ${minioPath}`);
        } catch (err) {
            console.log(`✗ Failed to upload ${minioPath}: ${err.message}`);
        }
    }

    console.log('\nDone!');
}

uploadLogos().catch(console.error);
