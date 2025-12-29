import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum FulfillmentType {
    SHIPPING = 'SHIPPING',
    PICKUP = 'PICKUP',
}

export class AddressDto {
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

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    state?: string;

    @ApiProperty()
    @IsString()
    postalCode!: string;

    @ApiProperty()
    @IsString()
    country!: string;
}

export class CartItemDto {
    @ApiProperty()
    @IsString()
    productId!: string;

    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    price!: number;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    quantity!: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    image?: string;
}

export class CreateCheckoutDto {
    @ApiProperty({ type: [CartItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartItemDto)
    items!: CartItemDto[];

    @ApiProperty()
    @IsEmail()
    customerEmail!: string;

    @ApiProperty()
    @IsString()
    customerName!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    customerPhone?: string;

    @ApiPropertyOptional({ enum: FulfillmentType })
    @IsOptional()
    @IsEnum(FulfillmentType)
    fulfillmentType?: FulfillmentType;

    @ApiPropertyOptional({ type: AddressDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AddressDto)
    shippingAddress?: AddressDto;

    @ApiPropertyOptional({ description: 'Discount code ID to apply' })
    @IsOptional()
    @IsString()
    discountCodeId?: string;
}

export class CheckoutResponseDto {
    @ApiProperty()
    checkoutUrl!: string;

    @ApiProperty()
    sessionId!: string;
}

export class OrderResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    orderNumber!: string;

    @ApiProperty()
    status!: string;

    @ApiProperty()
    total!: number;

    @ApiProperty()
    customerEmail!: string;

    @ApiProperty()
    customerName!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiPropertyOptional()
    paidAt?: Date;
}

export class UpdateOrderDto {
    @ApiPropertyOptional({ description: 'Order status', enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ description: 'Admin notes' })
    @IsOptional()
    @IsString()
    adminNotes?: string;

    @ApiPropertyOptional({ description: 'Tracking number for shipped orders' })
    @IsOptional()
    @IsString()
    trackingNumber?: string;

    @ApiPropertyOptional({ description: 'Reason for cancellation (shown to customer)' })
    @IsOptional()
    @IsString()
    cancellationReason?: string;
}


