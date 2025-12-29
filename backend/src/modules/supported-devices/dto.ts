import { IsString, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';

export class CreateDeviceDto {
    @IsString()
    brand: string;

    @IsString()
    model: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

export class UpdateDeviceDto {
    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

export class BulkCreateDevicesDto {
    devices: CreateDeviceDto[];
}
