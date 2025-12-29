import { Injectable, Logger } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private readonly s3Client: S3Client;
    private readonly bucket: string;
    private readonly publicUrl: string;

    constructor() {
        this.bucket = process.env.MINIO_BUCKET_PRODUCTS || 'products';
        this.publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9002';

        // Construct proper MinIO endpoint URL
        const minioHost = process.env.MINIO_ENDPOINT || 'localhost';
        const minioPort = process.env.MINIO_PORT || '9002';
        const useSSL = process.env.MINIO_USE_SSL === 'true';
        const protocol = useSSL ? 'https' : 'http';

        // Build endpoint - if it already has protocol, use as-is; otherwise construct it
        const endpoint = minioHost.startsWith('http')
            ? minioHost
            : `${protocol}://${minioHost}:${minioPort}`;

        this.logger.log(`MinIO endpoint: ${endpoint}`);

        this.s3Client = new S3Client({
            endpoint,
            region: 'us-east-1', // MinIO requires a region but doesn't use it
            credentials: {
                accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
                secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
            },
            forcePathStyle: true, // Required for MinIO
        });
    }

    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'products',
    ): Promise<{ url: string; key: string }> {
        const fileExtension = file.originalname.split('.').pop();
        const key = `${folder}/${uuidv4()}.${fileExtension}`;

        try {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }),
            );

            const url = `${this.publicUrl}/${this.bucket}/${key}`;
            this.logger.log(`Uploaded file: ${key}`);

            return { url, key };
        } catch (error) {
            this.logger.error(`Failed to upload file: ${error.message}`);
            throw error;
        }
    }

    async uploadMultipleFiles(
        files: Express.Multer.File[],
        folder: string = 'products',
    ): Promise<{ url: string; key: string }[]> {
        const results = await Promise.all(
            files.map((file) => this.uploadFile(file, folder)),
        );
        return results;
    }

    async deleteFile(key: string): Promise<void> {
        try {
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            this.logger.log(`Deleted file: ${key}`);
        } catch (error) {
            this.logger.error(`Failed to delete file: ${error.message}`);
            throw error;
        }
    }

    async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return getSignedUrl(this.s3Client, command, { expiresIn });
    }

    /**
     * List all files in a folder (for asset library)
     */
    async listFiles(
        folder: string = 'products',
        limit: number = 100,
    ): Promise<{ url: string; key: string; lastModified?: Date; size?: number }[]> {
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: folder + '/',
                MaxKeys: limit,
            });

            const response = await this.s3Client.send(command);

            if (!response.Contents) {
                return [];
            }

            return response.Contents
                .filter(obj => obj.Key && !obj.Key.endsWith('/')) // Filter out folder entries
                .map(obj => ({
                    url: `${this.publicUrl}/${this.bucket}/${obj.Key}`,
                    key: obj.Key!,
                    lastModified: obj.LastModified,
                    size: obj.Size,
                }))
                .sort((a, b) => {
                    // Sort by most recent first
                    if (a.lastModified && b.lastModified) {
                        return b.lastModified.getTime() - a.lastModified.getTime();
                    }
                    return 0;
                });
        } catch (error) {
            this.logger.error(`Failed to list files: ${error.message}`);
            return [];
        }
    }
}
