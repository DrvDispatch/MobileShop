import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BannerPosition } from '../../generated/prisma/client.js';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
    constructor(private readonly bannersService: BannersService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new promotional banner' })
    @ApiResponse({ status: 201, description: 'Banner created' })
    create(@Body() dto: CreateBannerDto) {
        return this.bannersService.create(dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all promotional banners' })
    @ApiResponse({ status: 200, description: 'List of banners' })
    findAll() {
        return this.bannersService.findAll();
    }

    @Get('active')
    @ApiOperation({ summary: 'Get active banners for display' })
    @ApiQuery({ name: 'position', required: false, enum: BannerPosition })
    @ApiResponse({ status: 200, description: 'Active banners' })
    getActive(@Query('position') position?: BannerPosition) {
        return this.bannersService.getActiveBanners(position);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get a single banner' })
    @ApiResponse({ status: 200, description: 'Banner details' })
    findOne(@Param('id') id: string) {
        return this.bannersService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a banner' })
    @ApiResponse({ status: 200, description: 'Banner updated' })
    update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
        return this.bannersService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a banner' })
    @ApiResponse({ status: 200, description: 'Banner deleted' })
    remove(@Param('id') id: string) {
        return this.bannersService.remove(id);
    }
}
