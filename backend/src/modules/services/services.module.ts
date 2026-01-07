import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * ServicesModule - Generic Service Catalog
 * 
 * Vertical-agnostic service management for:
 * - Mobile repair shops (category hierarchy: Type → Brand → Model → Service)
 * - Barbershops (flat service list)
 * - Carwashes (package list)
 * - Any future vertical
 * 
 * Uses new generic tables: ServiceCategory, Service, Booking, BookingFlowConfig
 */
@Module({
    imports: [PrismaModule],
    controllers: [ServicesController],
    providers: [ServicesService],
    exports: [ServicesService],
})
export class ServicesModule { }
