import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface GoogleReview {
    authorName: string;
    rating: number;
    text?: string;
    time: number;
    relativeTimeDescription: string;
    profilePhotoUrl?: string;
}

interface GooglePlaceDetails {
    result: {
        reviews?: GoogleReview[];
        name: string;
        rating: number;
        user_ratings_total: number;
    };
    status: string;
}

@Injectable()
export class GoogleReviewsService {
    private readonly logger = new Logger(GoogleReviewsService.name);
    private readonly apiKey: string | undefined;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');
    }

    /**
     * Sync reviews from Google Places API
     */
    async syncGoogleReviews(placeId: string) {
        if (!this.apiKey) {
            throw new BadRequestException('Google Places API key not configured');
        }

        if (!placeId) {
            throw new BadRequestException('Place ID is required');
        }

        this.logger.log(`Syncing reviews for place ID: ${placeId}`);

        try {
            // Fetch reviews from Google Places API
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${this.apiKey}`;

            const response = await fetch(url);
            const data = await response.json() as GooglePlaceDetails;

            if (data.status !== 'OK') {
                throw new BadRequestException(`Google API error: ${data.status}`);
            }

            const reviews = data.result.reviews || [];
            this.logger.log(`Found ${reviews.length} reviews from Google`);

            let imported = 0;
            let skipped = 0;

            for (const review of reviews) {
                // Check if review already exists (by author name and time)
                const existingReview = await this.prisma.googleReview.findFirst({
                    where: {
                        authorName: review.authorName,
                        googleTime: review.time,
                    },
                });

                if (existingReview) {
                    skipped++;
                    continue;
                }

                // Create new review
                await this.prisma.googleReview.create({
                    data: {
                        placeId,
                        authorName: review.authorName,
                        authorPhotoUrl: review.profilePhotoUrl,
                        rating: review.rating,
                        text: review.text || '',
                        googleTime: review.time,
                        relativeTimeDescription: review.relativeTimeDescription,
                        isVisible: true,
                    },
                });
                imported++;
            }

            // Update sync timestamp in settings
            await this.prisma.setting.upsert({
                where: { key: 'google_reviews_last_sync' },
                create: {
                    key: 'google_reviews_last_sync',
                    value: new Date().toISOString(),
                },
                update: {
                    value: new Date().toISOString(),
                },
            });

            await this.prisma.setting.upsert({
                where: { key: 'google_place_id' },
                create: {
                    key: 'google_place_id',
                    value: placeId,
                },
                update: {
                    value: placeId,
                },
            });

            this.logger.log(`Sync complete: ${imported} imported, ${skipped} skipped`);

            return {
                success: true,
                imported,
                skipped,
                total: reviews.length,
                businessName: data.result.name,
                overallRating: data.result.rating,
                totalReviews: data.result.user_ratings_total,
            };
        } catch (error) {
            this.logger.error(`Failed to sync Google reviews: ${error}`);
            throw error;
        }
    }

    /**
     * Get all synced Google reviews
     */
    async getGoogleReviews(options: { visibleOnly?: boolean } = {}) {
        const where: Record<string, unknown> = {};
        if (options.visibleOnly) {
            where.isVisible = true;
        }

        return this.prisma.googleReview.findMany({
            where,
            orderBy: { googleTime: 'desc' },
        });
    }

    /**
     * Get sync status
     */
    async getSyncStatus() {
        const [lastSync, placeId, reviewCount] = await Promise.all([
            this.prisma.setting.findUnique({ where: { key: 'google_reviews_last_sync' } }),
            this.prisma.setting.findUnique({ where: { key: 'google_place_id' } }),
            this.prisma.googleReview.count(),
        ]);

        return {
            lastSync: lastSync?.value || null,
            placeId: placeId?.value || null,
            reviewCount,
            apiConfigured: !!this.apiKey,
        };
    }

    /**
     * Toggle review visibility
     */
    async toggleVisibility(reviewId: string) {
        const review = await this.prisma.googleReview.findUnique({ where: { id: reviewId } });
        if (!review) {
            throw new BadRequestException('Review not found');
        }

        return this.prisma.googleReview.update({
            where: { id: reviewId },
            data: { isVisible: !review.isVisible },
        });
    }
}
