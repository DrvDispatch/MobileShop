import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
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

// Default settings if not in database
const DEFAULT_SETTINGS = {
    'store.name': 'Smartphone Service',
    'store.phone': '+32 3 123 45 67',
    'store.email': 'info@smartphoneservice.be',
    'store.address': {
        line1: 'Korte Koepoortstraat 7',
        city: 'Antwerpen',
        postalCode: '2000',
        country: 'BE',
    },
    'store.vatNumber': 'BE 1015.249.213',
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

    async getAllSettings() {
        return this.prisma.setting.findMany({
            orderBy: { key: 'asc' },
        });
    }

    async getSetting(key: string) {
        const setting = await this.prisma.setting.findUnique({ where: { key } });
        if (!setting) {
            // Return default if exists
            if (key in DEFAULT_SETTINGS) {
                return { key, value: DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] };
            }
            throw new NotFoundException(`Setting "${key}" not found`);
        }
        return setting;
    }

    async getSettingValue<T>(key: string, defaultValue?: T): Promise<T> {
        const setting = await this.prisma.setting.findUnique({ where: { key } });
        if (setting) {
            return setting.value as T;
        }
        if (key in DEFAULT_SETTINGS) {
            return DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] as T;
        }
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new NotFoundException(`Setting "${key}" not found`);
    }

    async upsertSetting(key: string, dto: UpdateSettingDto) {
        return this.prisma.setting.upsert({
            where: { key },
            update: { value: dto.value as unknown as Prisma.InputJsonValue },
            create: { key, value: dto.value as unknown as Prisma.InputJsonValue },
        });
    }

    async createSetting(dto: CreateSettingDto) {
        return this.prisma.setting.create({
            data: { key: dto.key, value: dto.value as unknown as Prisma.InputJsonValue },
        });
    }

    async deleteSetting(key: string) {
        return this.prisma.setting.delete({ where: { key } });
    }

    // ============================================
    // SHIPPING ZONES CRUD
    // ============================================

    async getAllShippingZones(includeInactive = false) {
        return this.prisma.shippingZone.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async getShippingZone(id: string) {
        const zone = await this.prisma.shippingZone.findUnique({ where: { id } });
        if (!zone) {
            throw new NotFoundException(`Shipping zone not found`);
        }
        return zone;
    }

    async getShippingZoneForCountry(countryCode: string): Promise<ShippingZoneDto | null> {
        const zone = await this.prisma.shippingZone.findFirst({
            where: {
                isActive: true,
                countries: { has: countryCode.toUpperCase() },
            },
            orderBy: { sortOrder: 'asc' },
        });
        if (!zone) return null;
        return this.mapShippingZone(zone);
    }

    async createShippingZone(dto: CreateShippingZoneDto) {
        return this.prisma.shippingZone.create({
            data: {
                name: dto.name,
                countries: dto.countries.map((c) => c.toUpperCase()),
                rate: dto.rate,
                freeAbove: dto.freeAbove,
                minDays: dto.minDays ?? 2,
                maxDays: dto.maxDays ?? 5,
                carrier: dto.carrier,
                isActive: dto.isActive ?? true,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }

    async updateShippingZone(id: string, dto: UpdateShippingZoneDto) {
        await this.getShippingZone(id); // Ensure exists
        return this.prisma.shippingZone.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.countries && { countries: dto.countries.map((c) => c.toUpperCase()) }),
                ...(dto.rate !== undefined && { rate: dto.rate }),
                ...(dto.freeAbove !== undefined && { freeAbove: dto.freeAbove }),
                ...(dto.minDays !== undefined && { minDays: dto.minDays }),
                ...(dto.maxDays !== undefined && { maxDays: dto.maxDays }),
                ...(dto.carrier !== undefined && { carrier: dto.carrier }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            },
        });
    }

    async deleteShippingZone(id: string) {
        await this.getShippingZone(id);
        return this.prisma.shippingZone.delete({ where: { id } });
    }

    // ============================================
    // PUBLIC SETTINGS (for frontend)
    // ============================================

    async getPublicSettings(): Promise<PublicSettingsDto> {
        // Fetch all settings at once for efficiency
        const settings = await this.getAllSettings();
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
            name: getValue<string>('store.name'),
            phone: getValue<string>('store.phone'),
            email: getValue<string>('store.email'),
            address: getValue<StoreInfoDto['address']>('store.address'),
            vatNumber: getValue<string>('store.vatNumber'),
        };

        const checkout: CheckoutConfigDto = {
            defaultCountry: getValue<string>('checkout.defaultCountry'),
            currency: getValue<string>('checkout.currency'),
            currencySymbol: getValue<string>('checkout.currencySymbol'),
            taxIncluded: getValue<boolean>('checkout.taxIncluded'),
            taxRate: getValue<number>('checkout.taxRate'),
            taxLabel: getValue<string>('checkout.taxLabel'),
        };

        const zones = await this.getAllShippingZones();
        const shippingZones: ShippingZoneDto[] = zones.map(this.mapShippingZone);

        return { store, checkout, shippingZones };
    }

    // Helper to map Prisma model to DTO
    private mapShippingZone(zone: {
        id: string;
        name: string;
        countries: string[];
        rate: unknown;
        freeAbove: unknown;
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
            carrier: zone.carrier ?? undefined,
            isActive: zone.isActive,
            sortOrder: zone.sortOrder,
        };
    }
}
