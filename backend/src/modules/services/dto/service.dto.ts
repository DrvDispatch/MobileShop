import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Service Category DTO
 */
export class CreateServiceCategoryDto {
    @ApiProperty({ description: 'Category name', example: 'Haircuts' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'URL-friendly slug', example: 'haircuts' })
    @IsString()
    slug: string;

    @ApiPropertyOptional({ description: 'Parent category ID for hierarchy' })
    @IsOptional()
    @IsUUID()
    parentId?: string;

    @ApiPropertyOptional({ description: 'Icon URL or icon name' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ description: 'Image URL' })
    @IsOptional()
    @IsString()
    image?: string;

    @ApiPropertyOptional({ description: 'Category description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Sort order', default: 0 })
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional({ description: 'Is category active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

/**
 * Update Service Category DTO
 */
export class UpdateServiceCategoryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    parentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    image?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

/**
 * Create Service DTO
 */
export class CreateServiceDto {
    @ApiProperty({ description: 'Service name', example: 'Classic Haircut' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'URL-friendly slug', example: 'classic-haircut' })
    @IsString()
    slug: string;

    @ApiPropertyOptional({ description: 'Category ID (optional for flat lists)' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Service description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Icon URL or icon name' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ description: 'Price in decimal (null = On request)' })
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiPropertyOptional({ description: 'Display price string', example: '€25' })
    @IsOptional()
    @IsString()
    priceDisplay?: string;

    @ApiPropertyOptional({ description: 'Duration in minutes' })
    @IsOptional()
    @IsNumber()
    duration?: number;

    @ApiPropertyOptional({ description: 'Display duration string', example: '30 min' })
    @IsOptional()
    @IsString()
    durationText?: string;

    @ApiPropertyOptional({ description: 'Sort order', default: 0 })
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional({ description: 'Is service active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

/**
 * Update Service DTO
 */
export class UpdateServiceDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    priceDisplay?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    duration?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    durationText?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
