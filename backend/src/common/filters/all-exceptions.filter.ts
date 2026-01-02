/**
 * All Exceptions Filter
 * 
 * Catches any unhandled exceptions as a fallback.
 */

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorCodes } from '../dto/api-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Er is een onverwachte fout opgetreden';

        if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(
                `${request.method} ${request.url} - Unhandled Exception: ${message}`,
                exception.stack,
            );
        } else {
            this.logger.error(
                `${request.method} ${request.url} - Unknown Exception`,
                String(exception),
            );
        }

        // Don't expose internal error details in production
        if (process.env.NODE_ENV === 'production') {
            message = 'Er is een onverwachte fout opgetreden';
        }

        response.status(status).json({
            success: false,
            error: {
                code: ErrorCodes.INTERNAL_ERROR,
                message,
            },
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
