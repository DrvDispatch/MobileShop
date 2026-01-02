/**
 * Response Transform Interceptor
 * 
 * Standardizes all API responses with consistent structure.
 */

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
    path: string;
}

@Injectable()
export class ResponseTransformInterceptor<T>
    implements NestInterceptor<T, StandardResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<StandardResponse<T>> {
        const request = context.switchToHttp().getRequest();
        const path = request.url;

        return next.handle().pipe(
            map((data) => {
                // If data already has success property, return as-is
                if (data && typeof data === 'object' && 'success' in data) {
                    return data;
                }

                return {
                    success: true,
                    data,
                    timestamp: new Date().toISOString(),
                    path,
                };
            }),
        );
    }
}
