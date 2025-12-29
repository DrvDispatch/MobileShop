import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../email/email.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

export interface InvoiceData {
    orderNumber: string;
    orderDate: Date;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress?: {
        line1: string;
        line2?: string;
        city: string;
        postalCode: string;
        country: string;
    };
    billingAddress?: {
        line1: string;
        line2?: string;
        city: string;
        postalCode: string;
        country: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    subtotal: number;
    shippingAmount: number;
    taxAmount: number;
    total: number;
    fulfillmentType: 'SHIPPING' | 'PICKUP' | 'WALKIN';
}

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
export class InvoiceService {
    private readonly logger = new Logger(InvoiceService.name);

    constructor(
        private prisma: PrismaService,
        private settingsService: SettingsService,
        private emailService: EmailService,
    ) { }

    /**
     * Get invoice settings from database or defaults
     */
    async getInvoiceSettings(): Promise<InvoiceSettings> {
        const settings = await this.prisma.setting.findMany({
            where: {
                key: { startsWith: 'invoice.' },
            },
        });

        const settingsMap: Record<string, unknown> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        // Get store settings for defaults
        const storeSettings = await this.prisma.setting.findMany({
            where: {
                key: { startsWith: 'store.' },
            },
        });

        storeSettings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        return {
            companyName: (settingsMap['invoice.companyName'] as string) ||
                (settingsMap['store.name'] as string) || '',
            companyAddress: (settingsMap['invoice.companyAddress'] as InvoiceSettings['companyAddress']) ||
                (settingsMap['store.address'] as InvoiceSettings['companyAddress']) || {
                line1: '',
                city: '',
                postalCode: '',
                country: 'BE',
            },
            vatNumber: (settingsMap['invoice.vatNumber'] as string) ||
                (settingsMap['store.vatNumber'] as string) || '',
            phone: (settingsMap['invoice.phone'] as string) ||
                (settingsMap['store.phone'] as string) || '',
            email: (settingsMap['invoice.email'] as string) ||
                (settingsMap['store.email'] as string) || '',
            website: (settingsMap['invoice.website'] as string) || '',
            bankAccount: (settingsMap['invoice.bankAccount'] as string) || '',
            bankName: (settingsMap['invoice.bankName'] as string) || '',
            invoicePrefix: (settingsMap['invoice.prefix'] as string) || 'FAC',
            invoiceFooter: (settingsMap['invoice.footer'] as string) || '',
            logoUrl: (settingsMap['invoice.logoUrl'] as string) || undefined,
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
            await this.prisma.setting.upsert({
                where: { key },
                create: { key, value: value as object },
                update: { value: value as object },
            });
        }
    }

    /**
     * Generate PDF invoice and return as Buffer
     */
    async generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
        const settings = await this.getInvoiceSettings();
        const invoiceNumber = `${settings.invoicePrefix}-${data.orderNumber}`;

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const doc = new PDFDocument({ size: 'A4', margin: 50 });

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header - Left side (Company info)
            let leftY = 50;
            if (settings.companyName) {
                doc.fontSize(20).fillColor('#000').text(settings.companyName, 50, leftY);
                leftY += 28;
            }
            doc.fontSize(10).fillColor('#666');
            if (settings.companyAddress.line1) {
                doc.text(settings.companyAddress.line1, 50, leftY);
                leftY += 14;
            }
            if (settings.companyAddress.postalCode || settings.companyAddress.city) {
                doc.text(`${settings.companyAddress.postalCode} ${settings.companyAddress.city}`.trim(), 50, leftY);
                leftY += 14;
            }
            if (settings.vatNumber) {
                doc.text(`BTW: ${settings.vatNumber}`, 50, leftY);
                leftY += 14;
            }
            if (settings.phone) {
                doc.text(`Tel: ${settings.phone}`, 50, leftY);
                leftY += 14;
            }
            if (settings.email) {
                doc.text(`Email: ${settings.email}`, 50, leftY);
            }

            // Header - Right side (Invoice details) - Use fixed width area
            const rightColX = 350;
            const rightColWidth = 195;
            doc.fontSize(24).fillColor('#000').text('FACTUUR', rightColX, 50, { width: rightColWidth, align: 'right' });

            doc.fontSize(9).fillColor('#666');
            doc.text(`Factuurnummer: ${invoiceNumber}`, rightColX, 82, { width: rightColWidth, align: 'right' });
            doc.text(`Datum: ${this.formatDate(data.orderDate)}`, rightColX, 96, { width: rightColWidth, align: 'right' });
            doc.text(`Bestelnummer: ${data.orderNumber}`, rightColX, 110, { width: rightColWidth, align: 'right' });

            // Divider
            doc.moveTo(50, 140).lineTo(545, 140).stroke('#ddd');

            // Customer info
            doc.fontSize(12).fillColor('#000').text('Factuuradres', 50, 175);
            doc.fontSize(10).fillColor('#333')
                .text(data.customerName, 50, 195)
                .text(data.customerEmail, 50, 207);

            if (data.shippingAddress) {
                doc.text(data.shippingAddress.line1, 50, 219);
                let yPos = 231;
                if (data.shippingAddress.line2) {
                    doc.text(data.shippingAddress.line2, 50, yPos);
                    yPos += 12;
                }
                doc.text(`${data.shippingAddress.postalCode} ${data.shippingAddress.city}`, 50, yPos);
                doc.text(this.getCountryName(data.shippingAddress.country), 50, yPos + 12);
            }

            // Delivery info on right
            let deliveryTitle = 'Verzendadres';
            if (data.fulfillmentType === 'PICKUP') {
                deliveryTitle = 'Afhalen in winkel';
            } else if (data.fulfillmentType === 'WALKIN') {
                deliveryTitle = 'Betaald in winkel';
            }
            doc.fontSize(12).fillColor('#000').text(deliveryTitle, 350, 175);

            if (data.fulfillmentType === 'SHIPPING' && data.shippingAddress) {
                doc.fontSize(10).fillColor('#333')
                    .text(data.customerName, 350, 195)
                    .text(data.shippingAddress.line1, 350, 207);
                let yPos = 219;
                if (data.shippingAddress.line2) {
                    doc.text(data.shippingAddress.line2, 350, yPos);
                    yPos += 12;
                }
                doc.text(`${data.shippingAddress.postalCode} ${data.shippingAddress.city}`, 350, yPos);
            } else if (data.fulfillmentType === 'WALKIN') {
                doc.fontSize(10).fillColor('#333')
                    .text('Reparatie voltooid &', 350, 195)
                    .text('direct overhandigd.', 350, 207);
            } else {
                doc.fontSize(10).fillColor('#333')
                    .text('Uw bestelling ligt klaar', 350, 195)
                    .text('in onze winkel.', 350, 207);
            }

            // Items table header
            const tableTop = 300;
            doc.rect(50, tableTop, 495, 25).fill('#f5f5f5');
            doc.fontSize(10).fillColor('#000')
                .text('Product', 60, tableTop + 8)
                .text('Aantal', 350, tableTop + 8)
                .text('Prijs', 410, tableTop + 8)
                .text('Totaal', 480, tableTop + 8);

            // Items
            let y = tableTop + 30;
            for (const item of data.items) {
                doc.fillColor('#333')
                    .text(item.name, 60, y, { width: 280 })
                    .text(item.quantity.toString(), 350, y)
                    .text(`€${item.unitPrice.toFixed(2)}`, 410, y)
                    .text(`€${item.totalPrice.toFixed(2)}`, 480, y);
                y += 20;
            }

            // Divider before totals
            y += 10;
            doc.moveTo(350, y).lineTo(545, y).stroke('#ddd');
            y += 15;

            // Totals
            doc.fontSize(10).fillColor('#666')
                .text('Subtotaal', 350, y)
                .text(`€${data.subtotal.toFixed(2)}`, 480, y, { align: 'right' });
            y += 18;

            doc.text('Verzendkosten', 350, y)
                .text(data.shippingAmount > 0 ? `€${data.shippingAmount.toFixed(2)}` : 'Gratis', 480, y, { align: 'right' });
            y += 18;

            // VAT info
            doc.text('BTW (21% inbegrepen)', 350, y)
                .text(`€${(data.subtotal * 0.21 / 1.21).toFixed(2)}`, 480, y, { align: 'right' });
            y += 25;

            // Total
            doc.rect(350, y - 5, 195, 25).fill('#000');
            doc.fontSize(12).fillColor('#fff')
                .text('TOTAAL', 360, y + 2)
                .text(`€${data.total.toFixed(2)}`, 480, y + 2, { align: 'right' });

            // Footer
            const footerY = 720;
            doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#ddd');

            doc.fontSize(9).fillColor('#888')
                .text(settings.invoiceFooter, 50, footerY + 15, {
                    width: 495,
                    align: 'center'
                });

            if (settings.bankAccount) {
                doc.text(`Bankrekening: ${settings.bankAccount}${settings.bankName ? ` (${settings.bankName})` : ''}`,
                    50, footerY + 35, { width: 495, align: 'center' });
            }

            doc.end();
        });
    }

    /**
     * Generate invoice for an order
     */
    async generateInvoiceForOrder(orderId: string): Promise<Buffer> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        const shippingAddress = order.shippingAddress as InvoiceData['shippingAddress'] | null;

        const invoiceData: InvoiceData = {
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone || undefined,
            shippingAddress: shippingAddress || undefined,
            items: order.items.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
            })),
            subtotal: Number(order.subtotal),
            shippingAmount: Number(order.shippingAmount),
            taxAmount: Number(order.taxAmount),
            total: Number(order.total),
            fulfillmentType: order.fulfillmentType as 'SHIPPING' | 'PICKUP',
        };

        return this.generateInvoicePdf(invoiceData);
    }

    /**
     * Verify that a user owns a specific order (by userId or email)
     */
    async verifyOrderOwnership(orderId: string, userId?: string, userEmail?: string): Promise<boolean> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { userId: true, customerEmail: true },
        });

        if (!order) {
            return false;
        }

        // Check by userId if available
        if (userId && order.userId === userId) {
            return true;
        }

        // Check by email
        if (userEmail && order.customerEmail.toLowerCase() === userEmail.toLowerCase()) {
            return true;
        }

        return false;
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('nl-BE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    private getCountryName(code: string): string {
        const countries: Record<string, string> = {
            'BE': 'België',
            'NL': 'Nederland',
            'DE': 'Duitsland',
            'FR': 'Frankrijk',
            'LU': 'Luxemburg',
            'GB': 'Verenigd Koninkrijk',
        };
        return countries[code.toUpperCase()] || code;
    }

    // ============================================
    // WALK-IN CUSTOMER INVOICE CRUD
    // ============================================

    /**
     * Generate next invoice number: INV-2024-0001
     */
    async generateInvoiceNumber(): Promise<string> {
        const settings = await this.getInvoiceSettings();
        const prefix = settings.invoicePrefix || 'INV';
        const year = new Date().getFullYear();

        // Find highest invoice number this year
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

        // Create invoice with items
        const invoice = await this.prisma.invoice.create({
            data: {
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

        // Deduct stock for product items if paid
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

        // Recalculate totals if discount changed
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

        // Deduct stock
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
     * Generate PDF for walk-in invoice
     */
    async generateWalkInInvoicePdf(invoiceId: string): Promise<Buffer> {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { items: true },
        });

        if (!invoice) throw new Error('Invoice not found');

        const invoiceData: InvoiceData = {
            orderNumber: invoice.invoiceNumber,
            orderDate: invoice.createdAt,
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            customerPhone: invoice.customerPhone || undefined,
            shippingAddress: invoice.customerAddress ? {
                line1: invoice.customerAddress,
                city: '',
                postalCode: '',
                country: 'BE',
            } : undefined,
            items: invoice.items.map(item => ({
                name: item.description,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
            })),
            subtotal: Number(invoice.subtotal),
            shippingAmount: 0,
            taxAmount: Number(invoice.taxAmount),
            total: Number(invoice.total),
            fulfillmentType: 'WALKIN',
        };

        return this.generateInvoicePdf(invoiceData);
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

        // Generate PDF
        const pdfBuffer = await this.generateWalkInInvoicePdf(invoiceId);

        // Send email with PDF attachment
        const success = await this.emailService.sendEmailWithAttachment({
            to: invoice.customerEmail,
            subject: `Factuur ${invoice.invoiceNumber} - SmartphoneService`,
            html: this.getInvoiceEmailHtml(invoice.customerName, invoice.invoiceNumber, Number(invoice.total)),
            attachments: [
                {
                    filename: `factuur-${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        if (success) {
            this.logger.log(`Invoice email with PDF sent to ${invoice.customerEmail} for ${invoice.invoiceNumber}`);

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
    private getInvoiceEmailHtml(customerName: string, invoiceNumber: string, total: number): string {
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
                                Bedankt voor uw bezoek aan SmartphoneService. Hieronder vindt u de details van uw factuur.
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
                                Bedankt voor uw vertrouwen in SmartphoneService.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

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

        // Search RepairDeviceService - these are the actual priced services
        const services = await this.prisma.repairDeviceService.findMany({
            where: {
                isActive: true,
                OR: [
                    { device: { name: { contains: query, mode: 'insensitive' } } },
                    { service: { name: { contains: query, mode: 'insensitive' } } },
                ],
            },
            include: {
                device: {
                    include: {
                        brand: true,
                    },
                },
                service: true,
            },
            take: 10,
        });

        // Format for frontend
        return services.map(s => ({
            id: s.id,
            name: `${s.device?.brand?.name || ''} ${s.device?.name || ''} - ${s.service?.name || ''}`.trim(),
            price: Number(s.price),
            deviceId: s.deviceId,
            serviceId: s.serviceId,
        }));
    }
}
