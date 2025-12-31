import { Module, MiddlewareConsumer, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantMiddleware } from './tenant.middleware';
import { PrismaModule } from '../../prisma';
import { OwnerModule } from '../owner/owner.module';

@Module({
    imports: [PrismaModule, forwardRef(() => OwnerModule)],
    controllers: [TenantController],
    providers: [TenantService, TenantMiddleware],
    exports: [TenantService, TenantMiddleware],
})
export class TenantModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Multi-tenancy ENABLED
        // =====================
        // All requests go through tenant resolution except excluded paths.
        // Tenant context is attached to request as req.tenant and req.tenantId.
        consumer
            .apply(TenantMiddleware)
            .exclude(
                // Health checks (used by monitoring, no domain context)
                { path: 'health', method: RequestMethod.GET },
                { path: 'api/health', method: RequestMethod.GET },
                // Swagger documentation (development tool)
                { path: 'api/docs', method: RequestMethod.ALL },
                { path: 'api/docs/(.*)', method: RequestMethod.ALL },
                // Stripe webhooks (external origin, no domain context)
                { path: 'api/orders/webhook', method: RequestMethod.POST },
                // Owner panel routes (platform-level, no tenant context)
                { path: 'api/owner', method: RequestMethod.ALL },
                { path: 'api/owner/(.*)', method: RequestMethod.ALL },
                { path: 'api/auth/owner-login', method: RequestMethod.POST },
            )
            .forRoutes('*');

        console.log('🏢 TenantModule: Middleware ENABLED for multi-tenant mode.');
    }
}
