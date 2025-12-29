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
import { TicketsService } from './tickets.service';
import { CreateTicketDto, AddMessageDto, UpdateTicketDto, TicketStatus } from './dto';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    // Public endpoint - customers can create tickets
    @Post()
    @ApiOperation({ summary: 'Create a new support ticket (public)' })
    create(@Body() dto: CreateTicketDto) {
        return this.ticketsService.create(dto);
    }

    // Public endpoint - get tickets by session ID (for returning users)
    @Get('session/:sessionId')
    @ApiOperation({ summary: 'Get tickets by session ID' })
    findBySession(@Param('sessionId') sessionId: string) {
        return this.ticketsService.findBySession(sessionId);
    }

    // Public endpoint - get ticket by case ID
    @Get('case/:caseId')
    @ApiOperation({ summary: 'Get ticket by case ID' })
    findByCaseId(@Param('caseId') caseId: string) {
        return this.ticketsService.findByCaseId(caseId);
    }

    // Public endpoint - add message to ticket
    @Post(':id/messages')
    @ApiOperation({ summary: 'Add message to ticket' })
    addMessage(@Param('id') id: string, @Body() dto: AddMessageDto) {
        return this.ticketsService.addMessage(id, dto);
    }

    // Admin endpoints below
    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all tickets (admin)' })
    @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
    findAll(@Query('status') status?: TicketStatus) {
        return this.ticketsService.findAll({ status });
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get ticket by ID (admin)' })
    findOne(@Param('id') id: string) {
        return this.ticketsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update ticket status (admin)' })
    update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
        return this.ticketsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a closed ticket (admin only)' })
    delete(@Param('id') id: string) {
        return this.ticketsService.delete(id);
    }
}
