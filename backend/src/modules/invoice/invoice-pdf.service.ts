/**
 * Invoice PDF Service
 * 
 * Handles PDF generation for invoices.
 * Supports both order invoices and walk-in invoices.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceSettingsService, InvoiceSettings } from './invoice-settings.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

export interface InvoiceData {
    tenantId?: string; // Added for tenant-scoped settings
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

@Injectable()
export class InvoicePdfService {
    private readonly logger = new Logger(InvoicePdfService.name);

    constructor(
        private prisma: PrismaService,
        private settingsService: InvoiceSettingsService,
    ) { }

    /**
     * Generate PDF invoice and return as Buffer
     */
    async generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
        this.logger.debug(`Starting PDF generation for order: ${data.orderNumber}`);
        const settings = await this.settingsService.getInvoiceSettings(data.tenantId);
        const invoiceNumber = `${settings.invoicePrefix}-${data.orderNumber}`;

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const doc = new PDFDocument({ size: 'A4', margin: 50 });

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                this.logger.debug(`PDF generation complete. Buffer size: ${buffer.length} bytes`);
                resolve(buffer);
            });
            doc.on('error', (err: { message: any; }) => {
                this.logger.error(`PDF generation error: ${err.message}`);
                reject(err);
            });

            // Force font registration - use built-in Helvetica
            doc.font('Helvetica');

            // Header - Left side (Company info)
            let leftY = 50;
            // Always render company name (use default if empty)
            const companyName = settings.companyName || 'Company Name';
            doc.fontSize(20).fillColor('#000').text(companyName, 50, leftY);
            leftY += 28;
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

            // Header - Right side (Invoice details)
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
            console.log(`=== RENDERING ${data.items.length} ITEMS ===`);
            for (const item of data.items) {
                console.log(`  Item: ${item.name}, Qty: ${item.quantity}, Price: ${item.unitPrice}`);
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
            tenantId: order.tenantId || undefined,
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
     * Generate PDF for walk-in invoice
     */
    async generateWalkInInvoicePdf(invoiceId: string): Promise<Buffer> {
        this.logger.debug(`Generating PDF for walk-in invoice: ${invoiceId}`);

        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { items: true },
        });

        this.logger.debug(`Invoice found: ${invoice ? 'yes' : 'no'}, Items count: ${invoice?.items?.length ?? 0}`);

        if (!invoice) throw new Error('Invoice not found');

        const invoiceData: InvoiceData = {
            tenantId: invoice.tenantId || undefined,
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

        this.logger.debug(`Invoice data for PDF: ${JSON.stringify({
            orderNumber: invoiceData.orderNumber,
            customerName: invoiceData.customerName,
            itemsCount: invoiceData.items.length,
            items: invoiceData.items,
            subtotal: invoiceData.subtotal,
            total: invoiceData.total,
        })}`);

        return this.generateInvoicePdf(invoiceData);
    }

    /**
     * Verify that a user owns a specific order
     */
    async verifyOrderOwnership(orderId: string, userId?: string, userEmail?: string): Promise<boolean> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { userId: true, customerEmail: true },
        });

        if (!order) return false;

        if (userId && order.userId === userId) return true;
        if (userEmail && order.customerEmail.toLowerCase() === userEmail.toLowerCase()) return true;

        return false;
    }

    // Private helpers
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
}
