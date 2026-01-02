import { Module, forwardRef } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketEmailService } from './ticket-email.service';
import { TicketsGateway } from './tickets.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
    imports: [PrismaModule, EmailModule, forwardRef(() => FeedbackModule)],
    controllers: [TicketsController],
    providers: [TicketsService, TicketEmailService, TicketsGateway],
    exports: [TicketsService, TicketEmailService, TicketsGateway],
})
export class TicketsModule { }
