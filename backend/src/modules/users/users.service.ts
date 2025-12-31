import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, CreateAdminDto } from './dto';
import { UserRole } from '../../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: { search?: string; page?: number; limit?: number }) {
        const { search, page = 1, limit = 20 } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    isVip: true,
                    totalSpent: true,
                    avatar: true,
                    lastActiveAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        // Get emails to fetch order stats
        const emails = users.map(u => u.email);

        // Fetch order counts and totals by email (since orders use customerEmail, not userId)
        const orderStats = await this.prisma.order.groupBy({
            by: ['customerEmail'],
            where: {
                customerEmail: { in: emails },
                status: { notIn: ['CANCELLED', 'PENDING'] },
            },
            _count: { id: true },
            _sum: { total: true },
        });

        // Create a map for quick lookup
        const orderStatsMap = new Map(
            orderStats.map(stat => [stat.customerEmail, {
                count: stat._count.id,
                total: stat._sum.total || 0,
            }])
        );

        // Add online status and order stats
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const usersWithStatus = users.map((user) => {
            const stats = orderStatsMap.get(user.email) || { count: 0, total: 0 };
            return {
                ...user,
                isOnline: user.lastActiveAt ? user.lastActiveAt > fiveMinutesAgo : false,
                orderCount: stats.count,
                totalSpent: Number(stats.total),
            };
        });

        return {
            data: usersWithStatus,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
                isVip: true,
                adminNotes: true,
                totalSpent: true,
                avatar: true,
                lastActiveAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Get orders by customer email (not relation - orders may have null userId)
        const orders = await this.prisma.order.findMany({
            where: { customerEmail: user.email },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                total: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Get appointments by email
        const appointments = await this.prisma.appointment.findMany({
            where: { customerEmail: user.email },
            orderBy: { appointmentDate: 'desc' },
            take: 10,
        });

        // Get tickets by customer email
        const tickets = await this.prisma.ticket.findMany({
            where: { customerEmail: user.email },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                _count: {
                    select: { messages: true }
                }
            }
        });

        // Check online status
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isOnline = user.lastActiveAt ? user.lastActiveAt > fiveMinutesAgo : false;

        return {
            ...user,
            isOnline,
            orders,
            appointments,
            tickets,
        };
    }

    async createAdmin(dto: CreateAdminDto) {
        // Only allow creating ADMIN or STAFF roles
        if (dto.role !== UserRole.ADMIN && dto.role !== UserRole.STAFF) {
            throw new ForbiddenException('Can only create ADMIN or STAFF users');
        }

        // Use username as email for admin accounts
        const email = `${dto.username.toLowerCase()}@admin.smartphoneservice.be`;

        // Check if username/email exists (using findFirst since email uniqueness is per-tenant)
        const existing = await this.prisma.user.findFirst({ where: { email, tenantId: null } });
        if (existing) {
            throw new ConflictException('Username already exists');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.prisma.user.create({
            data: {
                email,
                name: dto.name,
                passwordHash,
                role: dto.role,
                emailVerified: new Date(), // Pre-verified for admins
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        return {
            ...user,
            username: dto.username,
            message: 'Admin user created successfully',
        };
    }

    async deleteUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.delete({ where: { id } });
        return { message: 'User deleted successfully' };
    }

    async update(id: string, dto: UpdateUserDto) {
        await this.findOne(id); // Check exists

        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
            },
        });
    }

    async adminResetPassword(id: string, newPassword: string) {
        await this.findOne(id); // Check exists

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });

        return { message: 'Password reset successfully' };
    }

    async updateLastActive(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { lastActiveAt: new Date() },
        });
    }

    async updateVipStatus(id: string, isVip: boolean) {
        await this.findOne(id); // Check exists

        return this.prisma.user.update({
            where: { id },
            data: { isVip },
            select: {
                id: true,
                email: true,
                name: true,
                isVip: true,
            },
        });
    }

    async updateNotes(id: string, adminNotes: string | null) {
        await this.findOne(id); // Check exists

        return this.prisma.user.update({
            where: { id },
            data: { adminNotes },
            select: {
                id: true,
                adminNotes: true,
            },
        });
    }

    async recalculateLifetimeValue(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { email: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Calculate total spent from all orders
        const result = await this.prisma.order.aggregate({
            where: {
                customerEmail: user.email,
                status: { notIn: ['CANCELLED', 'PENDING'] },
            },
            _sum: { total: true },
        });

        const totalSpent = result._sum.total || 0;

        return this.prisma.user.update({
            where: { id },
            data: { totalSpent },
            select: {
                id: true,
                totalSpent: true,
            },
        });
    }
}
