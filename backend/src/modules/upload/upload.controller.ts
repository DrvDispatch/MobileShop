import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const PUBLIC_ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];

const multerOptions = {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new BadRequestException('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
        }
    },
};

const publicMulterOptions = {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
        if (PUBLIC_ALLOWED_TYPES.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new BadRequestException('Invalid file type.'), false);
        }
    },
};

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    // PUBLIC endpoint for ticket attachments (no auth required)
    @Post()
    @UseInterceptors(FileInterceptor('file', publicMulterOptions))
    @ApiOperation({ summary: 'Upload a file (public - for tickets)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                type: { type: 'string', description: 'Upload type (e.g., tickets)' },
            },
        },
    })
    async uploadPublic(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadFile(file, 'tickets');
    }

    @Post('image')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file', multerOptions))
    @ApiOperation({ summary: 'Upload a single image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadFile(file, 'products');
    }

    @Post('images')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
    @ApiOperation({ summary: 'Upload multiple images (max 10)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }
        return this.uploadService.uploadMultipleFiles(files, 'products');
    }

    @Delete(':key')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an uploaded image' })
    async deleteImage(@Param('key') key: string) {
        await this.uploadService.deleteFile(key);
        return { success: true, message: 'Image deleted' };
    }

    @Get('assets')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all uploaded images (asset library)' })
    async listImages(
        @Query('folder') folder: string = 'products',
        @Query('limit') limit: string = '50',
    ) {
        const assets = await this.uploadService.listFiles(folder, parseInt(limit) || 50);
        return {
            assets,
            total: assets.length,
        };
    }
}
