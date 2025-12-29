import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Define locally to avoid Prisma client generation timing issues
export enum DiscountType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED',
}

export class CreateDiscountDto {
    @ApiProperty({ description: 'Unique discount code' })
    @IsString()
    code: string;

    @ApiPropertyOptional({ description: 'Description of the discount' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: DiscountType, description: 'PERCENTAGE or FIXED' })
    @IsEnum(DiscountType)
    type: DiscountType;

    @ApiProperty({ description: 'Discount value (e.g., 10 for 10% or €10)' })
    @IsNumber()
    @Min(0)
    value: number;

    @ApiPropertyOptional({ description: 'Minimum order amount to apply discount' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    minOrderAmount?: number;

    @ApiPropertyOptional({ description: 'Maximum discount amount (for percentage discounts)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    maxDiscount?: number;

    @ApiPropertyOptional({ description: 'Total usage limit (null = unlimited)' })
    @IsNumber()
    @IsOptional()
    @Min(1)
    usageLimit?: number;

    @ApiPropertyOptional({ description: 'Per customer usage limit (null = unlimited)' })
    @IsNumber()
    @IsOptional()
    @Min(1)
    perUserLimit?: number;

    @ApiPropertyOptional({ description: 'Start date (ISO string)' })
    @IsDateString()
    @IsOptional()
    startsAt?: string;

    @ApiPropertyOptional({ description: 'Expiration date (ISO string)' })
    @IsDateString()
    @IsOptional()
    expiresAt?: string;

    @ApiPropertyOptional({ description: 'Whether the discount is active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Applies to all products' })
    @IsBoolean()
    @IsOptional()
    appliesToAll?: boolean;

    @ApiPropertyOptional({ description: 'Specific product IDs (if not appliesToAll)' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    productIds?: string[];

    @ApiPropertyOptional({ description: 'Specific category IDs (if not appliesToAll)' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categoryIds?: string[];
}

export class UpdateDiscountDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    code?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ enum: DiscountType })
    @IsEnum(DiscountType)
    @IsOptional()
    type?: DiscountType;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    @Min(0)
    value?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    minOrderAmount?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    maxDiscount?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    usageLimit?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    perUserLimit?: number;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    startsAt?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    expiresAt?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    appliesToAll?: boolean;

    @ApiPropertyOptional()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    productIds?: string[];

    @ApiPropertyOptional()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categoryIds?: string[];
}

export class ValidateDiscountDto {
    @ApiProperty({ description: 'Discount code to validate' })
    @IsString()
    code: string;

    @ApiProperty({ description: 'Order subtotal' })
    @IsNumber()
    @Min(0)
    subtotal: number;

    @ApiPropertyOptional({ description: 'Customer email (for per-user limit check)' })
    @IsString()
    @IsOptional()
    customerEmail?: string;

    @ApiPropertyOptional({ description: 'Product IDs in cart' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    productIds?: string[];
}

export class DiscountValidationResult {
    @ApiProperty()
    valid: boolean;

    @ApiPropertyOptional()
    discountId?: string;

    @ApiPropertyOptional()
    code?: string;

    @ApiPropertyOptional()
    type?: DiscountType;

    @ApiPropertyOptional()
    discountAmount?: number;

    @ApiPropertyOptional()
    message?: string;
}
