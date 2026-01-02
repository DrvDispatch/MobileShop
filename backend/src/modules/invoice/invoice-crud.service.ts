/**
 * Invoice CRUD Service
 * 
 * Handles walk-in invoice CRUD operations.
 * Manages invoice creation, listing, updates, payments, and cancellation.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { InvoiceSettingsService } from './invoice-settings.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { getTenantBranding, TenantBranding } from '../../utils/tenant-branding';

@Injectable()
export class InvoiceCrudService {
    private readonly logger = new Logger(InvoiceCrudService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private settingsService: InvoiceSettingsService,
        private pdfService: InvoicePdfService,
    ) { }

    /**
     * Generate next invoice number: FAC-2024-0001
     */
    async generateInvoiceNumber(): Promise<string> {
        const settings = await this.settingsService.getInvoiceSettings();
        const prefix = settings.invoicePrefix || 'INV';
        const year = new Date().getFullYear();

        const lastInvoice = await this.prisma.invoice.findFirst({
            where: {
                invoiceNumber: { startsWith: `${prefix}-${year}-` },
            },
            orderBy: { invoiceNumber: 'desc' },
        });

        let sequence = 1;
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNumber.split('-');
            const lastSeq = parseInt(parts[parts.length - 1], 10);
            sequence = lastSeq + 1;
        }

        return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
    }

    /**
     * Create a new invoice for walk-in customer
     */
    async createInvoice(data: {
        customerName: string;
        customerEmail: string;
        customerPhone?: string;
        customerAddress?: string;
        customerVatNumber?: string;
        userId?: string;
        items: Array<{
            type: 'PRODUCT' | 'REPAIR' | 'CUSTOM';
            productId?: string;
            repairId?: string;
            description: string;
            quantity: number;
            unitPrice: number;
        }>;
        discountAmount?: number;
        notes?: string;
        adminNotes?: string;
        paymentMethod?: 'CASH' | 'CARD' | 'TRANSFER' | 'PENDING';
        markAsPaid?: boolean;
        createdBy: string;
        tenantId?: string; // From TenantMiddleware
    }) {
        const invoiceNumber = await this.generateInvoiceNumber();
        const taxRate = 21;

        // Calculate totals
        let subtotal = 0;
        const itemsWithTotals = data.items.map(item => {
            const totalPrice = item.quantity * item.unitPrice;
            subtotal += totalPrice;
            return { ...item, totalPrice };
        });

        const discountAmount = data.discountAmount || 0;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount - (taxableAmount / (1 + taxRate / 100));
        const total = taxableAmount;

        // Determine invoice type
        const hasProduct = data.items.some(i => i.type === 'PRODUCT');
        const hasRepair = data.items.some(i => i.type === 'REPAIR');
        const type = hasProduct && hasRepair ? 'MIXED' : (hasRepair ? 'REPAIR' : 'SALE');

        const invoice = await this.prisma.invoice.create({
            data: {
                tenantId: data.tenantId,
                invoiceNumber,
                type,
                status: data.markAsPaid ? 'PAID' : 'DRAFT',
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                customerAddress: data.customerAddress,
                customerVatNumber: data.customerVatNumber,
                userId: data.userId,
                subtotal,
                taxRate,
                taxAmount,
                discountAmount,
                total,
                paymentMethod: data.markAsPaid ? (data.paymentMethod || 'CASH') : 'PENDING',
                paidAt: data.markAsPaid ? new Date() : null,
                notes: data.notes,
                adminNotes: data.adminNotes,
                createdBy: data.createdBy,
                items: {
                    create: itemsWithTotals.map(item => ({
                        type: item.type,
                        productId: item.productId,
                        repairId: item.repairId,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                    })),
                },
            },
            include: { items: true },
        });

        if (data.markAsPaid) {
            await this.deductStockForInvoice(invoice.id);
        }

        return invoice;
    }

    /**
     * Deduct stock for product items in an invoice
     */
    private async deductStockForInvoice(invoiceId: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { items: true },
        });

        if (!invoice) return;

        for (const item of invoice.items) {
            if (item.type === 'PRODUCT' && item.productId) {
                await this.prisma.product.update({
                    where: { id: item.productId },
                    data: { stockQty: { decrement: item.quantity } },
                });
            }
        }
    }

    /**
     * Get invoices with pagination and filters
     */
    async getInvoices(options: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const { page = 1, limit = 20, status, search, startDate, endDate } = options;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
            if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
        }

        const [invoices, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                include: { items: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.invoice.count({ where }),
        ]);

        return {
            invoices,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get single invoice by ID
     */
    async getInvoiceById(id: string) {
        return this.prisma.invoice.findUnique({
            where: { id },
            include: { items: true },
        });
    }

    /**
     * Update a draft invoice
     */
    async updateInvoice(id: string, data: {
        customerName?: string;
        customerEmail?: string;
        customerPhone?: string;
        customerAddress?: string;
        customerVatNumber?: string;
        notes?: string;
        adminNotes?: string;
        discountAmount?: number;
    }) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.status !== 'DRAFT') throw new Error('Can only update draft invoices');

        let updateData: Record<string, unknown> = { ...data };
        if (data.discountAmount !== undefined) {
            const taxableAmount = Number(invoice.subtotal) - data.discountAmount;
            const taxAmount = taxableAmount - (taxableAmount / 1.21);
            updateData = {
                ...updateData,
                discountAmount: data.discountAmount,
                taxAmount,
                total: taxableAmount,
            };
        }

        return this.prisma.invoice.update({
            where: { id },
            data: updateData,
            include: { items: true },
        });
    }

    /**
     * Mark invoice as paid
     */
    async markInvoiceAsPaid(id: string, paymentMethod: 'CASH' | 'CARD' | 'TRANSFER') {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.status === 'PAID') throw new Error('Invoice already paid');
        if (invoice.status === 'CANCELLED') throw new Error('Cannot pay cancelled invoice');

        const updated = await this.prisma.invoice.update({
            where: { id },
            data: {
                status: 'PAID',
                paymentMethod,
                paidAt: new Date(),
            },
            include: { items: true },
        });

        await this.deductStockForInvoice(id);
        return updated;
    }

    /**
     * Cancel invoice
     */
    async cancelInvoice(id: string) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.status === 'PAID') throw new Error('Cannot cancel paid invoice');

        return this.prisma.invoice.update({
            where: { id },
            data: { status: 'CANCELLED' },
            include: { items: true },
        });
    }

    /**
     * Send invoice email
     */
    async sendInvoiceEmail(invoiceId: string): Promise<boolean> {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { items: true },
        });

        if (!invoice) throw new Error('Invoice not found');

        // Fetch tenant branding for email
        const branding = invoice.tenantId
            ? await getTenantBranding(this.prisma, invoice.tenantId)
            : { shopName: 'Support' } as TenantBranding;

        const pdfBuffer = await this.pdfService.generateWalkInInvoicePdf(invoiceId);

        const success = await this.emailService.sendEmailWithAttachment({
            to: invoice.customerEmail,
            subject: `Factuur ${invoice.invoiceNumber} - ${branding.shopName}`,
            html: this.getInvoiceEmailHtml(invoice.customerName, invoice.invoiceNumber, Number(invoice.total), branding.shopName),
            attachments: [
                {
                    filename: `factuur-${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        if (success) {
            this.logger.log(`Invoice email sent to ${invoice.customerEmail} for ${invoice.invoiceNumber}`);
            await this.prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    emailedAt: new Date(),
                    status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
                },
            });
        } else {
            this.logger.error(`Failed to send invoice email to ${invoice.customerEmail}`);
        }

        return success;
    }

    /**
     * Generate HTML content for invoice email
     */
    private getInvoiceEmailHtml(customerName: string, invoiceNumber: string, total: number, shopName: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="background: #000000; padding: 32px 40px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">
                                Uw Factuur ✓
                            </h1>
                        </div>
                        <div style="padding: 32px 40px;">
                            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                                Beste ${customerName},
                            </p>
                            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                Bedankt voor uw bezoek aan ${shopName}. Hieronder vindt u de details van uw factuur.
                            </p>
                            
                            <div style="background: #000; color: #fff; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">Factuurnummer</p>
                                <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${invoiceNumber}</p>
                            </div>
                            
                            <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                                <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                                    <span style="color: #000; font-weight: bold; font-size: 18px;">Totaal betaald</span>
                                    <span style="color: #000; font-weight: bold; font-size: 18px;">€${total.toFixed(2)}</span>
                                </div>
                                <p style="color: #888; font-size: 12px; margin: 4px 0 0;">Inclusief 21% BTW</p>
                            </div>
                            
                            <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
                                Heeft u vragen over uw factuur? Neem gerust contact met ons op via onze website of antwoord op deze email.
                            </p>
                        </div>
                        <div style="padding: 16px 40px 32px; border-top: 1px solid #eee;">
                            <p style="color: #666; font-size: 13px; margin: 0; line-height: 1.5;">
                                Bedankt voor uw vertrouwen in ${shopName}.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // ============================================
    // SEARCH HELPERS
    // ============================================

    /**
     * Search customers for autocomplete
     */
    async searchCustomers(query: string) {
        if (!query || query.length < 2) return [];

        return this.prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                ],
                role: 'CUSTOMER',
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
            take: 10,
        });
    }

    /**
     * Search products for invoice line items
     */
    async searchProducts(query: string) {
        if (!query || query.length < 2) return [];

        return this.prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { sku: { contains: query, mode: 'insensitive' } },
                ],
                isActive: true,
                stockQty: { gt: 0 },
            },
            select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                stockQty: true,
            },
            take: 10,
        });
    }

    /**
     * Search repair services for invoice line items
     */
    async searchRepairServices(query: string) {
        if (!query || query.length < 2) return [];

        const services = await this.prisma.repairDeviceService.findMany({
            where: {
                isActive: true,
                OR: [
                    { device: { name: { contains: query, mode: 'insensitive' } } },
                    { service: { name: { contains: query, mode: 'insensitive' } } },
                ],
            },
            include: {
                device: { include: { brand: true } },
                service: true,
            },
            take: 10,
        });

        return services.map(s => ({
            id: s.id,
            name: `${s.device?.brand?.name || ''} ${s.device?.name || ''} - ${s.service?.name || ''}`.trim(),
            price: Number(s.price),
            deviceId: s.deviceId,
            serviceId: s.serviceId,
        }));
    }
}
