import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, UpdateDiscountDto, ValidateDiscountDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
    constructor(private readonly discountsService: DiscountsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new discount code' })
    @ApiResponse({ status: 201, description: 'Discount code created' })
    create(@TenantId() tenantId: string, @Body() dto: CreateDiscountDto) {
        return this.discountsService.create(tenantId, dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all discount codes' })
    @ApiResponse({ status: 200, description: 'List of discount codes' })
    findAll(@TenantId() tenantId: string) {
        return this.discountsService.findAll(tenantId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get a single discount code' })
    @ApiResponse({ status: 200, description: 'Discount code details' })
    findOne(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.discountsService.findOne(tenantId, id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a discount code' })
    @ApiResponse({ status: 200, description: 'Discount code updated' })
    update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateDiscountDto) {
        return this.discountsService.update(tenantId, id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a discount code' })
    @ApiResponse({ status: 200, description: 'Discount code deleted' })
    remove(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.discountsService.remove(tenantId, id);
    }

    @Post('validate')
    @ApiOperation({ summary: 'Validate a discount code' })
    @ApiResponse({ status: 200, description: 'Validation result' })
    validate(@TenantId() tenantId: string, @Body() dto: ValidateDiscountDto) {
        return this.discountsService.validate(tenantId, dto);
    }
}

