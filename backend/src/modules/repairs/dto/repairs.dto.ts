import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ========== Device Types ==========
export class DeviceTypeDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    slug: string;

    @ApiPropertyOptional()
    icon?: string;

    @ApiProperty()
    sortOrder: number;
}

export class CreateDeviceTypeDto {
    @ApiProperty({ example: 'Smartphone' })
    name: string;

    @ApiProperty({ example: 'smartphone' })
    slug: string;

    @ApiPropertyOptional()
    icon?: string;

    @ApiPropertyOptional({ default: 0 })
    sortOrder?: number;
}

// ========== Brands ==========
export class BrandDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    slug: string;

    @ApiPropertyOptional()
    logo?: string;

    @ApiProperty()
    deviceTypeId: string;

    @ApiProperty()
    sortOrder: number;
}

export class CreateBrandDto {
    @ApiProperty({ example: 'Apple' })
    name: string;

    @ApiProperty({ example: 'apple' })
    slug: string;

    @ApiPropertyOptional()
    logo?: string;

    @ApiProperty()
    deviceTypeId: string;

    @ApiPropertyOptional({ default: 0 })
    sortOrder?: number;
}

// ========== Devices ==========
export class DeviceDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    slug: string;

    @ApiPropertyOptional()
    image?: string;

    @ApiProperty()
    brandId: string;

    @ApiProperty()
    sortOrder: number;
}

export class CreateRepairDeviceDto {
    @ApiProperty({ example: 'iPhone 16 Pro Max' })
    name: string;

    @ApiProperty({ example: 'iphone-16-pro-max' })
    slug: string;

    @ApiPropertyOptional()
    image?: string;

    @ApiProperty()
    brandId: string;

    @ApiPropertyOptional({ default: 0 })
    sortOrder?: number;
}

// ========== Service Types ==========
export class ServiceTypeDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    slug: string;

    @ApiPropertyOptional()
    icon?: string;

    @ApiPropertyOptional()
    description?: string;

    @ApiProperty()
    sortOrder: number;
}

export class CreateServiceTypeDto {
    @ApiProperty({ example: 'Scherm' })
    name: string;

    @ApiProperty({ example: 'scherm' })
    slug: string;

    @ApiPropertyOptional()
    icon?: string;

    @ApiPropertyOptional()
    description?: string;

    @ApiPropertyOptional({ default: 0 })
    sortOrder?: number;
}

// ========== Device Services (pricing) ==========
export class DeviceServiceDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    deviceId: string;

    @ApiProperty()
    serviceId: string;

    @ApiPropertyOptional()
    price?: number;

    @ApiPropertyOptional()
    priceText?: string;

    @ApiPropertyOptional()
    duration?: string;

    @ApiProperty()
    sortOrder: number;

    @ApiPropertyOptional()
    service?: ServiceTypeDto;
}

export class CreateDeviceServiceDto {
    @ApiProperty()
    deviceId: string;

    @ApiProperty()
    serviceId: string;

    @ApiPropertyOptional()
    price?: number;

    @ApiPropertyOptional({ example: '€ 129,99' })
    priceText?: string;

    @ApiPropertyOptional({ example: '60 MINUTEN' })
    duration?: string;

    @ApiPropertyOptional({ default: 0 })
    sortOrder?: number;
}

// ========== Import DTO ==========
export class ImportDevicesDto {
    @ApiProperty({ description: 'JSON data from devices.json' })
    data: Record<string, {
        smartphones?: DeviceImport[];
        tablets?: DeviceImport[];
    }>;
}

interface DeviceImport {
    name: string;
    slug: string;
    category: string;
    images: string[];
    repairs: {
        name: string;
        duration: string;
        price_text: string;
        price_value: number | null;
        icon_path: string;
    }[];
}
