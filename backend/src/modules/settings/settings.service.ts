import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client.js';
import {
    CreateSettingDto,
    UpdateSettingDto,
    CreateShippingZoneDto,
    UpdateShippingZoneDto,
    PublicSettingsDto,
    StoreInfoDto,
    CheckoutConfigDto,
    ShippingZoneDto,
} from './dto';

// Default settings - checkout config only (tenant-neutral)
// Store info must come from TenantConfig
const DEFAULT_SETTINGS = {
    'checkout.defaultCountry': 'BE',
    'checkout.currency': 'EUR',
    'checkout.currencySymbol': '€',
    'checkout.taxIncluded': true,
    'checkout.taxRate': 0.21,
    'checkout.taxLabel': '21% VAT',
};

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    // ============================================
    // SETTINGS CRUD
    // ============================================

    async getAllSettings(tenantId: string) {
        return this.prisma.setting.findMany({
            where: { tenantId },
        });
    }

    async getSetting(tenantId: string, key: string) {
        const setting = await this.prisma.setting.findFirst({
            where: { tenantId, key },
        });

        if (!setting) {
            throw new NotFoundException(`Setting ${key} not found`);
        }

        return setting;
    }

    // Helper to get typed setting value with default
    async getSettingValue<T>(tenantId: string, key: string, defaultValue?: T): Promise<T> {
        const setting = await this.prisma.setting.findFirst({
            where: { tenantId, key },
        });

        if (setting && setting.value !== null) {
            return setting.value as T;
        }

        if (defaultValue !== undefined) {
            return defaultValue;
        }

        // Final fallback to memory defaults
        if (key in DEFAULT_SETTINGS) {
            return DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] as T;
        }

        return undefined as T;
    }

    async upsertSetting(tenantId: string, key: string, dto: UpdateSettingDto) {
        const jsonValue = dto.value as Prisma.InputJsonValue;
        return this.prisma.setting.upsert({
            where: {
                tenantId_key: { tenantId, key },
            },
            update: { value: jsonValue },
            create: {
                tenantId,
                key,
                value: jsonValue,
            },
        });
    }

    async createSetting(tenantId: string, dto: CreateSettingDto) {
        const jsonValue = dto.value as Prisma.InputJsonValue;
        return this.prisma.setting.create({
            data: {
                tenantId,
                key: dto.key,
                value: jsonValue,
            },
        });
    }

    async deleteSetting(tenantId: string, key: string) {
        const setting = await this.prisma.setting.findFirst({
            where: { tenantId, key },
        });

        if (!setting) {
            throw new NotFoundException(`Setting ${key} not found`);
        }

        return this.prisma.setting.delete({
            where: { id: setting.id },
        });
    }

    // ============================================
    // SHIPPING ZONES
    // ============================================

    async getAllShippingZones(tenantId: string, includeInactive = false) {
        return this.prisma.shippingZone.findMany({
            where: {
                tenantId,
                ...(includeInactive ? {} : { isActive: true }),
            },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async getShippingZone(tenantId: string, id: string) {
        const zone = await this.prisma.shippingZone.findFirst({
            where: { tenantId, id },
        });

        if (!zone) {
            throw new NotFoundException('Shipping zone not found');
        }

        return zone;
    }

    async getShippingZoneForCountry(tenantId: string, countryCode: string): Promise<ShippingZoneDto | null> {
        // Find all active zones for tenant
        const zones = await this.prisma.shippingZone.findMany({
            where: { tenantId, isActive: true },
            orderBy: { sortOrder: 'asc' },
        });

        // Check if country matches exact list or wildcard
        for (const zone of zones) {
            // Check implicit any logic or specific list
            // For now assuming 'countries' is array of codes
            // Using logic from original implementation if it existed?
            // Actually original didn't show the logic, but assuming array check
            const countries = zone.countries as string[];
            if (countries.includes(countryCode) || countries.includes('*')) {
                return this.mapShippingZone(zone);
            }
        }

        return null;
    }

    async createShippingZone(tenantId: string, dto: CreateShippingZoneDto) {
        return this.prisma.shippingZone.create({
            data: {
                tenantId,
                ...dto,
            },
        });
    }

    async updateShippingZone(tenantId: string, id: string, dto: UpdateShippingZoneDto) {
        await this.getShippingZone(tenantId, id);

        return this.prisma.shippingZone.update({
            where: { id },
            data: dto,
        });
    }

    async deleteShippingZone(tenantId: string, id: string) {
        await this.getShippingZone(tenantId, id);

        return this.prisma.shippingZone.delete({
            where: { id },
        });
    }

    // ============================================
    // PUBLIC CONFIG (Merged Sources)
    // ============================================

    async getPublicSettings(tenantId: string): Promise<PublicSettingsDto> {
        // 1. Fetch Tenant Config (Branding Source of Truth)
        const tenantConfig = await this.prisma.tenantConfig.findUnique({
            where: { tenantId }
        });

        // 2. Fetch generic settings
        const settings = await this.getAllSettings(tenantId);
        const settingsMap = new Map(settings.map((s: { key: string; value: unknown }) => [s.key, s.value]));

        const getValue = <T>(key: string): T => {
            if (settingsMap.has(key)) {
                return settingsMap.get(key) as T;
            }
            if (key in DEFAULT_SETTINGS) {
                return DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] as T;
            }
            return undefined as T;
        };

        const store: StoreInfoDto = {
            name: tenantConfig?.shopName || getValue<string>('store.name'),
            phone: tenantConfig?.phone || getValue<string>('store.phone'),
            email: tenantConfig?.email || getValue<string>('store.email'),
            address: getValue<StoreInfoDto['address']>('store.address'),
            vatNumber: getValue<string>('store.vatNumber'), // Maybe add to TenantConfig later
        };

        const checkout: CheckoutConfigDto = {
            defaultCountry: getValue<string>('checkout.defaultCountry'),
            currency: tenantConfig?.currency || getValue<string>('checkout.currency'),
            currencySymbol: getValue<string>('checkout.currencySymbol'), // Could derive from currency
            taxIncluded: getValue<boolean>('checkout.taxIncluded'),
            taxRate: getValue<number>('checkout.taxRate'),
            taxLabel: getValue<string>('checkout.taxLabel'),
        };

        const zones = await this.getAllShippingZones(tenantId);
        const shippingZones: ShippingZoneDto[] = zones.map(this.mapShippingZone);

        return { store, checkout, shippingZones };
    }

    private mapShippingZone(zone: {
        id: string;
        name: string;
        countries: string[];
        rate: unknown; // decimals
        freeAbove: unknown; // decimals
        minDays: number;
        maxDays: number;
        carrier: string | null;
        isActive: boolean;
        sortOrder: number;
    }): ShippingZoneDto {
        return {
            id: zone.id,
            name: zone.name,
            countries: zone.countries,
            rate: Number(zone.rate),
            freeAbove: zone.freeAbove ? Number(zone.freeAbove) : undefined,
            minDays: zone.minDays,
            maxDays: zone.maxDays,
            carrier: zone.carrier || undefined,
            isActive: zone.isActive,
            sortOrder: zone.sortOrder,
        };
    }
}
