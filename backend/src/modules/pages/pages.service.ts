import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CmsStatus } from '../../generated/prisma/client.js';

// Default TipTap content structure for new pages
const createEmptyTipTapContent = () => ({
    type: 'doc',
    content: [
        {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Start editing this page...' }]
        }
    ]
});

// System page slugs that cannot be deleted
const SYSTEM_PAGE_SLUGS = ['about', 'terms', 'privacy', 'returns'];

@Injectable()
export class PagesService {
    private readonly logger = new Logger(PagesService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ===== HOMEPAGE =====

    /**
     * Get homepage for a tenant (public - only published)
     */
    async getHomepage(tenantId: string) {
        const homepage = await this.prisma.tenantHomepage.findUnique({
            where: { tenantId },
        });

        if (!homepage || homepage.status !== CmsStatus.PUBLISHED) {
            return null;
        }

        return homepage;
    }

    /**
     * Get homepage for owner (includes drafts)
     * Uses upsert to avoid race conditions when creating default homepage
     */
    async getHomepageForOwner(tenantId: string) {
        // Use upsert to safely get or create homepage
        return this.prisma.tenantHomepage.upsert({
            where: { tenantId },
            update: {}, // Don't update anything if exists
            create: { tenantId }, // Create with defaults if not exists
        });
    }

    /**
     * Update homepage
     */
    async updateHomepage(tenantId: string, data: Partial<{
        heroTitle: string;
        heroSubtitle: string;
        heroDescription: string;
        heroImageUrl: string;
        heroCta1Text: string;
        heroCta1Link: string;
        heroCta2Text: string;
        heroCta2Link: string;
        trustBadge1: string;
        trustBadge2: string;
        trustBadge3: string;
        conversionTitle: string;
        conversionFeature1: string;
        conversionFeature2: string;
        conversionFeature3: string;
        showConversionStrip: boolean;
        showServices: boolean;
        status: CmsStatus;
    }>) {
        return this.prisma.tenantHomepage.upsert({
            where: { tenantId },
            update: data,
            create: {
                tenantId,
                ...data,
            },
        });
    }

    // ===== PAGES =====

    /**
     * Get a page by slug (public - only published)
     */
    async getPageBySlug(tenantId: string, slug: string) {
        const page = await this.prisma.tenantPage.findUnique({
            where: {
                tenantId_slug: { tenantId, slug },
            },
        });

        if (!page || page.status !== CmsStatus.PUBLISHED) {
            return null;
        }

        return page;
    }

    /**
     * Get a page by slug for owner (includes drafts)
     */
    async getPageBySlugForOwner(tenantId: string, slug: string) {
        return this.prisma.tenantPage.findUnique({
            where: {
                tenantId_slug: { tenantId, slug },
            },
        });
    }

    /**
     * Get a page by ID for owner (includes drafts)
     */
    async getPageById(tenantId: string, pageId: string) {
        return this.prisma.tenantPage.findFirst({
            where: {
                id: pageId,
                tenantId,
            },
        });
    }

    /**
     * List all pages for a tenant (owner view)
     */
    async listPagesForOwner(tenantId: string) {
        return this.prisma.tenantPage.findMany({
            where: { tenantId },
            orderBy: [
                { isSystemPage: 'desc' },
                { navOrder: 'asc' },
                { title: 'asc' },
            ],
            select: {
                id: true,
                slug: true,
                title: true,
                status: true,
                isSystemPage: true,
                showInNav: true,
                navOrder: true,
                publishedAt: true,
                updatedAt: true,
            },
        });
    }

    /**
     * List navigation pages (public - only published, showInNav)
     */
    async getNavPages(tenantId: string) {
        return this.prisma.tenantPage.findMany({
            where: {
                tenantId,
                status: CmsStatus.PUBLISHED,
                showInNav: true,
            },
            orderBy: { navOrder: 'asc' },
            select: {
                slug: true,
                title: true,
            },
        });
    }

    /**
     * Create a new page
     */
    async createPage(tenantId: string, data: {
        slug: string;
        title: string;
        content?: object;
        seoTitle?: string;
        seoDescription?: string;
        showInNav?: boolean;
        navOrder?: number;
    }) {
        // Validate slug format
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(data.slug)) {
            throw new BadRequestException('Slug must contain only lowercase letters, numbers, and hyphens');
        }

        // Check if slug already exists
        const existing = await this.prisma.tenantPage.findUnique({
            where: { tenantId_slug: { tenantId, slug: data.slug } },
        });

        if (existing) {
            throw new ConflictException(`Page with slug "${data.slug}" already exists`);
        }

        return this.prisma.tenantPage.create({
            data: {
                tenantId,
                slug: data.slug,
                title: data.title,
                content: data.content || createEmptyTipTapContent(),
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                showInNav: data.showInNav ?? false,
                navOrder: data.navOrder ?? 0,
                isSystemPage: SYSTEM_PAGE_SLUGS.includes(data.slug),
                status: CmsStatus.DRAFT,
            },
        });
    }

    /**
     * Update a page
     */
    async updatePage(tenantId: string, pageId: string, data: Partial<{
        title: string;
        content: object;
        seoTitle: string;
        seoDescription: string;
        showInNav: boolean;
        navOrder: number;
    }>) {
        const page = await this.prisma.tenantPage.findFirst({
            where: { id: pageId, tenantId },
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        return this.prisma.tenantPage.update({
            where: { id: pageId },
            data,
        });
    }

    /**
     * Publish a page
     */
    async publishPage(tenantId: string, pageId: string) {
        const page = await this.prisma.tenantPage.findFirst({
            where: { id: pageId, tenantId },
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        return this.prisma.tenantPage.update({
            where: { id: pageId },
            data: {
                status: CmsStatus.PUBLISHED,
                publishedAt: new Date(),
            },
        });
    }

    /**
     * Unpublish a page (set to draft)
     */
    async unpublishPage(tenantId: string, pageId: string) {
        const page = await this.prisma.tenantPage.findFirst({
            where: { id: pageId, tenantId },
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        return this.prisma.tenantPage.update({
            where: { id: pageId },
            data: {
                status: CmsStatus.DRAFT,
            },
        });
    }

    /**
     * Delete a page
     */
    async deletePage(tenantId: string, pageId: string) {
        const page = await this.prisma.tenantPage.findFirst({
            where: { id: pageId, tenantId },
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        if (page.isSystemPage) {
            throw new BadRequestException('Cannot delete system pages (terms, privacy, about, returns)');
        }

        await this.prisma.tenantPage.delete({
            where: { id: pageId },
        });

        return { success: true };
    }

    /**
     * Seed default pages for a new tenant
     */
    async seedDefaultPages(tenantId: string) {
        this.logger.log(`Seeding default pages for tenant ${tenantId}`);

        // Create homepage if missing
        await this.prisma.tenantHomepage.upsert({
            where: { tenantId },
            update: {},
            create: { tenantId },
        });

        // Default system pages
        const defaultPages = [
            { slug: 'about', title: 'Over Ons' },
            { slug: 'terms', title: 'Algemene Voorwaarden' },
            { slug: 'privacy', title: 'Privacybeleid' },
            { slug: 'returns', title: 'Retourbeleid' },
        ];

        for (const page of defaultPages) {
            await this.prisma.tenantPage.upsert({
                where: { tenantId_slug: { tenantId, slug: page.slug } },
                update: {},
                create: {
                    tenantId,
                    slug: page.slug,
                    title: page.title,
                    content: createEmptyTipTapContent(),
                    isSystemPage: true,
                    status: CmsStatus.PUBLISHED,
                    publishedAt: new Date(),
                },
            });
        }

        this.logger.log(`Seeded default pages for tenant ${tenantId}`);
    }
}
