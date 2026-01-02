import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/tickets',
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger('TicketsGateway');

    // Track connected clients by their session/admin status
    // sessionClients: Map<sessionId, Set<socketId>> -> No change needed structure-wise, but rooms will be scoped
    private sessionClients: Map<string, Set<string>> = new Map();
    private adminClients: Set<string> = new Set();

    constructor(private prisma: PrismaService) { }

    async handleConnection(client: Socket) {
        try {
            // Secure Tenant Resolution via Handshake
            const hostHeader = client.handshake.headers.host;

            // Also support tenant domain via query param (for direct backend connections)
            const queryDomain = client.handshake.query?.domain as string | undefined;

            // Try host header first, then query param
            let domain = hostHeader ? hostHeader.split(':')[0].toLowerCase() : null;

            // If host header is a backend URL (localhost:3001, api.*, etc.), use query param instead
            if (domain && (domain.includes('localhost') || domain.startsWith('api.') || domain === '127.0.0.1')) {
                if (queryDomain) {
                    domain = queryDomain.split(':')[0].toLowerCase();
                    this.logger.log(`Using query domain: ${domain} (host was: ${hostHeader})`);
                } else {
                    this.logger.warn(`Client ${client.id} connected from ${hostHeader} without domain query param`);
                    // Don't reject - allow connection but it won't be tenant-scoped
                    client.data.tenantId = null;
                    return;
                }
            }

            if (!domain) {
                this.logger.warn(`Client ${client.id} rejected: No domain available`);
                client.disconnect();
                return;
            }

            // Resolve Tenant
            const tenantDomain = await this.prisma.tenantDomain.findUnique({
                where: { domain },
                include: { tenant: true },
            });

            if (!tenantDomain || !tenantDomain.tenant || tenantDomain.tenant.status !== 'ACTIVE') {
                this.logger.warn(`Client ${client.id} rejected: Invalid or inactive tenant for domain ${domain}`);
                client.disconnect();
                return;
            }

            // Store tenantId in socket data (Safe Source of Truth)
            client.data.tenantId = tenantDomain.tenantId;
            this.logger.log(`Client ${client.id} connected [Tenant: ${tenantDomain.tenantId}]`);

        } catch (error) {
            this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.adminClients.delete(client.id);

        // Cleanup session tracking
        this.sessionClients.forEach((sockets, sessionId) => {
            if (sockets.has(client.id)) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.sessionClients.delete(sessionId);
                }
            }
        });
    }

    // Customer joins with their sessionId
    @SubscribeMessage('join:session')
    async handleJoinSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string },
    ) {
        const { sessionId } = data;
        const tenantId = client.data.tenantId;

        if (!tenantId) {
            this.logger.error(`Client ${client.id} has no tenantId in socket data`);
            client.disconnect();
            return;
        }

        if (!sessionId) {
            this.logger.warn(`Client ${client.id} tried to join session without sessionId`);
            return;
        }

        // Optional: Verify session belongs to tenant (Strict Mode)
        // For now, scoping the room is sufficient isolation

        // Add to scoped session room
        const roomName = `session:${tenantId}:${sessionId}`;
        client.join(roomName);

        // Track client
        if (!this.sessionClients.has(sessionId)) {
            this.sessionClients.set(sessionId, new Set());
        }
        this.sessionClients.get(sessionId)?.add(client.id);

        this.logger.log(`Client ${client.id} joined room: ${roomName}`);
    }

    // Admin joins to receive ticket updates for their tenant
    @SubscribeMessage('join:admin')
    handleJoinAdmin(
        @ConnectedSocket() client: Socket,
    ) {
        const tenantId = client.data.tenantId;

        if (!tenantId) {
            this.logger.error(`Admin client ${client.id} has no tenantId in socket data`);
            client.disconnect();
            return;
        }

        this.adminClients.add(client.id);

        // Join scoped admin room
        const roomName = `admin:tickets:${tenantId}`;
        client.join(roomName);

        this.logger.log(`Admin client ${client.id} joined room: ${roomName}`);
    }

    // Emit new message to relevant clients
    emitNewMessage(tenantId: string, ticketId: string, sessionId: string, message: any) {
        // Send to customer in scoped session room
        this.server.to(`session:${tenantId}:${sessionId}`).emit('ticket:message', {
            ticketId,
            message,
        });

        // Send to admins of this tenant only
        this.server.to(`admin:tickets:${tenantId}`).emit('ticket:message', {
            ticketId,
            message,
        });

        this.logger.log(`Emitted message for ticket ${ticketId} [Tenant: ${tenantId}]`);
    }

    // Emit new ticket notification to admins
    emitNewTicket(tenantId: string, ticket: any) {
        this.server.to(`admin:tickets:${tenantId}`).emit('ticket:new', ticket);
        this.logger.log(`Emitted new ticket: ${ticket.caseId} [Tenant: ${tenantId}]`);
    }

    // Emit ticket status update
    emitTicketUpdate(tenantId: string, ticketId: string, sessionId: string, update: any) {
        const payload = { ticketId, ...update };

        // Notify customer
        this.server.to(`session:${tenantId}:${sessionId}`).emit('ticket:update', payload);

        // Notify admin
        this.server.to(`admin:tickets:${tenantId}`).emit('ticket:update', payload);
    }
}
