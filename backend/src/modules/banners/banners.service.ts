import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto, ActiveBannerDto } from './dto';
import { BannerPosition } from '../../generated/prisma/client.js';

@Injectable()
export class BannersService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateBannerDto) {
        return this.prisma.promotionalBanner.create({
            data: {
                title: dto.title,
                message: dto.message,
                linkUrl: dto.linkUrl,
                linkText: dto.linkText,
                bgColor: dto.bgColor || '#7c3aed',
                textColor: dto.textColor || '#ffffff',
                position: dto.position || BannerPosition.TICKER,
                priority: dto.priority || 0,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async findAll() {
        return this.prisma.promotionalBanner.findMany({
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });
    }

    async findOne(id: string) {
        const banner = await this.prisma.promotionalBanner.findUnique({
            where: { id },
        });

        if (!banner) {
            throw new NotFoundException('Banner not found');
        }

        return banner;
    }

    async update(id: string, dto: UpdateBannerDto) {
        await this.findOne(id); // Ensure exists

        return this.prisma.promotionalBanner.update({
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
        return this.prisma.promotionalBanner.delete({ where: { id } });
    }

    async getActiveBanners(position?: BannerPosition): Promise<ActiveBannerDto[]> {
        const now = new Date();

        const banners = await this.prisma.promotionalBanner.findMany({
            where: {
                isActive: true,
                ...(position ? { position } : {}),
                OR: [
                    { startsAt: null },
                    { startsAt: { lte: now } },
                ],
                AND: [
                    {
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: now } },
                        ],
                    },
                ],
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });

        return banners.map(banner => ({
            id: banner.id,
            message: banner.message,
            linkUrl: banner.linkUrl || undefined,
            linkText: banner.linkText || undefined,
            bgColor: banner.bgColor,
            textColor: banner.textColor,
            position: banner.position,
        }));
    }
}
