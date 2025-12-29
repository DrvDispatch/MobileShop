import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, UpdateDiscountDto, ValidateDiscountDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
    create(@Body() dto: CreateDiscountDto) {
        return this.discountsService.create(dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all discount codes' })
    @ApiResponse({ status: 200, description: 'List of discount codes' })
    findAll() {
        return this.discountsService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get a single discount code' })
    @ApiResponse({ status: 200, description: 'Discount code details' })
    findOne(@Param('id') id: string) {
        return this.discountsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a discount code' })
    @ApiResponse({ status: 200, description: 'Discount code updated' })
    update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
        return this.discountsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a discount code' })
    @ApiResponse({ status: 200, description: 'Discount code deleted' })
    remove(@Param('id') id: string) {
        return this.discountsService.remove(id);
    }

    @Post('validate')
    @ApiOperation({ summary: 'Validate a discount code' })
    @ApiResponse({ status: 200, description: 'Validation result' })
    validate(@Body() dto: ValidateDiscountDto) {
        return this.discountsService.validate(dto);
    }
}
