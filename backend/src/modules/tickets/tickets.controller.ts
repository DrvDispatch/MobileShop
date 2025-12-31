import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    UseGuards,
    Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';
import { TenantId } from '../tenant/tenant.decorator';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, AddMessageDto, UpdateTicketDto, TicketStatus } from './dto';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    // Public endpoint - customers can create tickets
    @Post()
    @ApiOperation({ summary: 'Create a new support ticket (public)' })
    create(@TenantId() tenantId: string, @Body() dto: CreateTicketDto) {
        return this.ticketsService.create(tenantId, dto);
    }

    // Public endpoint - get tickets by session ID (for returning users)
    @Get('session/:sessionId')
    @ApiOperation({ summary: 'Get tickets by session ID' })
    findBySession(@TenantId() tenantId: string, @Param('sessionId') sessionId: string) {
        return this.ticketsService.findBySession(tenantId, sessionId);
    }

    // Public endpoint - get ticket by case ID
    @Get('case/:caseId')
    @ApiOperation({ summary: 'Get ticket by case ID' })
    findByCaseId(@TenantId() tenantId: string, @Param('caseId') caseId: string) {
        return this.ticketsService.findByCaseId(tenantId, caseId);
    }

    // Public endpoint - add message to ticket
    @Post(':id/messages')
    @ApiOperation({ summary: 'Add message to ticket' })
    addMessage(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: AddMessageDto) {
        return this.ticketsService.addMessage(tenantId, id, dto);
    }

    // Admin endpoints below
    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all tickets (admin)' })
    @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
    findAll(@TenantId() tenantId: string, @Query('status') status?: TicketStatus) {
        return this.ticketsService.findAll(tenantId, { status });
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get ticket by ID (admin)' })
    findOne(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.ticketsService.findOne(tenantId, id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update ticket status (admin)' })
    update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateTicketDto) {
        return this.ticketsService.update(tenantId, id, dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a closed ticket (admin only)' })
    delete(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.ticketsService.delete(tenantId, id);
    }
}
