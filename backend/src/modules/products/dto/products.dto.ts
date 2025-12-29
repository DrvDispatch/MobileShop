import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCondition } from '@prisma/client';
import { Type, Transform } from 'class-transformer';

// Define locally until Prisma client regenerates
export enum ProductType {
    PHONE = 'PHONE',
    PART = 'PART',
    ACCESSORY = 'ACCESSORY',
}

export enum DeviceGrade {
    A_PLUS = 'A_PLUS',
    A = 'A',
    B = 'B',
    C = 'C',
}

export class CreateProductDto {
    @ApiProperty({ example: 'iPhone 15 Pro' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'iphone-15-pro' })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({ example: 'Latest Apple flagship with titanium design' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'Premium smartphone' })
    @IsOptional()
    @IsString()
    shortDescription?: string;

    @ApiProperty({ example: 999.99 })
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @ApiPropertyOptional({ example: 1199.99 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    compareAtPrice?: number;

    @ApiPropertyOptional({ example: 750.00 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    costPrice?: number;

    @ApiPropertyOptional({ example: 'IP15PRO-256' })
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    stockQty?: number;

    @ApiPropertyOptional({ enum: ProductCondition, default: 'NEW' })
    @IsOptional()
    @IsEnum(ProductCondition)
    condition?: ProductCondition;

    @ApiPropertyOptional({ example: 'Apple' })
    @IsOptional()
    @IsString()
    brand?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    // Device specification fields
    @ApiPropertyOptional({ enum: ProductType, default: 'PHONE' })
    @IsOptional()
    @IsEnum(ProductType)
    productType?: ProductType;

    @ApiPropertyOptional({ example: '128GB', description: 'Storage capacity' })
    @IsOptional()
    @IsString()
    storage?: string;

    @ApiPropertyOptional({ example: 'Space Black', description: 'Device color' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ example: 98, description: 'Battery health percentage (0-100)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    @Type(() => Number)
    batteryHealth?: number;

    @ApiPropertyOptional({ enum: DeviceGrade, description: 'Device quality grade' })
    @IsOptional()
    @IsEnum(DeviceGrade)
    deviceGrade?: DeviceGrade;

    @ApiPropertyOptional({ description: 'Array of image URLs to attach to product', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imageUrls?: string[];
}

export class UpdateProductDto {
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
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    shortDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    compareAtPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    costPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    stockQty?: number;

    @ApiPropertyOptional({ enum: ProductCondition })
    @IsOptional()
    @IsEnum(ProductCondition)
    condition?: ProductCondition;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    brand?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    // Device specification fields
    @ApiPropertyOptional({ enum: ProductType })
    @IsOptional()
    @IsEnum(ProductType)
    productType?: ProductType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    storage?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    @Type(() => Number)
    batteryHealth?: number;

    @ApiPropertyOptional({ enum: DeviceGrade })
    @IsOptional()
    @IsEnum(DeviceGrade)
    deviceGrade?: DeviceGrade;

    @ApiPropertyOptional({ description: 'Array of image URLs to attach to product', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imageUrls?: string[];
}

export class ProductQueryDto {
    @ApiPropertyOptional({ description: 'Category ID or slug' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'Brand name' })
    @IsOptional()
    @IsString()
    brand?: string;

    @ApiPropertyOptional({ enum: ProductCondition })
    @IsOptional()
    @IsEnum(ProductCondition)
    condition?: ProductCondition;

    @ApiPropertyOptional({ enum: ProductType })
    @IsOptional()
    @IsEnum(ProductType)
    productType?: ProductType;

    @ApiPropertyOptional({ description: 'Only featured products' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    featured?: boolean;

    @ApiPropertyOptional({ description: 'Search query' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Minimum price' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Maximum price' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxPrice?: number;

    @ApiPropertyOptional({ description: 'Minimum battery health %' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    @Type(() => Number)
    minBattery?: number;

    @ApiPropertyOptional({ description: 'Storage capacity', example: '128GB' })
    @IsOptional()
    @IsString()
    storage?: string;

    @ApiPropertyOptional({ enum: DeviceGrade })
    @IsOptional()
    @IsEnum(DeviceGrade)
    deviceGrade?: DeviceGrade;

    @ApiPropertyOptional({ description: 'Sort by field', enum: ['price', 'createdAt', 'name', 'batteryHealth'] })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page', default: 12 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    limit?: number;
}

