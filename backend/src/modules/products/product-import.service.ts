/**
 * Product Import/Export Service
 * 
 * Handles CSV import and export for products.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class ProductImportService {
    private readonly logger = new Logger(ProductImportService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Export all products to CSV format (tenant-scoped)
     */
    async exportToCsv(tenantId: string): Promise<string> {
        const products = await this.prisma.product.findMany({
            where: { tenantId },
            include: {
                category: { select: { name: true, slug: true } },
                images: { where: { isPrimary: true }, take: 1 },
            },
            orderBy: { name: 'asc' },
        });

        const headers = [
            'id', 'name', 'slug', 'sku', 'brand', 'price', 'compareAtPrice', 'costPrice',
            'stockQty', 'condition', 'productType', 'storage', 'color', 'batteryHealth',
            'deviceGrade', 'category', 'isActive', 'isFeatured', 'sortOrder', 'description',
            'imageUrl'
        ];

        const rows = products.map(p => [
            p.id,
            this.escapeCsv(p.name),
            p.slug,
            p.sku || '',
            p.brand || '',
            p.price.toString(),
            p.compareAtPrice?.toString() || '',
            p.costPrice?.toString() || '',
            p.stockQty.toString(),
            p.condition,
            p.productType,
            p.storage || '',
            p.color || '',
            p.batteryHealth?.toString() || '',
            p.deviceGrade || '',
            p.category?.slug || '',
            p.isActive ? 'true' : 'false',
            p.isFeatured ? 'true' : 'false',
            p.sortOrder.toString(),
            this.escapeCsv(p.description || ''),
            p.images[0]?.url || '',
        ]);

        const csvLines = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ];

        return csvLines.join('\n');
    }

    /**
     * Import products from CSV data (tenant-scoped)
     */
    async importFromCsv(tenantId: string, csvData: string): Promise<{ created: number; updated: number; errors: string[] }> {
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have headers and at least one row');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const results = { created: 0, updated: 0, errors: [] as string[] };

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCsvLine(lines[i]);
            const row: Record<string, string> = {};
            headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

            try {
                const productData = {
                    name: row.name,
                    slug: row.slug || this.generateSlug(row.name),
                    sku: row.sku || null,
                    brand: row.brand || null,
                    price: parseFloat(row.price) || 0,
                    compareAtPrice: row.compareAtPrice ? parseFloat(row.compareAtPrice) : null,
                    costPrice: row.costPrice ? parseFloat(row.costPrice) : null,
                    stockQty: parseInt(row.stockQty) || 0,
                    condition: (row.condition as 'NEW' | 'USED' | 'REFURBISHED') || 'REFURBISHED',
                    productType: (row.productType as 'PHONE' | 'PART' | 'ACCESSORY') || 'PHONE',
                    storage: row.storage || null,
                    color: row.color || null,
                    batteryHealth: row.batteryHealth ? parseInt(row.batteryHealth) : null,
                    deviceGrade: row.deviceGrade as 'A_PLUS' | 'A' | 'B' | 'C' | null || null,
                    isActive: row.isActive === 'true',
                    isFeatured: row.isFeatured === 'true',
                    sortOrder: parseInt(row.sortOrder) || 0,
                    description: row.description || null,
                };

                // Check if product exists by ID or slug (tenant-scoped)
                const existingById = row.id ? await this.prisma.product.findFirst({ where: { tenantId, id: row.id } }) : null;
                const existingBySlug = !existingById && productData.slug ?
                    await this.prisma.product.findFirst({ where: { tenantId, slug: productData.slug } }) : null;

                if (existingById) {
                    await this.prisma.product.update({
                        where: { id: row.id },
                        data: productData,
                    });
                    results.updated++;
                } else if (existingBySlug) {
                    await this.prisma.product.update({
                        where: { id: existingBySlug.id },
                        data: productData,
                    });
                    results.updated++;
                } else {
                    await this.prisma.product.create({ data: { tenantId, ...productData } });
                    results.created++;
                }
            } catch (error) {
                results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        this.logger.log(`CSV import complete: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`);
        return results;
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    private escapeCsv(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    private parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
}
