import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentEmailService } from './appointment-email.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
    imports: [PrismaModule, EmailModule, FeedbackModule],
    controllers: [AppointmentsController],
    providers: [AppointmentsService, AppointmentEmailService],
    exports: [AppointmentsService, AppointmentEmailService],
})
export class AppointmentsModule { }
