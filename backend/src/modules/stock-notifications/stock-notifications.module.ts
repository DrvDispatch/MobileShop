import { Module } from '@nestjs/common';
import { StockNotificationsService } from './stock-notifications.service';
import { StockNotificationsController } from './stock-notifications.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [PrismaModule, EmailModule],
    controllers: [StockNotificationsController],
    providers: [StockNotificationsService],
    exports: [StockNotificationsService],
})
export class StockNotificationsModule { }
