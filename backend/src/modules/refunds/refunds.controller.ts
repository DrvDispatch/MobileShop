import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RefundsService } from './refunds.service';
import { CreateRefundDto, UpdateRefundDto, RefundListQueryDto, RefundResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Refunds')
@Controller('refunds')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RefundsController {
    constructor(private readonly refundsService: RefundsService) { }

    @Post()
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Create a new refund request' })
    @ApiResponse({ status: 201, type: RefundResponseDto })
    async createRefund(
        @Body() dto: CreateRefundDto,
        @Req() req: any,
    ) {
        const adminId = req.user?.sub || req.user?.id;
        return this.refundsService.createRefund(dto, adminId);
    }

    @Post(':id/process')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Process a pending refund via Stripe' })
    @ApiResponse({ status: 200, type: RefundResponseDto })
    async processRefund(@Param('id') id: string) {
        return this.refundsService.processRefund(id);
    }

    @Post(':id/cancel')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Cancel a pending refund' })
    @ApiResponse({ status: 200, type: RefundResponseDto })
    async cancelRefund(@Param('id') id: string) {
        return this.refundsService.cancelRefund(id);
    }

    @Get()
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get all refunds with filters' })
    async getAllRefunds(@Query() query: RefundListQueryDto) {
        return this.refundsService.getAllRefunds(query);
    }

    @Get('stats')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get refund statistics' })
    async getRefundStats() {
        return this.refundsService.getRefundStats();
    }

    @Get(':id')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get refund details' })
    @ApiResponse({ status: 200, type: RefundResponseDto })
    async getRefund(@Param('id') id: string) {
        return this.refundsService.getRefund(id);
    }

    @Patch(':id')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Update refund (notes, return status)' })
    @ApiResponse({ status: 200, type: RefundResponseDto })
    async updateRefund(
        @Param('id') id: string,
        @Body() dto: UpdateRefundDto,
    ) {
        return this.refundsService.updateRefund(id, dto);
    }
}
