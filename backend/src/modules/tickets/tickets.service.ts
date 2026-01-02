import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TicketsGateway } from './tickets.gateway';
import { TicketEmailService } from './ticket-email.service';
import { CreateTicketDto, AddMessageDto, UpdateTicketDto, TicketStatus } from './dto';
import { FeedbackService } from '../feedback/feedback.service';
import { formatOpeningHours } from '../../utils/tenant-branding';

@Injectable()
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private ticketEmailService: TicketEmailService,
        @Inject(forwardRef(() => TicketsGateway))
        private ticketsGateway: TicketsGateway,
        @Inject(forwardRef(() => FeedbackService))
        private feedbackService: FeedbackService,
    ) { }

    /**
     * Fetch tenant branding info for emails
     */
    private async getTenantBranding(tenantId: string) {
        const config = await this.prisma.tenantConfig.findUnique({
            where: { tenantId },
            select: {
                shopName: true,
                phone: true,
                whatsappNumber: true,
                openingHours: true,
            },
        });
        return {
            shopName: config?.shopName || 'Support',
            phone: config?.phone || undefined,
            whatsappNumber: config?.whatsappNumber || undefined,
            tagline: undefined,  // Can be added to TenantConfig later
            openingHours: formatOpeningHours(config?.openingHours),
        };
    }

    private async generateCaseId(tenantId: string): Promise<string> {
        const year = new Date().getFullYear();
        // Get the count of tickets for this year (scoped to tenant)
        const count = await this.prisma.ticket.count({
            where: {
                tenantId,
                caseId: {
                    startsWith: `NEO-${year}`,
                },
            },
        });
        // Add 1 for next number, plus random suffix for race condition safety
        const num = count + 1;
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `NEO-${year}-${num.toString().padStart(4, '0')}-${randomSuffix}`;
    }


    async create(tenantId: string, dto: CreateTicketDto) {
        const caseId = await this.generateCaseId(tenantId);
        const branding = await this.getTenantBranding(tenantId);

        // Create ticket with customer's initial message
        const ticket = await this.prisma.ticket.create({
            data: {
                tenantId,
                caseId,
                sessionId: dto.sessionId,
                customerName: dto.customerName,
                customerEmail: dto.customerEmail,
                customerPhone: dto.customerPhone,
                category: dto.category,
                subject: dto.subject,
                status: TicketStatus.OPEN,
                messages: {
                    create: [
                        {
                            sender: 'customer',
                            message: dto.initialMessage,
                        },
                        {
                            sender: `${branding.shopName} Bot`,
                            message: this.getAutoGreeting(dto.customerName, dto.category, branding),
                        },
                    ],
                },
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        // Emit WebSocket event for new ticket (with tenantId context)
        this.ticketsGateway.emitNewTicket(tenantId, ticket);

        // Send confirmation email if email provided
        if (dto.customerEmail) {
            try {
                await this.emailService.sendEmail({
                    to: dto.customerEmail,
                    subject: `Ticket Ontvangen - ${caseId}`,
                    html: this.ticketEmailService.getTicketConfirmationHtml(ticket, branding),
                });
                this.logger.log(`Ticket confirmation sent to ${dto.customerEmail}`);
            } catch (error) {
                this.logger.error(`Failed to send ticket confirmation: ${error.message}`);
            }
        }

        return ticket;
    }

    private getAutoGreeting(customerName: string, category: string, branding: { phone?: string; openingHours?: string }): string {
        const phoneText = branding.phone ? ` bellen op ${branding.phone}` : '';
        const hoursText = branding.openingHours ? ` (${branding.openingHours})` : '';
        const greetings: Record<string, string> = {
            REPAIR_QUESTION: `Hallo ${customerName}! 👋 Bedankt voor uw reparatievraag. Een van onze technici zal zo snel mogelijk reageren.${phoneText ? ` In de tussentijd kunt u ons altijd${phoneText} voor dringende zaken.` : ''}`,
            ORDER_QUESTION: `Hallo ${customerName}! 👋 Bedankt voor uw vraag over uw bestelling. We bekijken dit zo snel mogelijk en komen bij u terug.`,
            PRICE_QUOTE: `Hallo ${customerName}! 👋 Bedankt voor uw offerte aanvraag. We sturen u zo snel mogelijk een prijsopgave. Gemiddelde reactietijd: 30 minuten.`,
            GENERAL: `Hallo ${customerName}! 👋 Bedankt voor uw bericht. We reageren meestal binnen 30 minuten${hoursText ? ` tijdens openingstijden${hoursText}` : ''}.`,
        };
        return greetings[category] || greetings.GENERAL;
    }

    async findBySession(tenantId: string, sessionId: string) {
        // Return all tickets for this session and tenant, most recent first
        return this.prisma.ticket.findMany({
            where: { tenantId, sessionId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { tenantId, id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        return ticket;
    }

    async findByCaseId(tenantId: string, caseId: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { tenantId, caseId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        return ticket;
    }

    async addMessage(tenantId: string, id: string, dto: AddMessageDto) {
        const ticket = await this.findOne(tenantId, id);

        // Debug: Log what we receive
        this.logger.log(`addMessage - Received attachments: ${JSON.stringify(dto.attachments)}`);

        // Ensure attachments is a proper array of plain objects for Prisma JSON field
        const attachmentsArray = Array.isArray(dto.attachments)
            ? dto.attachments.map(att => ({ ...att }))  // Convert to plain objects
            : [];

        const message = await this.prisma.ticketMessage.create({
            data: {
                ticketId: id,
                sender: dto.sender,
                message: dto.message,
                attachments: attachmentsArray as any,
            },
        });

        // Parse attachments from Prisma JSON field - it may be returned as string or need normalization
        let parsedAttachments = message.attachments;
        if (typeof parsedAttachments === 'string') {
            try {
                parsedAttachments = JSON.parse(parsedAttachments);
            } catch (e) {
                this.logger.error(`Failed to parse attachments: ${e.message}`);
                parsedAttachments = [];
            }
        }
        // Ensure it's an array
        if (!Array.isArray(parsedAttachments)) {
            parsedAttachments = [];
        }

        this.logger.log(`addMessage - Saved message with attachments: ${JSON.stringify(parsedAttachments)}`);

        // If customer sends a message to a closed/resolved ticket, reopen it
        const shouldReopen = dto.sender === 'customer' &&
            (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED');

        // Update ticket timestamp and potentially reopen
        await this.prisma.ticket.update({
            where: { id },
            data: {
                updatedAt: new Date(),
                ...(shouldReopen && { status: 'OPEN' as TicketStatus }),
            },
        });

        // Create a properly structured message object for WebSocket emission
        const messageForWS = {
            id: message.id,
            ticketId: message.ticketId,
            sender: message.sender,
            message: message.message,
            attachments: parsedAttachments,
            createdAt: message.createdAt,
        };

        // Emit WebSocket event for new message
        this.ticketsGateway.emitNewMessage(tenantId, id, ticket.sessionId, messageForWS);

        // If reopened, also emit status update
        if (shouldReopen) {
            this.ticketsGateway.emitTicketUpdate(tenantId, id, ticket.sessionId, { status: 'OPEN' as TicketStatus });
            this.logger.log(`Ticket ${ticket.caseId} reopened by customer message`);
        }

        return message;
    }

    async findAll(tenantId: string, params?: { status?: TicketStatus }) {
        const where: any = { tenantId };
        if (params?.status) {
            where.status = params.status;
        }

        return this.prisma.ticket.findMany({
            where,
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async update(tenantId: string, id: string, dto: UpdateTicketDto) {
        const ticket = await this.findOne(tenantId, id);

        const updated = await this.prisma.ticket.update({
            where: { id },
            data: dto,
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        // Emit WebSocket event for status update
        this.ticketsGateway.emitTicketUpdate(tenantId, id, ticket.sessionId, dto);

        // Send feedback request email if status changed to RESOLVED and customer has email
        if (dto.status === TicketStatus.RESOLVED && ticket.status !== TicketStatus.RESOLVED && ticket.customerEmail) {
            try {
                // Create feedback request with rating email
                await this.feedbackService.createAndSendFeedbackRequest(tenantId, {
                    sourceType: 'ticket',
                    ticketId: ticket.id,
                    customerEmail: ticket.customerEmail,
                    customerName: ticket.customerName,
                });
                this.logger.log(`Feedback request sent to ${ticket.customerEmail} for ticket ${ticket.caseId}`);
            } catch (error) {
                this.logger.error(`Failed to send feedback request: ${error.message}`);

                // Fallback: send standard closure email
                try {
                    const closureBranding = await this.getTenantBranding(tenantId);
                    await this.emailService.sendEmail({
                        to: ticket.customerEmail,
                        subject: `Ticket Afgehandeld - ${ticket.caseId}`,
                        html: this.ticketEmailService.getTicketClosureEmailHtml(updated, closureBranding),
                    });
                    this.logger.log(`Fallback closure email sent to ${ticket.customerEmail}`);
                } catch (fallbackError) {
                    this.logger.error(`Failed to send fallback email: ${fallbackError.message}`);
                }
            }
        }

        return updated;
    }


    async delete(tenantId: string, id: string) {
        const ticket = await this.findOne(tenantId, id);

        // Only allow deleting closed or resolved tickets
        if (ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED') {
            throw new Error('Can only delete closed or resolved tickets');
        }

        // Delete all messages first (due to foreign key constraint)
        await this.prisma.ticketMessage.deleteMany({
            where: { ticketId: id },
        });

        // Delete the ticket
        await this.prisma.ticket.delete({
            where: { id },
        });

        this.logger.log(`Ticket ${ticket.caseId} deleted`);

        return { success: true, message: `Ticket ${ticket.caseId} deleted` };
    }
}
