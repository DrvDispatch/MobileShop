/**
 * Invoice Settings Service
 * 
 * Handles invoice settings retrieval and updates.
 * Manages company info, VAT, bank details, invoice prefix/footer.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface InvoiceSettings {
    companyName: string;
    companyAddress: {
        line1: string;
        line2?: string;
        city: string;
        postalCode: string;
        country: string;
    };
    vatNumber: string;
    phone: string;
    email: string;
    website?: string;
    bankAccount?: string;
    bankName?: string;
    invoicePrefix: string;
    invoiceFooter: string;
    logoUrl?: string;
}

@Injectable()
export class InvoiceSettingsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get invoice settings from database or defaults
     * Priority: invoice.* settings > TenantConfig > defaults
     * TenantConfig is the PRIMARY source for company details from owner panel
     * @param tenantId - Optional tenant ID to scope the query. If not provided, uses first tenant.
     */
    async getInvoiceSettings(tenantId?: string): Promise<InvoiceSettings> {
        // Get invoice-specific overrides (highest priority for invoice customization)
        const invoiceSettings = await this.prisma.setting.findMany({
            where: {
                key: { startsWith: 'invoice.' },
                ...(tenantId ? { tenantId } : {}),
            },
        });

        const invoiceMap: Record<string, unknown> = {};
        invoiceSettings.forEach(s => {
            invoiceMap[s.key] = s.value;
        });

        // Get TenantConfig - this is the PRIMARY source from owner panel
        // Query by tenantId if provided, otherwise use first tenant as fallback
        const tenantConfig = await this.prisma.tenantConfig.findFirst({
            where: tenantId ? { tenantId } : undefined,
            select: {
                shopName: true,
                email: true,
                phone: true,
                address: true,
                // Invoice-specific fields from owner panel
                companyName: true,
                vatNumber: true,
                bankAccount: true,
                bankName: true,
                invoicePrefix: true,
                invoiceFooter: true,
                website: true,
            }
        });

        // Parse tenant address if available
        const tenantAddress = tenantConfig?.address as {
            line1?: string;
            line2?: string;
            city?: string;
            postalCode?: string;
            country?: string
        } | null;

        // Build settings: invoice.* overrides > TenantConfig > defaults
        return {
            // Company name: invoice override > tenant companyName > tenant shopName > empty
            companyName: (invoiceMap['invoice.companyName'] as string) ||
                tenantConfig?.companyName ||
                tenantConfig?.shopName || '',

            // Company address: invoice override > tenant config > empty
            companyAddress: (invoiceMap['invoice.companyAddress'] as InvoiceSettings['companyAddress']) ||
                (tenantAddress ? {
                    line1: tenantAddress.line1 || '',
                    line2: tenantAddress.line2,
                    city: tenantAddress.city || '',
                    postalCode: tenantAddress.postalCode || '',
                    country: tenantAddress.country || 'BE',
                } : {
                    line1: '',
                    city: '',
                    postalCode: '',
                    country: 'BE',
                }),

            // VAT: invoice override > tenant config > empty
            vatNumber: (invoiceMap['invoice.vatNumber'] as string) ||
                tenantConfig?.vatNumber || '',

            // Phone: invoice override > tenant config > empty
            phone: (invoiceMap['invoice.phone'] as string) ||
                tenantConfig?.phone || '',

            // Email: invoice override > tenant config > empty
            email: (invoiceMap['invoice.email'] as string) ||
                tenantConfig?.email || '',

            // Website: invoice override > tenant config > empty
            website: (invoiceMap['invoice.website'] as string) ||
                tenantConfig?.website || '',

            // Bank: invoice override > tenant config > empty
            bankAccount: (invoiceMap['invoice.bankAccount'] as string) ||
                tenantConfig?.bankAccount || '',
            bankName: (invoiceMap['invoice.bankName'] as string) ||
                tenantConfig?.bankName || '',

            // Invoice prefix/footer: invoice override > tenant config > defaults
            invoicePrefix: (invoiceMap['invoice.prefix'] as string) ||
                tenantConfig?.invoicePrefix || 'FAC',
            invoiceFooter: (invoiceMap['invoice.footer'] as string) ||
                tenantConfig?.invoiceFooter || '',
            logoUrl: (invoiceMap['invoice.logoUrl'] as string) || undefined,
        };
    }

    /**
     * Update invoice settings
     */
    async updateInvoiceSettings(settings: Partial<InvoiceSettings>): Promise<void> {
        const updates: { key: string; value: unknown }[] = [];

        if (settings.companyName !== undefined) {
            updates.push({ key: 'invoice.companyName', value: settings.companyName });
        }
        if (settings.companyAddress !== undefined) {
            updates.push({ key: 'invoice.companyAddress', value: settings.companyAddress });
        }
        if (settings.vatNumber !== undefined) {
            updates.push({ key: 'invoice.vatNumber', value: settings.vatNumber });
        }
        if (settings.phone !== undefined) {
            updates.push({ key: 'invoice.phone', value: settings.phone });
        }
        if (settings.email !== undefined) {
            updates.push({ key: 'invoice.email', value: settings.email });
        }
        if (settings.website !== undefined) {
            updates.push({ key: 'invoice.website', value: settings.website });
        }
        if (settings.bankAccount !== undefined) {
            updates.push({ key: 'invoice.bankAccount', value: settings.bankAccount });
        }
        if (settings.bankName !== undefined) {
            updates.push({ key: 'invoice.bankName', value: settings.bankName });
        }
        if (settings.invoicePrefix !== undefined) {
            updates.push({ key: 'invoice.prefix', value: settings.invoicePrefix });
        }
        if (settings.invoiceFooter !== undefined) {
            updates.push({ key: 'invoice.footer', value: settings.invoiceFooter });
        }
        if (settings.logoUrl !== undefined) {
            updates.push({ key: 'invoice.logoUrl', value: settings.logoUrl });
        }

        for (const { key, value } of updates) {
            // Find existing global setting (tenantId = null)
            const existing = await this.prisma.setting.findFirst({
                where: { key, tenantId: null }
            });

            if (existing) {
                await this.prisma.setting.update({
                    where: { id: existing.id },
                    data: { value: value as object },
                });
            } else {
                await this.prisma.setting.create({
                    data: { key, value: value as object },
                });
            }
        }
    }
}
