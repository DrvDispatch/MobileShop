import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsBoolean, Min, IsUUID } from 'class-validator';
import { RefundReason, RefundStatus } from '../../../generated/prisma/client.js';

export class CreateRefundDto {
    @ApiProperty({ description: 'Order ID to refund' })
    @IsUUID()
    orderId: string;

    @ApiProperty({ description: 'Amount to refund in euros' })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ enum: ['DUPLICATE', 'FRAUDULENT', 'REQUESTED_BY_CUSTOMER', 'DEFECTIVE_PRODUCT', 'WRONG_PRODUCT', 'SHIPPING_DAMAGE', 'OTHER'] })
    @IsEnum(RefundReason)
    reason: RefundReason;

    @ApiPropertyOptional({ description: 'Custom reason text' })
    @IsOptional()
    @IsString()
    reasonText?: string;

    @ApiPropertyOptional({ description: 'Internal admin notes' })
    @IsOptional()
    @IsString()
    adminNotes?: string;

    @ApiPropertyOptional({ description: 'Whether customer needs to return the product' })
    @IsOptional()
    @IsBoolean()
    returnRequired?: boolean;
}

export class UpdateRefundDto {
    @ApiPropertyOptional({ description: 'Internal admin notes' })
    @IsOptional()
    @IsString()
    adminNotes?: string;

    @ApiPropertyOptional({ description: 'Whether return has been received' })
    @IsOptional()
    @IsBoolean()
    returnReceived?: boolean;

    @ApiPropertyOptional({ description: 'Return tracking number' })
    @IsOptional()
    @IsString()
    returnTrackingNumber?: string;
}

export class RefundResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    orderId: string;

    @ApiProperty()
    orderNumber: string;

    @ApiPropertyOptional()
    stripeRefundId?: string;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    currency: string;

    @ApiProperty({ enum: RefundStatus })
    status: RefundStatus;

    @ApiProperty({ enum: RefundReason })
    reason: RefundReason;

    @ApiPropertyOptional()
    reasonText?: string;

    @ApiPropertyOptional()
    processedBy?: string;

    @ApiPropertyOptional()
    adminNotes?: string;

    @ApiProperty()
    returnRequired: boolean;

    @ApiProperty()
    returnReceived: boolean;

    @ApiPropertyOptional()
    returnTrackingNumber?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiPropertyOptional()
    processedAt?: Date;

    @ApiPropertyOptional()
    failedAt?: Date;

    @ApiPropertyOptional()
    failureReason?: string;
}

export class RefundListQueryDto {
    @ApiPropertyOptional({ enum: RefundStatus })
    @IsOptional()
    @IsEnum(RefundStatus)
    status?: RefundStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    orderId?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @IsNumber()
    limit?: number;
}
