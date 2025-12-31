import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { TenantFeaturesService } from './tenant-features.service';
import { TenantSeederService } from './tenant-seeder.service';
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
    providers: [OwnerService, TenantFeaturesService, TenantSeederService, OwnerGuard],
    exports: [OwnerService, TenantFeaturesService, TenantSeederService, OwnerGuard],
})
export class OwnerModule { }


