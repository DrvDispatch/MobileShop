import { IsString, IsEmail, IsEnum, IsOptional, IsArray, ValidateNested, Allow } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

// Attachment class for proper validation
export class AttachmentDto {
    @Allow()
    url?: string;

    @Allow()
    type?: string;

    @Allow()
    name?: string;

    @Allow()
    size?: number;

    @Allow()
    mimeType?: string;
}

export enum TicketCategory {
    REPAIR_QUESTION = 'REPAIR_QUESTION',
    ORDER_QUESTION = 'ORDER_QUESTION',
    PRICE_QUOTE = 'PRICE_QUOTE',
    GENERAL = 'GENERAL',
    DISPUTE = 'DISPUTE',
    REFUND = 'REFUND',
}

export enum TicketStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
}

export interface Attachment {
    url: string;
    type: string;
    name: string;
    size?: number;
    mimeType?: string;
}

export class CreateTicketDto {
    @ApiProperty({ example: 'Jan Janssen' })
    @IsString()
    customerName: string;

    @ApiPropertyOptional({ example: 'jan@example.com' })
    @IsOptional()
    @IsEmail()
    customerEmail?: string;

    @ApiPropertyOptional({ example: '+32465638106' })
    @IsOptional()
    @IsString()
    customerPhone?: string;

    @ApiProperty({ enum: TicketCategory, example: TicketCategory.REPAIR_QUESTION })
    @IsEnum(TicketCategory)
    category: TicketCategory;

    @ApiProperty({ example: 'Question about iPhone repair' })
    @IsString()
    subject: string;

    @ApiProperty({ example: 'Hello, I want to know the price for...' })
    @IsString()
    initialMessage: string;

    @ApiProperty({ description: 'Session ID from cookie for returning users' })
    @IsString()
    sessionId: string;

    @ApiPropertyOptional({ description: 'File attachments', type: [AttachmentDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttachmentDto)
    attachments?: AttachmentDto[];
}

export class AddMessageDto {
    @ApiProperty({ example: 'Thank you for your reply...' })
    @IsString()
    message: string;

    @ApiProperty({ example: 'customer', description: 'customer or staff' })
    @IsString()
    sender: string;

    @ApiPropertyOptional({ description: 'File attachments', type: [AttachmentDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttachmentDto)
    attachments?: AttachmentDto[];
}

export class UpdateTicketDto {
    @ApiPropertyOptional({ enum: TicketStatus })
    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus;
}

export class GetTicketBySessionDto {
    @ApiProperty({ description: 'Session ID from cookie' })
    @IsString()
    sessionId: string;
}
