import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderCheckoutService } from './order-checkout.service';
import { OrderWebhookService } from './order-webhook.service';
import { OrderFulfillmentService } from './order-fulfillment.service';

@Module({
    imports: [PrismaModule, ConfigModule, EmailModule, InvoiceModule],
    controllers: [OrdersController],
    providers: [
        // Facade service
        OrdersService,
        // Specialized services
        OrderCheckoutService,
        OrderWebhookService,
        OrderFulfillmentService,
    ],
    exports: [
        OrdersService,
        OrderCheckoutService,
        OrderWebhookService,
    ],
})
export class OrdersModule { }
