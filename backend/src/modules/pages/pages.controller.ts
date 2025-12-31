import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { TenantId } from '../tenant/tenant.decorator';

/**
 * Public CMS endpoints for tenant frontend
 * These are called by the frontend to load page content
 */
@ApiTags('Pages (Public)')
@Controller('tenant')
export class PagesController {
    constructor(private readonly pagesService: PagesService) { }

    @Get('homepage')
    @ApiOperation({ summary: 'Get homepage content for current tenant' })
    async getHomepage(@TenantId() tenantId: string) {
        const homepage = await this.pagesService.getHomepage(tenantId);

        if (!homepage) {
            // Return default values for tenants without homepage configured
            return {
                heroTitle: 'Problemen met uw toestel?',
                heroSubtitle: 'Wij helpen u graag.',
                heroDescription: 'Wij repareren jouw smartphone snel en professioneel.',
                heroCta1Text: 'Bekijk Toestellen',
                heroCta1Link: '/phones',
                heroCta2Text: 'Maak Afspraak',
                heroCta2Link: '/repair/book',
                trustBadge1: 'Gratis verzending',
                trustBadge2: '1 jaar garantie',
                trustBadge3: 'Veilig betalen',
                conversionTitle: 'Vandaag kapot. Vandaag opgelost.',
                conversionFeature1: 'Binnen 60 minuten klaar',
                conversionFeature2: 'Originele onderdelen',
                conversionFeature3: 'Lokale service',
                showConversionStrip: true,
                showServices: true,
            };
        }

        return homepage;
    }

    @Get('pages/:slug')
    @ApiOperation({ summary: 'Get page content by slug' })
    async getPage(
        @TenantId() tenantId: string,
        @Param('slug') slug: string
    ) {
        const page = await this.pagesService.getPageBySlug(tenantId, slug);

        if (!page) {
            throw new NotFoundException(`Page "${slug}" not found`);
        }

        return page;
    }

    @Get('pages')
    @ApiOperation({ summary: 'Get navigation pages' })
    async getNavPages(@TenantId() tenantId: string) {
        return this.pagesService.getNavPages(tenantId);
    }
}
