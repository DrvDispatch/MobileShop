import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BannerPosition } from '@prisma/client';

export class CreateBannerDto {
    @ApiProperty({ description: 'Banner title (for admin reference)' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Banner message to display' })
    @IsString()
    message: string;

    @ApiPropertyOptional({ description: 'Link URL when banner is clicked' })
    @IsString()
    @IsOptional()
    linkUrl?: string;

    @ApiPropertyOptional({ description: 'Link button text' })
    @IsString()
    @IsOptional()
    linkText?: string;

    @ApiPropertyOptional({ description: 'Background color (hex)' })
    @IsString()
    @IsOptional()
    bgColor?: string;

    @ApiPropertyOptional({ description: 'Text color (hex)' })
    @IsString()
    @IsOptional()
    textColor?: string;

    @ApiPropertyOptional({ enum: BannerPosition, description: 'Banner position' })
    @IsEnum(BannerPosition)
    @IsOptional()
    position?: BannerPosition;

    @ApiPropertyOptional({ description: 'Display priority (higher = first)' })
    @IsNumber()
    @IsOptional()
    priority?: number;

    @ApiPropertyOptional({ description: 'Start date (ISO string)' })
    @IsDateString()
    @IsOptional()
    startsAt?: string;

    @ApiPropertyOptional({ description: 'Expiration date (ISO string)' })
    @IsDateString()
    @IsOptional()
    expiresAt?: string;

    @ApiPropertyOptional({ description: 'Whether the banner is active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateBannerDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    message?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    linkUrl?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    linkText?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    bgColor?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    textColor?: string;

    @ApiPropertyOptional({ enum: BannerPosition })
    @IsEnum(BannerPosition)
    @IsOptional()
    position?: BannerPosition;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    priority?: number;

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
}

export class ActiveBannerDto {
    id: string;
    message: string;
    linkUrl?: string;
    linkText?: string;
    bgColor: string;
    textColor: string;
    position: BannerPosition;
}
