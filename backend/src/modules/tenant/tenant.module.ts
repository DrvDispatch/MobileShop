import { Module, MiddlewareConsumer, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantMiddleware } from './tenant.middleware';
import { UIConfigService } from './ui-config.service';
import { PrismaModule } from '../../prisma';
import { OwnerModule } from '../owner/owner.module';

@Module({
    imports: [PrismaModule, forwardRef(() => OwnerModule)],
    controllers: [TenantController],
    providers: [TenantService, TenantMiddleware, UIConfigService],
    exports: [TenantService, TenantMiddleware, UIConfigService],
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
                { path: 'orders/webhook', method: RequestMethod.POST },
                { path: 'api/orders/webhook', method: RequestMethod.POST },
                // Stripe checkout redirects (platform-level, resolves tenant then redirects)
                // Include both with and without api/ prefix for compatibility
                { path: 'orders/checkout-success', method: RequestMethod.GET },
                { path: 'orders/checkout-cancel', method: RequestMethod.GET },
                { path: 'orders/resolve-session/(.*)', method: RequestMethod.GET },
                { path: 'api/orders/checkout-success', method: RequestMethod.GET },
                { path: 'api/orders/checkout-cancel', method: RequestMethod.GET },
                { path: 'api/orders/resolve-session/(.*)', method: RequestMethod.GET },
                // Owner panel routes (platform-level, no tenant context)
                { path: 'api/owner', method: RequestMethod.ALL },
                { path: 'api/owner/(.*)', method: RequestMethod.ALL },
                { path: 'owner', method: RequestMethod.ALL },
                { path: 'owner/(.*)', method: RequestMethod.ALL },
                { path: 'api/auth/owner-login', method: RequestMethod.POST },
                { path: 'auth/owner-login', method: RequestMethod.POST },
            )
            .forRoutes('*');

        console.log('🏢 TenantModule: Middleware ENABLED for multi-tenant mode.');
    }
}
