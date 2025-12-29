import { Module } from '@nestjs/common';
import { SupportedDevicesController } from './supported-devices.controller';
import { SupportedDevicesService } from './supported-devices.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SupportedDevicesController],
    providers: [SupportedDevicesService],
    exports: [SupportedDevicesService],
})
export class SupportedDevicesModule { }
