import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShippingService {
    constructor(private prisma: PrismaService) { }

    async getZones() {
        return this.prisma.shippingZone.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
    }

    async getZone(id: string) {
        const zone = await this.prisma.shippingZone.findUnique({
            where: { id },
        });
        if (!zone) {
            throw new NotFoundException('Shipping zone not found');
        }
        return zone;
    }

    async createZone(data: {
        name: string;
        countries: string[];
        rate: number;
        freeAbove?: number;
        minDays?: number;
        maxDays?: number;
        carrier?: string;
        isActive?: boolean;
    }) {
        return this.prisma.shippingZone.create({
            data: {
                name: data.name,
                countries: data.countries,
                rate: data.rate,
                freeAbove: data.freeAbove,
                minDays: data.minDays ?? 2,
                maxDays: data.maxDays ?? 5,
                carrier: data.carrier,
                isActive: data.isActive ?? true,
            },
        });
    }

    async updateZone(
        id: string,
        data: {
            name?: string;
            countries?: string[];
            rate?: number;
            freeAbove?: number;
            minDays?: number;
            maxDays?: number;
            carrier?: string;
            isActive?: boolean;
            sortOrder?: number;
        },
    ) {
        return this.prisma.shippingZone.update({
            where: { id },
            data,
        });
    }

    async deleteZone(id: string) {
        return this.prisma.shippingZone.delete({
            where: { id },
        });
    }

    async calculateShipping(country: string, orderTotal: number) {
        // Find zone that includes this country
        const zones = await this.prisma.shippingZone.findMany({
            where: { isActive: true },
        });

        const zone = zones.find((z) =>
            z.countries.some((c) => c.toLowerCase() === country.toLowerCase())
        );

        if (!zone) {
            return {
                available: false,
                message: 'Verzending naar dit land is niet beschikbaar',
            };
        }

        // Check free shipping threshold
        const isFree = zone.freeAbove && orderTotal >= Number(zone.freeAbove);

        return {
            available: true,
            zone: zone.name,
            rate: isFree ? 0 : Number(zone.rate),
            isFree,
            freeAbove: zone.freeAbove ? Number(zone.freeAbove) : null,
            deliveryDays: `${zone.minDays}-${zone.maxDays}`,
            carrier: zone.carrier,
        };
    }

    async getActiveZonesCount() {
        return this.prisma.shippingZone.count({
            where: { isActive: true },
        });
    }
}
