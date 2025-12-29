import { IsString, IsOptional, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserSegment {
    ALL = 'all',
    CUSTOMERS = 'customers',
    APPOINTMENT_COMPLETED = 'appointment_completed',
    UNSUBSCRIBED = 'unsubscribed',
}

export class FeaturedProductDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    price: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty()
    @IsString()
    productUrl: string;
}

export class SendMarketingEmailDto {
    @ApiProperty({ enum: UserSegment })
    @IsEnum(UserSegment)
    segment: UserSegment;

    @ApiPropertyOptional({ description: 'Specific email to send to (overrides segment)' })
    @IsString()
    @IsOptional()
    specificEmail?: string;

    @ApiProperty()
    @IsString()
    subject: string;

    @ApiProperty()
    @IsString()
    headline: string;

    @ApiProperty()
    @IsString()
    bodyHtml: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    ctaText?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    ctaUrl?: string;

    @ApiPropertyOptional({ type: [FeaturedProductDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FeaturedProductDto)
    @IsOptional()
    featuredProducts?: FeaturedProductDto[];
}

export class SegmentInfoDto {
    @ApiProperty()
    segment: string;

    @ApiProperty()
    label: string;

    @ApiProperty()
    count: number;
}

export class MarketingUserDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    lastOrder?: Date;

    @ApiPropertyOptional()
    lastAppointment?: Date;

    @ApiPropertyOptional()
    unsubscribedAt?: Date;

    // Additional context fields
    @ApiPropertyOptional()
    deviceBrand?: string;

    @ApiPropertyOptional()
    deviceModel?: string;

    @ApiPropertyOptional()
    repairType?: string;

    @ApiPropertyOptional()
    orderCount?: number;

    @ApiPropertyOptional()
    totalSpent?: number;

    @ApiPropertyOptional()
    phone?: string;
}
