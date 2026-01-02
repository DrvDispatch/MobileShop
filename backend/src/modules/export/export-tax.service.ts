/**
 * Export Tax Service
 * 
 * Belgian tax reporting exports: BTW (VAT), Accountant Reports, Annual Summaries.
 * For boekhoudkundige exports and tax declarations.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportTaxService {
    private readonly logger = new Logger(ExportTaxService.name);
    private readonly BTW_RATE = 0.21;

    constructor(private prisma: PrismaService) { }

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
        const totalNetto = totalBruto / (1 + this.BTW_RATE);
        const totalBTW = totalBruto - totalNetto;

        const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
        const refundNetto = totalRefunds / (1 + this.BTW_RATE);
        const refundBTW = totalRefunds - refundNetto;

        const netBruto = totalBruto - totalRefunds;
        const netNetto = totalNetto - refundNetto;
        const netBTW = totalBTW - refundBTW;

        const headers = ['Omschrijving', 'Bedrag (€)'];
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
            ["CREDITNOTA'S / TERUGBETALINGEN", ''],
            ['Totaal Terugbetalingen (incl. BTW)', this.formatEuro(totalRefunds)],
            ['Terugbetalingen Netto', this.formatEuro(refundNetto)],
            ['Terug te vorderen BTW', this.formatEuro(refundBTW)],
            ["Aantal creditnota's", refunds.length],
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

        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                paidAt: { gte: startDate, lte: endDate, not: null },
            },
            include: { items: true },
            orderBy: { paidAt: 'asc' },
        });

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
            const netto = bruto / (1 + this.BTW_RATE);
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

        // Add refunds as negative amounts
        for (const refund of refunds) {
            const bruto = Number(refund.amount);
            const netto = bruto / (1 + this.BTW_RATE);
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
            'TOTAAL', '', '',
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
                where: { tenantId, paidAt: { gte: startDate, lte: endDate, not: null } },
            });

            const refunds = await this.prisma.refund.findMany({
                where: { order: { tenantId }, status: 'SUCCEEDED', processedAt: { gte: startDate, lte: endDate } },
            });

            const bruto = orders.reduce((sum, o) => sum + Number(o.total), 0);
            const netto = bruto / (1 + this.BTW_RATE);
            const btw = bruto - netto;
            const refundTotal = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
            const refundBTW = refundTotal - (refundTotal / (1 + this.BTW_RATE));
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

        rows.push(['', '', '', '', '', '', '']);
        rows.push([
            `JAAR ${year}`,
            yearTotalOrders,
            this.formatEuro(yearTotalBruto),
            this.formatEuro(yearTotalNetto),
            this.formatEuro(yearTotalBTW),
            this.formatEuro(yearTotalRefunds),
            this.formatEuro(yearTotalBTW - (yearTotalRefunds - yearTotalRefunds / (1 + this.BTW_RATE))),
        ]);

        return this.toCsv(headers, rows);
    }

    private formatEuro(amount: number): string {
        return amount.toFixed(2).replace('.', ',');
    }

    private parseEuro(value: string | number): number {
        if (typeof value === 'number') return value;
        return parseFloat(value.replace(',', '.')) || 0;
    }

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
