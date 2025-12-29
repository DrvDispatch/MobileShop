import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
    @ApiProperty()
    @IsString()
    line1!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    line2?: string;

    @ApiProperty()
    @IsString()
    city!: string;

    @ApiProperty()
    @IsString()
    postalCode!: string;

    @ApiProperty()
    @IsString()
    country!: string;
}

export class UpdateInvoiceSettingsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    companyName?: string;

    @ApiPropertyOptional({ type: AddressDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => AddressDto)
    companyAddress?: AddressDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    vatNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    website?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bankAccount?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bankName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    invoicePrefix?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    invoiceFooter?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    logoUrl?: string;
}

export class InvoiceSettingsResponseDto {
    @ApiProperty()
    companyName!: string;

    @ApiProperty({ type: AddressDto })
    companyAddress!: AddressDto;

    @ApiProperty()
    vatNumber!: string;

    @ApiProperty()
    phone!: string;

    @ApiProperty()
    email!: string;

    @ApiPropertyOptional()
    website?: string;

    @ApiPropertyOptional()
    bankAccount?: string;

    @ApiPropertyOptional()
    bankName?: string;

    @ApiProperty()
    invoicePrefix!: string;

    @ApiProperty()
    invoiceFooter!: string;

    @ApiPropertyOptional()
    logoUrl?: string;
}

// ============================================
// WALK-IN INVOICE DTOs
// ============================================

class InvoiceItemDto {
    @ApiProperty({ enum: ['PRODUCT', 'REPAIR', 'CUSTOM'] })
    @IsString()
    type!: 'PRODUCT' | 'REPAIR' | 'CUSTOM';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    productId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    repairId?: string;

    @ApiProperty()
    @IsString()
    description!: string;

    @ApiProperty()
    @IsNumber()
    quantity!: number;

    @ApiProperty()
    @IsNumber()
    unitPrice!: number;
}

export class CreateInvoiceDto {
    @ApiProperty()
    @IsString()
    customerName!: string;

    @ApiProperty()
    @IsString()
    customerEmail!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    customerPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    customerAddress?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    customerVatNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiProperty({ type: [InvoiceItemDto] })
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items!: InvoiceItemDto[];

    @ApiPropertyOptional()
    @IsOptional()
    discountAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    adminNotes?: string;

    @ApiPropertyOptional({ enum: ['CASH', 'CARD', 'TRANSFER', 'PENDING'] })
    @IsOptional()
    @IsString()
    paymentMethod?: 'CASH' | 'CARD' | 'TRANSFER' | 'PENDING';

    @ApiPropertyOptional()
    @IsOptional()
    markAsPaid?: boolean;
}

export class UpdateInvoiceDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    customerName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    customerEmail?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    customerPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    customerAddress?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    customerVatNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    adminNotes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    discountAmount?: number;
}

