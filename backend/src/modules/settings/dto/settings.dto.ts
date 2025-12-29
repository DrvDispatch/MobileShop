import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, Min, IsDefined } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// SETTINGS DTOs
// ============================================

export class SettingDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    key: string;

    @ApiProperty()
    value: Record<string, unknown>;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class UpdateSettingDto {
    @ApiProperty({ description: 'JSON value for the setting (can be string, number, boolean, object, or array)' })
    @IsDefined()
    value: unknown;
}

export class CreateSettingDto {
    @ApiProperty({ description: 'Unique key for the setting' })
    @IsString()
    key: string;

    @ApiProperty({ description: 'JSON value for the setting (can be string, number, boolean, object, or array)' })
    @IsDefined()
    value: unknown;
}

// ============================================
// SHIPPING ZONE DTOs
// ============================================

export class ShippingZoneDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ type: [String], description: 'Array of ISO country codes' })
    countries: string[];

    @ApiProperty({ type: Number })
    rate: number;

    @ApiPropertyOptional({ type: Number })
    freeAbove?: number;

    @ApiProperty()
    minDays: number;

    @ApiProperty()
    maxDays: number;

    @ApiPropertyOptional()
    carrier?: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    sortOrder: number;
}

export class CreateShippingZoneDto {
    @ApiProperty({ description: 'Zone name (e.g., "Belgium", "EU Zone 1")' })
    @IsString()
    name: string;

    @ApiProperty({ type: [String], description: 'ISO country codes (e.g., ["BE", "NL"])' })
    @IsArray()
    @IsString({ each: true })
    countries: string[];

    @ApiProperty({ description: 'Shipping rate in EUR', example: 5.95 })
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    rate: number;

    @ApiPropertyOptional({ description: 'Free shipping threshold in EUR' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    freeAbove?: number;

    @ApiPropertyOptional({ default: 2 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minDays?: number;

    @ApiPropertyOptional({ default: 5 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxDays?: number;

    @ApiPropertyOptional({ description: 'Carrier name (e.g., "bpost", "DHL")' })
    @IsOptional()
    @IsString()
    carrier?: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    sortOrder?: number;
}

export class UpdateShippingZoneDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    countries?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    rate?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    freeAbove?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minDays?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxDays?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    carrier?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    sortOrder?: number;
}

// ============================================
// PUBLIC SETTINGS RESPONSE
// ============================================

export class StoreInfoDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    address: {
        line1: string;
        city: string;
        postalCode: string;
        country: string;
    };

    @ApiPropertyOptional()
    vatNumber?: string;
}

export class CheckoutConfigDto {
    @ApiProperty()
    defaultCountry: string;

    @ApiProperty()
    currency: string;

    @ApiProperty()
    currencySymbol: string;

    @ApiProperty()
    taxIncluded: boolean;

    @ApiProperty()
    taxRate: number;

    @ApiProperty()
    taxLabel: string;
}

export class PublicSettingsDto {
    @ApiProperty({ type: StoreInfoDto })
    store: StoreInfoDto;

    @ApiProperty({ type: CheckoutConfigDto })
    checkout: CheckoutConfigDto;

    @ApiProperty({ type: [ShippingZoneDto] })
    shippingZones: ShippingZoneDto[];
}
