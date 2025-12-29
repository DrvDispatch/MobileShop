import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TicketsGateway } from './tickets.gateway';
import { CreateTicketDto, AddMessageDto, UpdateTicketDto, TicketStatus } from './dto';
import { FeedbackService } from '../feedback/feedback.service';

@Injectable()
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        @Inject(forwardRef(() => TicketsGateway))
        private ticketsGateway: TicketsGateway,
        @Inject(forwardRef(() => FeedbackService))
        private feedbackService: FeedbackService,
    ) { }

    private async generateCaseId(): Promise<string> {
        const year = new Date().getFullYear();
        // Get the count of tickets for this year
        const count = await this.prisma.ticket.count({
            where: {
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


    async create(dto: CreateTicketDto) {
        const caseId = await this.generateCaseId();

        // Create ticket with customer's initial message
        const ticket = await this.prisma.ticket.create({
            data: {
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
                            sender: 'SmartphoneService Bot',
                            message: this.getAutoGreeting(dto.customerName, dto.category),
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

        // Emit WebSocket event for new ticket
        this.ticketsGateway.emitNewTicket(ticket);

        // Send confirmation email if email provided
        if (dto.customerEmail) {
            try {
                await this.emailService.sendEmail({
                    to: dto.customerEmail,
                    subject: `Ticket Ontvangen - ${caseId}`,
                    html: this.getTicketConfirmationHtml(ticket),
                });
                this.logger.log(`Ticket confirmation sent to ${dto.customerEmail}`);
            } catch (error) {
                this.logger.error(`Failed to send ticket confirmation: ${error.message}`);
            }
        }

        return ticket;
    }

    private getAutoGreeting(customerName: string, category: string): string {
        const greetings: Record<string, string> = {
            REPAIR_QUESTION: `Hallo ${customerName}! 👋 Bedankt voor uw reparatievraag. Een van onze technici zal zo snel mogelijk reageren. In de tussentijd kunt u ons altijd bellen op +32 465 638 106 voor dringende zaken.`,
            ORDER_QUESTION: `Hallo ${customerName}! 👋 Bedankt voor uw vraag over uw bestelling. We bekijken dit zo snel mogelijk en komen bij u terug.`,
            PRICE_QUOTE: `Hallo ${customerName}! 👋 Bedankt voor uw offerte aanvraag. We sturen u zo snel mogelijk een prijsopgave. Gemiddelde reactietijd: 30 minuten.`,
            GENERAL: `Hallo ${customerName}! 👋 Bedankt voor uw bericht. We reageren meestal binnen 30 minuten tijdens openingstijden (Ma-Za 10:00-18:00).`,
        };
        return greetings[category] || greetings.GENERAL;
    }

    async findBySession(sessionId: string) {
        // Return all tickets for this session, most recent first
        return this.prisma.ticket.findMany({
            where: { sessionId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id },
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

    async findByCaseId(caseId: string) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { caseId },
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

    async addMessage(id: string, dto: AddMessageDto) {
        const ticket = await this.findOne(id);

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
        this.ticketsGateway.emitNewMessage(id, ticket.sessionId, messageForWS);

        // If reopened, also emit status update
        if (shouldReopen) {
            this.ticketsGateway.emitTicketUpdate(id, ticket.sessionId, { status: 'OPEN' as TicketStatus });
            this.logger.log(`Ticket ${ticket.caseId} reopened by customer message`);
        }

        return message;
    }

    async findAll(params?: { status?: TicketStatus }) {
        const where: any = {};
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

    async update(id: string, dto: UpdateTicketDto) {
        const ticket = await this.findOne(id);

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
        this.ticketsGateway.emitTicketUpdate(id, ticket.sessionId, dto);

        // Send feedback request email if status changed to RESOLVED and customer has email
        if (dto.status === TicketStatus.RESOLVED && ticket.status !== TicketStatus.RESOLVED && ticket.customerEmail) {
            try {
                // Create feedback request with rating email
                await this.feedbackService.createAndSendFeedbackRequest({
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
                    await this.emailService.sendEmail({
                        to: ticket.customerEmail,
                        subject: `Ticket Afgehandeld - ${ticket.caseId}`,
                        html: this.getTicketClosureEmailHtml(updated),
                    });
                    this.logger.log(`Fallback closure email sent to ${ticket.customerEmail}`);
                } catch (fallbackError) {
                    this.logger.error(`Failed to send fallback email: ${fallbackError.message}`);
                }
            }
        }

        return updated;
    }


    async delete(id: string) {
        const ticket = await this.findOne(id);

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

    private getTicketConfirmationHtml(ticket: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #18181b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .case-id { font-size: 24px; font-weight: bold; color: #18181b; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #71717a; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Ticket Ontvangen ✓</h1>
        </div>
        <div class="content">
            <p>Beste ${ticket.customerName},</p>
            <p>Bedankt voor uw bericht! Wij hebben uw vraag ontvangen en zullen zo snel mogelijk reageren.</p>
            
            <div class="case-id">
                Case ID: ${ticket.caseId}
            </div>
            
            <p><strong>Onderwerp:</strong> ${ticket.subject}</p>
            
            <p>U kunt op elk moment terugkeren naar onze website om uw gesprek voort te zetten.</p>
            
            <p>Heeft u dringend hulp nodig? Bel ons op <a href="tel:+32465638106">+32 465 638 106</a> of stuur een WhatsApp.</p>
        </div>
        <div class="footer">
            <p>SmartphoneService - Premium Mobile Technology</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    private getTicketClosureEmailHtml(ticket: any): string {
        // Format the conversation transcript
        const messagesHtml = ticket.messages.map((msg: any) => {
            const time = new Date(msg.createdAt).toLocaleString('nl-BE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            const isCustomer = msg.sender === 'customer';
            return `
                <div style="margin: 10px 0; padding: 12px; background: ${isCustomer ? '#e0f2fe' : '#f0fdf4'}; border-radius: 8px; border-left: 4px solid ${isCustomer ? '#0284c7' : '#16a34a'};">
                    <div style="font-weight: bold; color: ${isCustomer ? '#0284c7' : '#16a34a'}; font-size: 12px; margin-bottom: 4px;">
                        ${isCustomer ? ticket.customerName : msg.sender} - ${time}
                    </div>
                    <div style="color: #333;">${msg.message}</div>
                </div>
            `;
        }).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .case-id { font-size: 20px; font-weight: bold; color: #18181b; text-align: center; padding: 16px; background: white; border-radius: 8px; margin: 20px 0; }
        .transcript { background: white; padding: 16px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #71717a; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Ticket Afgehandeld ✓</h1>
        </div>
        <div class="content">
            <p>Beste ${ticket.customerName},</p>
            <p>Uw supportticket is afgehandeld. Hieronder vindt u een volledig overzicht van het gesprek.</p>
            
            <div class="case-id">
                Case ID: ${ticket.caseId}
            </div>
            
            <p><strong>Onderwerp:</strong> ${ticket.subject}</p>
            
            <div class="transcript">
                <h3 style="margin-top: 0; color: #18181b;">Gespreksoverzicht</h3>
                ${messagesHtml}
            </div>
            
            <p>Heeft u nog vragen of een nieuw probleem? U kunt altijd een nieuw ticket aanmaken op onze website of ons contacteren via:</p>
            <ul>
                <li>WhatsApp: <a href="https://wa.me/32465638106">+32 465 638 106</a></li>
                <li>Telefoon: <a href="tel:+32465638106">+32 465 638 106</a></li>
            </ul>
            
            <p>Bedankt voor uw vertrouwen in SmartphoneService!</p>
        </div>
        <div class="footer">
            <p>SmartphoneService - Premium Mobile Technology</p>
            <p style="font-size: 10px; color: #a1a1aa;">Dit is een automatisch gegenereerde email. U kunt dit bewaren als referentie voor uw administratie.</p>
        </div>
    </div>
</body>
</html>
        `;
    }
}
