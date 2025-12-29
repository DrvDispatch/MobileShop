import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { resolveImageUrl } from '../../utils/image-url';

@Injectable()
export class AnalyticsService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    /**
     * Get daily revenue for the last N days
     */
    async getRevenueData(days: number = 30) {
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - days + 1); // +1 to include today
        startDate.setHours(0, 0, 0, 0);

        const orders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                status: { notIn: ['CANCELLED', 'PENDING'] },
            },
            select: {
                createdAt: true,
                total: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        // Group by day - use local date format consistently
        const revenueByDay = new Map<string, number>();

        // Initialize all days with 0
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            // Use local date format (YYYY-MM-DD in local timezone)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            revenueByDay.set(dateKey, 0);
        }

        // Sum revenue by day
        orders.forEach(order => {
            // Convert order date to local timezone format
            const orderDate = new Date(order.createdAt);
            const year = orderDate.getFullYear();
            const month = String(orderDate.getMonth() + 1).padStart(2, '0');
            const day = String(orderDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;

            const current = revenueByDay.get(dateKey) || 0;
            revenueByDay.set(dateKey, current + Number(order.total));
        });

        // Convert to array
        const data = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
            date,
            revenue: Math.round(revenue * 100) / 100,
        }));

        // Calculate totals
        const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
        const avgDaily = totalRevenue / days;

        return {
            data,
            summary: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                averageDaily: Math.round(avgDaily * 100) / 100,
                totalOrders: orders.length,
            },
        };
    }

    /**
     * Get sales trends comparing current vs previous period
     */
    async getTrends() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Current week
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        // Previous week
        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(weekStart.getDate() - 7);
        const prevWeekEnd = new Date(weekStart);

        // Current month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        // Previous month
        const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthEnd = monthStart;

        // Get orders for all periods
        const [currentWeek, prevWeek, currentMonth, prevMonth] = await Promise.all([
            this.getOrdersSum(weekStart, now),
            this.getOrdersSum(prevWeekStart, prevWeekEnd),
            this.getOrdersSum(monthStart, now),
            this.getOrdersSum(prevMonthStart, prevMonthEnd),
        ]);

        return {
            weekly: {
                current: currentWeek,
                previous: prevWeek,
                change: this.calculateChange(currentWeek.revenue, prevWeek.revenue),
            },
            monthly: {
                current: currentMonth,
                previous: prevMonth,
                change: this.calculateChange(currentMonth.revenue, prevMonth.revenue),
            },
        };
    }

    private async getOrdersSum(start: Date, end: Date) {
        const orders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: start, lt: end },
                status: { notIn: ['CANCELLED', 'PENDING'] },
            },
            select: { total: true },
        });

        const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
        return {
            revenue: Math.round(revenue * 100) / 100,
            orders: orders.length,
        };
    }

    private calculateChange(current: number, previous: number) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    /**
     * Get bestselling products
     */
    async getBestsellers(limit: number = 10) {
        // Get order items grouped by product
        const orderItems = await this.prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: limit,
        });

        // Fetch product details
        const productIds = orderItems.map(item => item.productId).filter((id): id is string => id !== null);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                name: true,
                price: true,
                images: { take: 1, select: { url: true } },
            },
        });

        const productMap = new Map(products.map(p => [p.id, p]));

        return orderItems.map(item => {
            const product = item.productId ? productMap.get(item.productId) : undefined;
            return {
                productId: item.productId || '',
                name: product?.name || 'Unknown',
                price: product?.price ? Number(product.price) : 0,
                image: resolveImageUrl(product?.images?.[0]?.url),
                totalSold: item._sum.quantity || 0,
                orderCount: item._count.id,
                revenue: (product?.price ? Number(product.price) : 0) * (item._sum.quantity || 0),
            };
        });
    }

    /**
     * Export analytics data as CSV
     */
    async exportReport(type: 'revenue' | 'orders' | 'products', days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        if (type === 'revenue') {
            const data = await this.getRevenueData(days);
            return this.toCsv(data.data, ['date', 'revenue']);
        }

        if (type === 'orders') {
            const orders = await this.prisma.order.findMany({
                where: { createdAt: { gte: startDate } },
                select: {
                    orderNumber: true,
                    customerName: true,
                    customerEmail: true,
                    total: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            return this.toCsv(orders.map(o => ({
                orderNumber: o.orderNumber,
                customer: o.customerName,
                email: o.customerEmail,
                total: Number(o.total),
                status: o.status,
                date: o.createdAt.toISOString().split('T')[0],
            })), ['orderNumber', 'customer', 'email', 'total', 'status', 'date']);
        }

        if (type === 'products') {
            const bestsellers = await this.getBestsellers(100);
            return this.toCsv(bestsellers.map(p => ({
                name: p.name,
                price: p.price,
                totalSold: p.totalSold,
                revenue: p.revenue,
            })), ['name', 'price', 'totalSold', 'revenue']);
        }

        return '';
    }

    private toCsv(data: Record<string, unknown>[], headers: string[]): string {
        const rows = [headers.join(',')];
        data.forEach(row => {
            const values = headers.map(h => {
                const val = row[h];
                if (typeof val === 'string' && val.includes(',')) {
                    return `"${val}"`;
                }
                return String(val ?? '');
            });
            rows.push(values.join(','));
        });
        return rows.join('\n');
    }
}
