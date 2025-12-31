import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateFeedbackDto, SubmitRatingDto } from './dto';
import { randomBytes } from 'crypto';

@Injectable()
export class FeedbackService {
    private readonly logger = new Logger(FeedbackService.name);
    private readonly googleReviewUrl = 'https://maps.app.goo.gl/6bAP4qtykPysRhSF9';

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    /**
     * Generate a secure random token for rating URL
     */
    private generateToken(): string {
        return randomBytes(32).toString('hex');
    }

    /**
     * Create a feedback rating entry and send email
     */
    async createAndSendFeedbackRequest(tenantId: string, dto: CreateFeedbackDto): Promise<{ token: string; id: string }> {
        const token = this.generateToken();

        const feedback = await this.prisma.feedbackRating.create({
            data: {
                tenantId,
                token,
                sourceType: dto.sourceType,
                ticketId: dto.ticketId,
                repairTicketId: dto.repairTicketId,
                customerEmail: dto.customerEmail,
                customerName: dto.customerName,
            },
        });

        // Send feedback email
        const sent = await this.emailService.sendFeedbackRequestEmail({
            to: dto.customerEmail,
            customerName: dto.customerName,
            token,
            sourceType: dto.sourceType,
            showGoogleReview: dto.sourceType === 'repair',
        });

        if (sent) {
            await this.prisma.feedbackRating.update({
                where: { id: feedback.id }, // ID is unique global UUID, secure to access directly here as we just created it
                data: { emailSent: true },
            });
        }

        this.logger.log(`Feedback request created for ${dto.customerEmail}, token: ${token.substring(0, 8)}... [Tenant: ${tenantId}]`);

        return { token, id: feedback.id };
    }

    /**
     * Get feedback by token (for rating page)
     * Note: Tokens are globally unique securely generated strings, so findUnique is safe without tenantId
     * (Customer clicking link won't have tenantId context initially)
     */
    async getFeedbackByToken(token: string) {
        const feedback = await this.prisma.feedbackRating.findUnique({
            where: { token },
        });

        if (!feedback) {
            throw new NotFoundException('Feedback not found or link expired');
        }

        return {
            id: feedback.id,
            sourceType: feedback.sourceType,
            customerName: feedback.customerName,
            rating: feedback.rating,
            ratedAt: feedback.ratedAt,
            showGoogleReview: feedback.sourceType === 'repair',
            googleReviewUrl: this.googleReviewUrl,
            tenantId: feedback.tenantId // Optionally return tenantId if frontend needs it for theming
        };
    }

    /**
     * Submit a rating
     * Token is proof of authority
     */
    async submitRating(token: string, dto: SubmitRatingDto) {
        const feedback = await this.prisma.feedbackRating.findUnique({
            where: { token },
        });

        if (!feedback) {
            throw new NotFoundException('Feedback not found or link expired');
        }

        if (feedback.ratedAt) {
            throw new BadRequestException('Rating already submitted');
        }

        const updated = await this.prisma.feedbackRating.update({
            where: { token },
            data: {
                rating: dto.rating,
                comment: dto.comment,
                googleReviewClicked: dto.googleReviewClicked ?? false,
                ratedAt: new Date(),
            },
        });

        this.logger.log(`Rating submitted: ${dto.rating} stars for feedback ${feedback.id} [Tenant: ${feedback.tenantId}]`);

        return {
            success: true,
            rating: updated.rating,
            message: 'Bedankt voor uw feedback!',
        };
    }

    /**
     * Get all feedback ratings (for admin analytics)
     */
    async getAllRatings(tenantId: string, params?: { sourceType?: string; limit?: number }) {
        return this.prisma.feedbackRating.findMany({
            where: {
                tenantId,
                ...(params?.sourceType && { sourceType: params.sourceType }),
                rating: { not: null },
            },
            orderBy: { ratedAt: 'desc' },
            take: params?.limit ?? 100,
        });
    }

    /**
     * Get average rating
     */
    async getAverageRating(tenantId: string, sourceType?: string) {
        const result = await this.prisma.feedbackRating.aggregate({
            where: {
                tenantId,
                ...(sourceType && { sourceType }),
                rating: { not: null },
            },
            _avg: { rating: true },
            _count: { rating: true },
        });

        return {
            average: result._avg.rating ?? 0,
            count: result._count.rating,
        };
    }
}
