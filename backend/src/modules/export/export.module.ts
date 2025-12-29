import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLogModule } from '../audit-logs/audit-log.module';

@Module({
    imports: [PrismaModule, AuditLogModule],
    controllers: [ExportController],
    providers: [ExportService],
    exports: [ExportService],
})
export class ExportModule { }

