import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { EmailModule } from '../email/email.module';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceSettingsService } from './invoice-settings.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoiceCrudService } from './invoice-crud.service';

@Module({
    imports: [PrismaModule, SettingsModule, EmailModule],
    controllers: [InvoiceController],
    providers: [
        // Facade service (maintains backward compatibility)
        InvoiceService,
        // Specialized services
        InvoiceSettingsService,
        InvoicePdfService,
        InvoiceCrudService,
    ],
    exports: [
        InvoiceService,
        // Export specialized services for direct use if needed
        InvoiceSettingsService,
        InvoicePdfService,
    ],
})
export class InvoiceModule { }
