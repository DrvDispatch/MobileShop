import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.category.findMany({
            where: { tenantId, isActive: true },
            include: {
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async findBySlug(tenantId: string, slug: string) {
        const category = await this.prisma.category.findFirst({
            where: { tenantId, slug },
            include: {
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
                parent: true,
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async findById(tenantId: string, id: string) {
        const category = await this.prisma.category.findFirst({
            where: { tenantId, id },
            include: {
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
                parent: true,
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async create(tenantId: string, data: { name: string; slug?: string; description?: string; parentId?: string }) {
        const slug = data.slug || this.generateSlug(data.name);

        return this.prisma.category.create({
            data: {
                tenantId,
                ...data,
                slug,
            },
        });
    }

    async update(tenantId: string, id: string, data: { name?: string; slug?: string; description?: string; isActive?: boolean }) {
        await this.findById(tenantId, id);

        return this.prisma.category.update({
            where: { id },
            data,
        });
    }

    async delete(tenantId: string, id: string) {
        await this.findById(tenantId, id);

        return this.prisma.category.delete({
            where: { id },
        });
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
}
