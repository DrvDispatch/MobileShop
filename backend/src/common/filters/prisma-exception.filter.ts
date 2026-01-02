/**
 * Prisma Exception Filter
 * 
 * Catches Prisma database errors and formats them for the client.
 */

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { ErrorCodes } from '../dto/api-response.dto';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(PrismaExceptionFilter.name);

    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const { code, message } = exception;

        // Log the original error
        this.logger.error(`Prisma Error ${code}: ${message}`, exception.stack);

        // Map Prisma error codes to HTTP responses
        const errorResponse = this.mapPrismaError(code, exception);

        response.status(errorResponse.status).json({
            success: false,
            error: {
                code: errorResponse.code,
                message: errorResponse.message,
            },
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }

    private mapPrismaError(code: string, exception: Prisma.PrismaClientKnownRequestError): {
        status: number;
        code: string;
        message: string;
    } {
        switch (code) {
            case 'P2002':
                // Unique constraint violation
                const fields = (exception.meta?.target as string[])?.join(', ') || 'veld';
                return {
                    status: HttpStatus.CONFLICT,
                    code: ErrorCodes.CONFLICT,
                    message: `Een record met dit ${fields} bestaat al`,
                };

            case 'P2003':
                // Foreign key constraint violation
                return {
                    status: HttpStatus.BAD_REQUEST,
                    code: ErrorCodes.BAD_REQUEST,
                    message: 'Ongeldige referentie naar gerelateerde gegevens',
                };

            case 'P2025':
                // Record not found
                return {
                    status: HttpStatus.NOT_FOUND,
                    code: ErrorCodes.NOT_FOUND,
                    message: 'De gevraagde gegevens zijn niet gevonden',
                };

            case 'P2014':
                // Required relation violation
                return {
                    status: HttpStatus.BAD_REQUEST,
                    code: ErrorCodes.BAD_REQUEST,
                    message: 'Ontbrekende verplichte relatie',
                };

            case 'P2016':
                // Query interpretation error
                return {
                    status: HttpStatus.BAD_REQUEST,
                    code: ErrorCodes.BAD_REQUEST,
                    message: 'Ongeldige query parameters',
                };

            default:
                return {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    code: ErrorCodes.INTERNAL_ERROR,
                    message: 'Er is een databasefout opgetreden',
                };
        }
    }
}
