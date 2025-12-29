import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../../generated/prisma/client.js';

export interface AuditLogEntry {
    userId: string;
    userName: string;
    userRole: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    entityName?: string;
    description: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Log an admin action
     */
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: entry.userId,
                    userName: entry.userName,
                    userRole: entry.userRole,
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    entityName: entry.entityName,
                    description: entry.description,
                    oldValue: entry.oldValue ? JSON.parse(JSON.stringify(entry.oldValue)) : undefined,
                    newValue: entry.newValue ? JSON.parse(JSON.stringify(entry.newValue)) : undefined,
                    metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                },
            });
            this.logger.debug(`Audit: ${entry.action} ${entry.entityType} by ${entry.userName}`);
        } catch (error) {
            this.logger.error(`Failed to create audit log: ${error}`);
            // Don't throw - audit logging should never break the main flow
        }
    }

    /**
     * Get audit logs with filtering and pagination
     */
    async getLogs(options: {
        page?: number;
        limit?: number;
        userId?: string;
        action?: AuditAction;
        entityType?: string;
        entityId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { page = 1, limit = 50, userId, action, entityType, entityId, startDate, endDate } = options;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
            if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get activity for a specific entity
     */
    async getEntityHistory(entityType: string, entityId: string) {
        return this.prisma.auditLog.findMany({
            where: { entityType, entityId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Export logs as CSV
     */
    async exportLogs(options: {
        startDate?: Date;
        endDate?: Date;
        entityType?: string;
    }): Promise<string> {
        const { startDate, endDate, entityType } = options;

        const where: Record<string, unknown> = {};
        if (entityType) where.entityType = entityType;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
            if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
        }

        const logs = await this.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 10000, // Max export limit
        });

        // Create CSV
        const headers = ['Datum', 'Tijd', 'Gebruiker', 'Rol', 'Actie', 'Type', 'Entiteit', 'Beschrijving'];
        const rows = logs.map(log => [
            new Date(log.createdAt).toLocaleDateString('nl-NL'),
            new Date(log.createdAt).toLocaleTimeString('nl-NL'),
            log.userName,
            log.userRole,
            log.action,
            log.entityType,
            log.entityName || log.entityId || '',
            log.description,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');

        return csvContent;
    }
}
