import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.category.findMany({
            where: { isActive: true },
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

    async findBySlug(slug: string) {
        const category = await this.prisma.category.findUnique({
            where: { slug },
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

    async findById(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
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

    async create(data: { name: string; slug?: string; description?: string; parentId?: string }) {
        const slug = data.slug || this.generateSlug(data.name);

        return this.prisma.category.create({
            data: {
                ...data,
                slug,
            },
        });
    }

    async update(id: string, data: { name?: string; slug?: string; description?: string; isActive?: boolean }) {
        await this.findById(id);

        return this.prisma.category.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        await this.findById(id);

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
