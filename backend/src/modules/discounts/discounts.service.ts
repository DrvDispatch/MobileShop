import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDiscountDto, UpdateDiscountDto, ValidateDiscountDto, DiscountValidationResult, DiscountType } from './dto';

@Injectable()
export class DiscountsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateDiscountDto) {
        // Normalize code to uppercase
        const code = dto.code.toUpperCase().trim();

        // Check for duplicate
        const existing = await this.prisma.discountCode.findUnique({ where: { code } });
        if (existing) {
            throw new BadRequestException(`Discount code "${code}" already exists`);
        }

        return this.prisma.discountCode.create({
            data: {
                code,
                description: dto.description,
                type: dto.type,
                value: dto.value,
                minOrderAmount: dto.minOrderAmount,
                maxDiscount: dto.maxDiscount,
                usageLimit: dto.usageLimit,
                perUserLimit: dto.perUserLimit,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                isActive: dto.isActive ?? true,
                appliesToAll: dto.appliesToAll ?? true,
                productIds: dto.productIds || [],
                categoryIds: dto.categoryIds || [],
            },
        });
    }

    async findAll() {
        return this.prisma.discountCode.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const discount = await this.prisma.discountCode.findUnique({
            where: { id },
            include: {
                orders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        orderNumber: true,
                        customerEmail: true,
                        discountAmount: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: { orders: true },
                },
            },
        });

        if (!discount) {
            throw new NotFoundException(`Discount code not found`);
        }

        return discount;
    }

    async update(id: string, dto: UpdateDiscountDto) {
        await this.findOne(id); // Ensure exists

        if (dto.code) {
            dto.code = dto.code.toUpperCase().trim();
            const existing = await this.prisma.discountCode.findFirst({
                where: { code: dto.code, id: { not: id } },
            });
            if (existing) {
                throw new BadRequestException(`Discount code "${dto.code}" already exists`);
            }
        }

        return this.prisma.discountCode.update({
            where: { id },
            data: {
                ...dto,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Ensure exists
        return this.prisma.discountCode.delete({ where: { id } });
    }

    async validate(dto: ValidateDiscountDto): Promise<DiscountValidationResult> {
        const code = dto.code.toUpperCase().trim();

        const discount = await this.prisma.discountCode.findUnique({
            where: { code },
        });

        if (!discount) {
            return { valid: false, message: 'Kortingscode niet gevonden' };
        }

        if (!discount.isActive) {
            return { valid: false, message: 'Deze kortingscode is niet actief' };
        }

        const now = new Date();
        if (discount.startsAt && now < discount.startsAt) {
            return { valid: false, message: 'Deze kortingscode is nog niet geldig' };
        }

        if (discount.expiresAt && now > discount.expiresAt) {
            return { valid: false, message: 'Deze kortingscode is verlopen' };
        }

        if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
            return { valid: false, message: 'Deze kortingscode is niet meer beschikbaar' };
        }

        if (discount.minOrderAmount && dto.subtotal < Number(discount.minOrderAmount)) {
            return {
                valid: false,
                message: `Minimale bestelling van €${Number(discount.minOrderAmount).toFixed(2)} vereist`
            };
        }

        // Check per-user limit
        if (discount.perUserLimit && dto.customerEmail) {
            const userUsageCount = await this.prisma.order.count({
                where: {
                    discountCodeId: discount.id,
                    customerEmail: dto.customerEmail,
                },
            });
            if (userUsageCount >= discount.perUserLimit) {
                return { valid: false, message: 'Je hebt deze code al gebruikt' };
            }
        }

        // Check product applicability
        if (!discount.appliesToAll && discount.productIds.length > 0 && dto.productIds) {
            const hasApplicableProduct = dto.productIds.some(pid => discount.productIds.includes(pid));
            if (!hasApplicableProduct) {
                return { valid: false, message: 'Deze code is niet geldig voor de producten in je winkelwagen' };
            }
        }

        // Calculate discount amount
        let discountAmount: number;
        if (discount.type === DiscountType.PERCENTAGE) {
            discountAmount = dto.subtotal * (Number(discount.value) / 100);
            if (discount.maxDiscount && discountAmount > Number(discount.maxDiscount)) {
                discountAmount = Number(discount.maxDiscount);
            }
        } else {
            discountAmount = Number(discount.value);
            if (discountAmount > dto.subtotal) {
                discountAmount = dto.subtotal;
            }
        }

        return {
            valid: true,
            discountId: discount.id,
            code: discount.code,
            type: discount.type as DiscountType,
            discountAmount: Math.round(discountAmount * 100) / 100,
            message: discount.type === DiscountType.PERCENTAGE
                ? `${Number(discount.value)}% korting toegepast!`
                : `€${Number(discount.value).toFixed(2)} korting toegepast!`,
        };
    }

    async incrementUsage(discountId: string) {
        return this.prisma.discountCode.update({
            where: { id: discountId },
            data: { usageCount: { increment: 1 } },
        });
    }
}
