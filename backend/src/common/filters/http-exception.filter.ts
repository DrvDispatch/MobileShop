/**
 * HTTP Exception Filter
 * 
 * Catches all HTTP exceptions and formats them consistently.
 */

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorCodes, ErrorMessages } from '../dto/api-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        // Extract message from exception
        let message: string;
        let errorCode: string;
        let details: any;

        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const resp = exceptionResponse as Record<string, any>;
            message = resp.message || exception.message;
            details = resp.errors || resp.details;

            // Map HTTP status to error code
            errorCode = this.mapStatusToErrorCode(status);
        } else {
            message = exception.message;
            errorCode = this.mapStatusToErrorCode(status);
        }

        // Log error
        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${message}`,
            exception.stack,
        );

        response.status(status).json({
            success: false,
            error: {
                code: errorCode,
                message: Array.isArray(message) ? message.join(', ') : message,
                details,
            },
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }

    private mapStatusToErrorCode(status: number): string {
        switch (status) {
            case HttpStatus.BAD_REQUEST:
                return ErrorCodes.VALIDATION_ERROR;
            case HttpStatus.UNAUTHORIZED:
                return ErrorCodes.UNAUTHORIZED;
            case HttpStatus.FORBIDDEN:
                return ErrorCodes.FORBIDDEN;
            case HttpStatus.NOT_FOUND:
                return ErrorCodes.NOT_FOUND;
            case HttpStatus.CONFLICT:
                return ErrorCodes.CONFLICT;
            case HttpStatus.TOO_MANY_REQUESTS:
                return ErrorCodes.RATE_LIMIT_EXCEEDED;
            default:
                return ErrorCodes.INTERNAL_ERROR;
        }
    }
}
