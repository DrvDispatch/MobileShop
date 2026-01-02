import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { TenantFeaturesService } from './tenant-features.service';
import { TenantSeederService } from './tenant-seeder.service';
import { ProductSeederService } from './product-seeder.service';
import { OwnerGuard } from './guards';
import { CloudflareModule } from '../cloudflare';

@Module({
    imports: [
        CloudflareModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    controllers: [OwnerController],
    providers: [OwnerService, TenantFeaturesService, TenantSeederService, ProductSeederService, OwnerGuard],
    exports: [OwnerService, TenantFeaturesService, TenantSeederService, ProductSeederService, OwnerGuard],
})
export class OwnerModule implements OnModuleInit {
    constructor(private moduleRef: ModuleRef) { }

    onModuleInit() {
        // Inject ProductSeederService into OwnerService to avoid circular dependency
        const ownerService = this.moduleRef.get(OwnerService, { strict: false });
        const productSeeder = this.moduleRef.get(ProductSeederService, { strict: false });
        ownerService.setProductSeeder(productSeeder);
    }
}


