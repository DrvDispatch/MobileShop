/**
 * Pagination DTO
 * 
 * Reusable pagination query parameters for all list endpoints.
 */

import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
    @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20, maximum: 100 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Search query' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Sort field' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';

    /**
     * Get skip value for Prisma
     */
    get skip(): number {
        return ((this.page || 1) - 1) * (this.limit || 20);
    }

    /**
     * Get take value for Prisma
     */
    get take(): number {
        return this.limit || 20;
    }
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

/**
 * Create paginated response helper
 */
export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
}
