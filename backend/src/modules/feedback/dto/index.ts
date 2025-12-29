import { IsString, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
    @ApiProperty({ description: 'Source type: ticket or repair' })
    @IsString()
    sourceType: 'ticket' | 'repair';

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    ticketId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    repairTicketId?: string;

    @ApiProperty()
    @IsString()
    customerEmail: string;

    @ApiProperty()
    @IsString()
    customerName: string;
}

export class SubmitRatingDto {
    @ApiProperty({ description: 'Star rating 1-5' })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ description: 'Optional comment' })
    @IsString()
    @IsOptional()
    comment?: string;

    @ApiPropertyOptional({ description: 'Whether Google Review was clicked' })
    @IsBoolean()
    @IsOptional()
    googleReviewClicked?: boolean;
}

export class FeedbackResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    token: string;

    @ApiProperty()
    sourceType: string;

    @ApiPropertyOptional()
    rating?: number;

    @ApiProperty()
    customerName: string;

    @ApiProperty()
    createdAt: Date;

    @ApiPropertyOptional()
    ratedAt?: Date;
}
