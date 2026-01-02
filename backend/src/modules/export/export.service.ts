import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportService {
    private readonly logger = new Logger(ExportService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Export orders to CSV (tenant-scoped)
     */
    async exportOrders(tenantId: string, options: {
        startDate?: Date;
        endDate?: Date;
        status?: string;
    }): Promise<string> {
        const { startDate, endDate, status } = options;

        const where: Record<string, unknown> = { tenantId };
        if (status) where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
            if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
        }

        const orders = await this.prisma.order.findMany({
            where,
            include: { items: true },
            orderBy: { createdAt: 'desc' },
            take: 10000,
        });

        const headers = [
            'Bestelnummer', 'Status', 'Datum', 'Klant', 'Email', 'Telefoon',
            'Subtotaal', 'Verzending', 'Korting', 'Totaal', 'Betaald op',
            'Verzonden op', 'Geleverd op', 'Type', 'Producten'
        ];

        const rows = orders.map(order => {
            const shippingAddress = order.shippingAddress as { city?: string } | null;
            return [
                order.orderNumber,
                order.status,
                new Date(order.createdAt).toLocaleDateString('nl-NL'),
                order.customerName,
                order.customerEmail,
                order.customerPhone || '',
                Number(order.subtotal).toFixed(2),
                Number(order.shippingAmount).toFixed(2),
                Number(order.discountAmount).toFixed(2),
                Number(order.total).toFixed(2),
                order.paidAt ? new Date(order.paidAt).toLocaleDateString('nl-NL') : '',
                order.shippedAt ? new Date(order.shippedAt).toLocaleDateString('nl-NL') : '',
                order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('nl-NL') : '',
                order.fulfillmentType === 'PICKUP' ? 'Afhalen' : `Verzending ${shippingAddress?.city || ''}`,
                order.items.map(i => `${i.productName} (${i.quantity}x)`).join('; '),
            ];
        });

        return this.toCsv(headers, rows);
    }

    /**
     * Export products to CSV (tenant-scoped)
     */
    async exportProducts(tenantId: string, options: {
        includeInactive?: boolean;
        lowStockOnly?: boolean;
    }): Promise<string> {
        const { includeInactive, lowStockOnly } = options;

        const where: Record<string, unknown> = { tenantId };
        if (!includeInactive) where.isActive = true;
        if (lowStockOnly) where.stockQty = { lte: 5 };

        const products = await this.prisma.product.findMany({
            where,
            orderBy: { name: 'asc' },
            take: 10000,
        });

        const headers = [
            'Naam', 'SKU', 'Merk', 'Conditie', 'Prijs', 'Originele Prijs',
            'Voorraad', 'Actief', 'Uitgelicht', 'Type', 'Opslag', 'Kleur',
            'Batterij %', 'Slug', 'Aangemaakt'
        ];

        const rows = products.map(product => [
            product.name,
            product.sku || '',
            product.brand || '',
            product.condition || '',
            Number(product.price).toFixed(2),
            product.compareAtPrice ? Number(product.compareAtPrice).toFixed(2) : '',
            product.stockQty,
            product.isActive ? 'Ja' : 'Nee',
            product.isFeatured ? 'Ja' : 'Nee',
            product.productType || '',
            product.storage || '',
            product.color || '',
            product.batteryHealth ? `${product.batteryHealth}%` : '',
            product.slug,
            new Date(product.createdAt).toLocaleDateString('nl-NL'),
        ]);

        return this.toCsv(headers, rows);
    }

    /**
     * Export customers to CSV (tenant-scoped)
     */
    async exportCustomers(tenantId: string, options: {
        includeInactive?: boolean;
        vipOnly?: boolean;
    }): Promise<string> {
        const { includeInactive, vipOnly } = options;

        const where: Record<string, unknown> = { tenantId, role: 'CUSTOMER' };
        if (!includeInactive) where.isActive = true;
        if (vipOnly) where.isVip = true;

        const users = await this.prisma.user.findMany({
            where,
            include: {
                _count: { select: { orders: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10000,
        });

        const headers = [
            'Naam', 'Email', 'Telefoon', 'VIP', 'Totaal Uitgegeven',
            'Aantal Bestellingen', 'Laatste Activiteit', 'Geregistreerd', 'Actief'
        ];

        const rows = users.map(user => [
            user.name,
            user.email,
            user.phone || '',
            user.isVip ? 'Ja' : 'Nee',
            `€${Number(user.totalSpent).toFixed(2)}`,
            user._count.orders,
            user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString('nl-NL') : '',
            new Date(user.createdAt).toLocaleDateString('nl-NL'),
            user.isActive ? 'Ja' : 'Nee',
        ]);

        return this.toCsv(headers, rows);
    }

    /**
     * Export refunds to CSV (tenant-scoped via order)
     */
    async exportRefunds(tenantId: string, options: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<string> {
        const { startDate, endDate } = options;

        const where: Record<string, unknown> = {
            order: { tenantId },
        };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
            if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
        }

        const refunds = await this.prisma.refund.findMany({
            where,
            include: {
                order: { select: { orderNumber: true, customerName: true, customerEmail: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10000,
        });

        const headers = [
            'Refund ID', 'Bestelnummer', 'Klant', 'Email', 'Status',
            'Type', 'Bedrag', 'Reden', 'Aangemaakt', 'Afgerond op'
        ];

        const rows = refunds.map(refund => [
            refund.id.slice(0, 8),
            refund.order.orderNumber,
            refund.order.customerName,
            refund.order.customerEmail,
            refund.status,
            String(refund.reason) || '',
            `€${Number(refund.amount).toFixed(2)}`,
            refund.reason || '',
            new Date(refund.createdAt).toLocaleDateString('nl-NL'),
            refund.processedAt ? new Date(refund.processedAt).toLocaleDateString('nl-NL') : '',
        ]);

        return this.toCsv(headers, rows);
    }

    /**
     * Export reviews to CSV (tenant-scoped via product)
     */
    async exportReviews(tenantId: string): Promise<string> {
        const reviews = await this.prisma.productReview.findMany({
            where: {
                product: { tenantId },
            },
            include: {
                product: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10000,
        });

        const headers = [
            'Product', 'Reviewer', 'Email', 'Rating', 'Titel', 'Comment',
            'Geverifieerd', 'Goedgekeurd', 'Zichtbaar', 'Datum'
        ];

        const rows = reviews.map(review => [
            review.product.name,
            review.reviewerName,
            review.reviewerEmail,
            review.rating,
            review.title || '',
            review.comment || '',
            review.isVerified ? 'Ja' : 'Nee',
            review.isApproved ? 'Ja' : 'Nee',
            review.isVisible ? 'Ja' : 'Nee',
            new Date(review.createdAt).toLocaleDateString('nl-NL'),
        ]);

        return this.toCsv(headers, rows);
    }

    // ============================================
    // BELGIAN TAX EXPORTS (Boekhoudkundig)
    // ============================================

    /**
     * Get quarter date range
     */
    private getQuarterDates(quarter: number, year: number): { startDate: Date; endDate: Date } {
        const quarters: Record<number, { start: Date; end: Date }> = {
            1: { start: new Date(year, 0, 1), end: new Date(year, 2, 31, 23, 59, 59) },
            2: { start: new Date(year, 3, 1), end: new Date(year, 5, 30, 23, 59, 59) },
            3: { start: new Date(year, 6, 1), end: new Date(year, 8, 30, 23, 59, 59) },
            4: { start: new Date(year, 9, 1), end: new Date(year, 11, 31, 23, 59, 59) },
        };
        return { startDate: quarters[quarter].start, endDate: quarters[quarter].end };
    }

    /**
     * BTW Aangifte - Quarterly VAT Summary for Belgian tax filing (tenant-scoped)
     */
    async exportBTWAangifte(tenantId: string, quarter: number, year: number): Promise<string> {
        const { startDate, endDate } = this.getQuarterDates(quarter, year);
        const BTW_RATE = 0.21;

        // Get all paid orders in the quarter (tenant-scoped)
        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                paidAt: { gte: startDate, lte: endDate, not: null },
            },
            orderBy: { paidAt: 'asc' },
        });

        // Get refunds in the quarter (tenant-scoped via order)
        const refunds = await this.prisma.refund.findMany({
            where: {
                order: { tenantId },
                status: 'SUCCEEDED',
                processedAt: { gte: startDate, lte: endDate },
            },
        });

        // Calculate totals
        const totalBruto = orders.reduce((sum, o) => sum + Number(o.total), 0);
        const totalNetto = totalBruto / (1 + BTW_RATE);
        const totalBTW = totalBruto - totalNetto;

        const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
        const refundNetto = totalRefunds / (1 + BTW_RATE);
        const refundBTW = totalRefunds - refundNetto;

        const netBruto = totalBruto - totalRefunds;
        const netNetto = totalNetto - refundNetto;
        const netBTW = totalBTW - refundBTW;

        const headers = [
            'Omschrijving', 'Bedrag (€)'
        ];

        const rows = [
            ['BTW Aangifte Kwartaal ' + quarter + ' - ' + year, ''],
            ['Periode', `${startDate.toLocaleDateString('nl-BE')} - ${endDate.toLocaleDateString('nl-BE')}`],
            ['', ''],
            ['OMZET', ''],
            ['Totaal Bruto Omzet (incl. BTW)', this.formatEuro(totalBruto)],
            ['Totaal Netto Omzet (excl. BTW)', this.formatEuro(totalNetto)],
            ['Totaal BTW 21%', this.formatEuro(totalBTW)],
            ['Aantal facturen', orders.length],
            ['', ''],
            ['CREDITNOTA\'S / TERUGBETALINGEN', ''],
            ['Totaal Terugbetalingen (incl. BTW)', this.formatEuro(totalRefunds)],
            ['Terugbetalingen Netto', this.formatEuro(refundNetto)],
            ['Terug te vorderen BTW', this.formatEuro(refundBTW)],
            ['Aantal creditnota\'s', refunds.length],
            ['', ''],
            ['NETTO RESULTAAT', ''],
            ['Netto Omzet na correcties', this.formatEuro(netNetto)],
            ['Te betalen BTW', this.formatEuro(netBTW)],
            ['Totaal incl. BTW', this.formatEuro(netBruto)],
        ];

        return this.toCsv(headers, rows);
    }

    /**
     * Detailed Accountant Report - Transaction by transaction (tenant-scoped)
     */
    async exportAccountantReport(tenantId: string, quarter: number, year: number): Promise<string> {
        const { startDate, endDate } = this.getQuarterDates(quarter, year);
        const BTW_RATE = 0.21;

        // Get all paid orders (tenant-scoped)
        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                paidAt: { gte: startDate, lte: endDate, not: null },
            },
            include: { items: true },
            orderBy: { paidAt: 'asc' },
        });

        // Get refunds (tenant-scoped via order)
        const refunds = await this.prisma.refund.findMany({
            where: {
                order: { tenantId },
                status: 'SUCCEEDED',
                processedAt: { gte: startDate, lte: endDate },
            },
            include: {
                order: { select: { orderNumber: true, customerName: true } },
            },
            orderBy: { processedAt: 'asc' },
        });

        const headers = [
            'Type', 'Factuurnummer', 'Datum', 'Klant', 'Omschrijving',
            'Netto (€)', 'BTW 21% (€)', 'Bruto (€)', 'Betaalstatus'
        ];

        const rows: (string | number)[][] = [];

        // Add orders
        for (const order of orders) {
            const bruto = Number(order.total);
            const netto = bruto / (1 + BTW_RATE);
            const btw = bruto - netto;

            rows.push([
                'Factuur',
                order.orderNumber,
                order.paidAt ? new Date(order.paidAt).toLocaleDateString('nl-BE') : '',
                order.customerName,
                order.items.map((i: { productName: string; quantity: number }) => `${i.productName} (${i.quantity}x)`).join('; '),
                this.formatEuro(netto),
                this.formatEuro(btw),
                this.formatEuro(bruto),
                'Betaald',
            ]);
        }

        // Add refunds as negative amounts (creditnota's)
        for (const refund of refunds) {
            const bruto = Number(refund.amount);
            const netto = bruto / (1 + BTW_RATE);
            const btw = bruto - netto;

            rows.push([
                'Creditnota',
                `CN-${refund.order.orderNumber}`,
                refund.processedAt ? new Date(refund.processedAt).toLocaleDateString('nl-BE') : '',
                refund.order.customerName,
                `Terugbetaling: ${refund.reason || 'Geen reden opgegeven'}`,
                this.formatEuro(-netto),
                this.formatEuro(-btw),
                this.formatEuro(-bruto),
                'Terugbetaald',
            ]);
        }

        // Add summary row
        const totalNetto = rows.reduce((sum, r) => sum + this.parseEuro(r[5]), 0);
        const totalBTW = rows.reduce((sum, r) => sum + this.parseEuro(r[6]), 0);
        const totalBruto = rows.reduce((sum, r) => sum + this.parseEuro(r[7]), 0);

        rows.push(['', '', '', '', '', '', '', '', '']);
        rows.push([
            'TOTAAL',
            '',
            '',
            `Kwartaal ${quarter} - ${year}`,
            `${orders.length} facturen, ${refunds.length} creditnota's`,
            this.formatEuro(totalNetto),
            this.formatEuro(totalBTW),
            this.formatEuro(totalBruto),
            '',
        ]);

        return this.toCsv(headers, rows);
    }

    /**
     * Annual Summary - Year-end overview for tax declaration (tenant-scoped)
     */
    async exportAnnualSummary(tenantId: string, year: number): Promise<string> {
        const BTW_RATE = 0.21;
        const headers = ['Kwartaal', 'Aantal Facturen', 'Omzet Bruto (€)', 'Omzet Netto (€)', 'BTW (€)', 'Terugbetalingen (€)', 'Netto BTW (€)'];
        const rows: (string | number)[][] = [];

        let yearTotalOrders = 0;
        let yearTotalBruto = 0;
        let yearTotalNetto = 0;
        let yearTotalBTW = 0;
        let yearTotalRefunds = 0;

        for (let q = 1; q <= 4; q++) {
            const { startDate, endDate } = this.getQuarterDates(q, year);

            const orders = await this.prisma.order.findMany({
                where: {
                    tenantId,
                    paidAt: { gte: startDate, lte: endDate, not: null },
                },
            });

            const refunds = await this.prisma.refund.findMany({
                where: {
                    order: { tenantId },
                    status: 'SUCCEEDED',
                    processedAt: { gte: startDate, lte: endDate },
                },
            });

            const bruto = orders.reduce((sum, o) => sum + Number(o.total), 0);
            const netto = bruto / (1 + BTW_RATE);
            const btw = bruto - netto;
            const refundTotal = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
            const refundBTW = refundTotal - (refundTotal / (1 + BTW_RATE));
            const netBTW = btw - refundBTW;

            rows.push([
                `Q${q} ${year}`,
                orders.length,
                this.formatEuro(bruto),
                this.formatEuro(netto),
                this.formatEuro(btw),
                this.formatEuro(refundTotal),
                this.formatEuro(netBTW),
            ]);

            yearTotalOrders += orders.length;
            yearTotalBruto += bruto;
            yearTotalNetto += netto;
            yearTotalBTW += btw;
            yearTotalRefunds += refundTotal;
        }

        // Add year totals
        rows.push(['', '', '', '', '', '', '']);
        rows.push([
            `JAAR ${year}`,
            yearTotalOrders,
            this.formatEuro(yearTotalBruto),
            this.formatEuro(yearTotalNetto),
            this.formatEuro(yearTotalBTW),
            this.formatEuro(yearTotalRefunds),
            this.formatEuro(yearTotalBTW - (yearTotalRefunds - yearTotalRefunds / (1 + BTW_RATE))),
        ]);

        return this.toCsv(headers, rows);
    }

    /**
     * Format number as Euro string
     */
    private formatEuro(amount: number): string {
        return amount.toFixed(2).replace('.', ',');
    }

    /**
     * Parse Euro string back to number
     */
    private parseEuro(value: string | number): number {
        if (typeof value === 'number') return value;
        return parseFloat(value.replace(',', '.')) || 0;
    }

    /**
     * Convert data to CSV format
     */
    private toCsv(headers: string[], rows: (string | number)[][]): string {
        const escape = (cell: string | number) => {
            const str = String(cell);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const lines = [
            headers.map(escape).join(','),
            ...rows.map(row => row.map(escape).join(',')),
        ];

        return '\ufeff' + lines.join('\n'); // UTF-8 BOM for Excel
    }
}
