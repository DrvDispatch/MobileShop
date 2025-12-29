import {
    Controller,
    Post,
    Body,
    UseGuards,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import { GeminiService, GenerateProductInput } from './gemini.service';
import { IsString, IsOptional, IsIn } from 'class-validator';

class GenerateProductDto {
    @IsString()
    modelName: string;

    @IsString()
    @IsIn(['NEW', 'USED', 'REFURBISHED'])
    condition: 'NEW' | 'USED' | 'REFURBISHED';

    @IsString()
    brand: string;

    @IsOptional()
    @IsString()
    category?: string;
}

class AnalyzeImageDto {
    @IsOptional()
    @IsString()
    modelHint?: string;
}

@ApiTags('Gemini AI')
@Controller('gemini')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiBearerAuth()
export class GeminiController {
    constructor(private readonly geminiService: GeminiService) { }

    @Post('generate')
    @ApiOperation({ summary: 'Generate product content using AI' })
    async generateProductContent(@Body() dto: GenerateProductDto) {
        console.log('[GeminiController] Received request:', JSON.stringify(dto));
        console.log('[GeminiController] modelName:', dto.modelName, 'type:', typeof dto.modelName);
        console.log('[GeminiController] brand:', dto.brand, 'type:', typeof dto.brand);
        console.log('[GeminiController] condition:', dto.condition, 'type:', typeof dto.condition);

        if (!dto.modelName || !dto.brand || !dto.condition) {
            console.log('[GeminiController] Validation FAILED - missing required fields');
            throw new BadRequestException('modelName, brand, and condition are required');
        }

        console.log('[GeminiController] Validation passed, calling geminiService...');
        return this.geminiService.generateProductContent(dto);
    }

    @Post('analyze')
    @ApiOperation({ summary: 'Analyze device image for color and condition' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                modelHint: { type: 'string' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async analyzeImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: AnalyzeImageDto,
    ) {
        if (!file) {
            throw new BadRequestException('Image file is required');
        }

        const base64 = file.buffer.toString('base64');
        return this.geminiService.analyzeDeviceImage(base64, file.mimetype, dto.modelHint);
    }

    @Post('find-images')
    @ApiOperation({ summary: 'Find product images using Google Search' })
    async findImages(@Body('query') query: string) {
        if (!query) {
            throw new BadRequestException('Query is required');
        }

        const images = await this.geminiService.findProductImages(query);
        return { images };
    }
}
