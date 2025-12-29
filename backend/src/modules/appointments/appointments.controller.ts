import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentStatus } from './dto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    // Public endpoint - customers can book appointments
    @Post()
    @ApiOperation({ summary: 'Book a new appointment (public)' })
    create(@Body() dto: CreateAppointmentDto) {
        return this.appointmentsService.create(dto);
    }

    // Public endpoint - get available slots for a date
    @Get('available-slots')
    @ApiOperation({ summary: 'Get available time slots for a date' })
    @ApiQuery({ name: 'date', example: '2024-12-25' })
    getAvailableSlots(@Query('date') date: string) {
        return this.appointmentsService.getAvailableSlots(date);
    }

    // Authenticated user endpoint - get own appointments
    @Get('my')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my appointments (authenticated user)' })
    getMyAppointments(@Request() req: any) {
        return this.appointmentsService.findByUserEmail(req.user.email);
    }

    // Admin endpoints below
    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all appointments (admin)' })
    @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    findAll(
        @Query('status') status?: AppointmentStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.appointmentsService.findAll({
            status,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get appointment by ID (admin)' })
    findOne(@Param('id') id: string) {
        return this.appointmentsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update appointment status (admin)' })
    update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
        return this.appointmentsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete appointment (admin)' })
    remove(@Param('id') id: string) {
        return this.appointmentsService.remove(id);
    }
}
