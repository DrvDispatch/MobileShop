/**
 * API Response DTO
 * 
 * Standard response wrapper for consistent API responses.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
    @ApiProperty({ description: 'Indicates if the request was successful' })
    success: boolean;

    @ApiPropertyOptional({ description: 'Response data' })
    data?: T;

    @ApiPropertyOptional({ description: 'Response message' })
    message?: string;

    @ApiPropertyOptional({ description: 'Error details' })
    error?: {
        code: string;
        message: string;
        details?: any;
    };

    @ApiPropertyOptional({ description: 'Request timestamp' })
    timestamp?: string;

    @ApiPropertyOptional({ description: 'Request path' })
    path?: string;
}

/**
 * Create success response helper
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponseDto<T> {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Create error response helper
 */
export function createErrorResponse(
    code: string,
    message: string,
    details?: any,
    path?: string,
): ApiResponseDto {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
        path,
    };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
    TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

/**
 * Dutch error messages
 */
export const ErrorMessages = {
    [ErrorCodes.VALIDATION_ERROR]: 'Validatiefout in de ingevoerde gegevens',
    [ErrorCodes.NOT_FOUND]: 'De gevraagde bron is niet gevonden',
    [ErrorCodes.UNAUTHORIZED]: 'U bent niet geautoriseerd om deze actie uit te voeren',
    [ErrorCodes.FORBIDDEN]: 'U heeft geen toegang tot deze bron',
    [ErrorCodes.CONFLICT]: 'Er is een conflict met bestaande gegevens',
    [ErrorCodes.INTERNAL_ERROR]: 'Er is een interne serverfout opgetreden',
    [ErrorCodes.BAD_REQUEST]: 'Ongeldig verzoek',
    [ErrorCodes.TENANT_NOT_FOUND]: 'Winkel niet gevonden',
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Te veel verzoeken, probeer later opnieuw',
} as const;
