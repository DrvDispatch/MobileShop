import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client.js';
import { UsersService } from './users.service';
import { UpdateUserDto, AdminResetPasswordDto, CreateAdminDto } from './dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'List all users (admin only)' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    findAll(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.usersService.findAll({
            search,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user details with orders and appointments' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Post('admin')
    @ApiOperation({ summary: 'Create new admin/staff user (super admin only)' })
    createAdmin(@Body() dto: CreateAdminDto) {
        return this.usersService.createAdmin(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update user (role, name, etc.)' })
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete user (super admin only)' })
    deleteUser(@Param('id') id: string) {
        return this.usersService.deleteUser(id);
    }

    @Post(':id/reset-password')
    @ApiOperation({ summary: 'Admin reset user password' })
    resetPassword(@Param('id') id: string, @Body() dto: AdminResetPasswordDto) {
        return this.usersService.adminResetPassword(id, dto.newPassword);
    }

    @Patch(':id/vip')
    @ApiOperation({ summary: 'Toggle VIP status for a customer' })
    updateVipStatus(@Param('id') id: string, @Body('isVip') isVip: boolean) {
        return this.usersService.updateVipStatus(id, isVip);
    }

    @Patch(':id/notes')
    @ApiOperation({ summary: 'Update admin notes for a customer' })
    updateNotes(@Param('id') id: string, @Body('adminNotes') adminNotes: string | null) {
        return this.usersService.updateNotes(id, adminNotes);
    }

    @Post(':id/recalculate-lifetime-value')
    @ApiOperation({ summary: 'Recalculate customer lifetime value from orders' })
    recalculateLifetimeValue(@Param('id') id: string) {
        return this.usersService.recalculateLifetimeValue(id);
    }
}
