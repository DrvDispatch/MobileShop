/**
 * Timing Interceptor
 * 
 * Logs request timing for performance monitoring.
 */

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('RequestTiming');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - startTime;
                    const logLevel = duration > 1000 ? 'warn' : 'debug';

                    if (logLevel === 'warn') {
                        this.logger.warn(`${method} ${url} - ${duration}ms (SLOW)`);
                    } else {
                        this.logger.debug(`${method} ${url} - ${duration}ms`);
                    }
                },
                error: (error) => {
                    const duration = Date.now() - startTime;
                    this.logger.error(`${method} ${url} - ${duration}ms - ERROR: ${error.message}`);
                },
            }),
        );
    }
}
