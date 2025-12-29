/**
 * Delete all files from the products folder (test images)
 * Run with: npx ts-node scripts/cleanup-products.ts
 */

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

const BUCKET = process.env.MINIO_BUCKET_PRODUCTS || 'products';

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

async function main() {
    console.log('🗑️  Cleaning up products folder (removing test images)...\n');

    // List all files in products folder
    const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: 'products/',
    });

    const response = await s3Client.send(listCommand);

    if (!response.Contents || response.Contents.length === 0) {
        console.log('✅ Products folder is already empty');
        return;
    }

    console.log(`Found ${response.Contents.length} files to delete:\n`);

    const objects = response.Contents
        .filter(obj => obj.Key)
        .map(obj => {
            console.log(`  - ${obj.Key}`);
            return { Key: obj.Key! };
        });

    if (objects.length === 0) {
        console.log('✅ No files to delete');
        return;
    }

    // Delete all files
    const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: objects },
    });

    await s3Client.send(deleteCommand);

    console.log(`\n✅ Deleted ${objects.length} test images from products folder`);
    console.log('📁 Only device images in devices/ folder remain');
}

main().catch(console.error);
