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
    private sessionClients: Map<string, Set<string>> = new Map(); // sessionId -> socketIds
    private adminClients: Set<string> = new Set(); // socketIds of admins

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        // Remove from admin clients
        this.adminClients.delete(client.id);

        // Remove from session clients
        this.sessionClients.forEach((sockets, sessionId) => {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.sessionClients.delete(sessionId);
            }
        });
    }

    // Customer joins with their sessionId
    @SubscribeMessage('join:session')
    handleJoinSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string },
    ) {
        const { sessionId } = data;

        if (!this.sessionClients.has(sessionId)) {
            this.sessionClients.set(sessionId, new Set());
        }
        this.sessionClients.get(sessionId)?.add(client.id);

        client.join(`session:${sessionId}`);
        this.logger.log(`Client ${client.id} joined session: ${sessionId}`);
    }

    // Admin joins to receive all ticket updates
    @SubscribeMessage('join:admin')
    handleJoinAdmin(@ConnectedSocket() client: Socket) {
        this.adminClients.add(client.id);
        client.join('admin:tickets');
        this.logger.log(`Admin client ${client.id} joined`);
    }

    // Emit new message to relevant clients
    emitNewMessage(ticketId: string, sessionId: string, message: any) {
        // Send to customer with this session
        this.server.to(`session:${sessionId}`).emit('ticket:message', {
            ticketId,
            message,
        });

        // Send to all admins
        this.server.to('admin:tickets').emit('ticket:message', {
            ticketId,
            message,
        });

        this.logger.log(`Emitted message for ticket ${ticketId}`);
    }

    // Emit new ticket notification to admins
    emitNewTicket(ticket: any) {
        this.server.to('admin:tickets').emit('ticket:new', ticket);
        this.logger.log(`Emitted new ticket: ${ticket.caseId}`);
    }

    // Emit ticket status update
    emitTicketUpdate(ticketId: string, sessionId: string, update: any) {
        this.server.to(`session:${sessionId}`).emit('ticket:update', {
            ticketId,
            ...update,
        });
        this.server.to('admin:tickets').emit('ticket:update', {
            ticketId,
            ...update,
        });
    }
}
