import {
    Controller,
    Get,
    Post,
    Put,
    Param,
    Body,
    Query,
    Res,
    Req,
    UseGuards,
    HttpStatus,
    ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { UpdateInvoiceSettingsDto, InvoiceSettingsResponseDto, CreateInvoiceDto, UpdateInvoiceDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Invoice')
@Controller('invoice')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) { }

    @Get('settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get invoice settings' })
    @ApiResponse({ status: 200, type: InvoiceSettingsResponseDto })
    async getSettings(): Promise<InvoiceSettingsResponseDto> {
        return this.invoiceService.getInvoiceSettings();
    }

    @Put('settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update invoice settings' })
    @ApiResponse({ status: 200, type: InvoiceSettingsResponseDto })
    async updateSettings(
        @Body() dto: UpdateInvoiceSettingsDto,
    ): Promise<InvoiceSettingsResponseDto> {
        await this.invoiceService.updateInvoiceSettings(dto);
        return this.invoiceService.getInvoiceSettings();
    }

    @Get('preview')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate preview invoice PDF' })
    @ApiResponse({ status: 200, description: 'PDF file' })
    async previewInvoice(@Res() res: Response) {
        // Generate a sample invoice for preview
        const sampleData = {
            orderNumber: 'ND-PREVIEW-001',
            orderDate: new Date(),
            customerName: 'Jan Peeters',
            customerEmail: 'jan.peeters@example.be',
            customerPhone: '+32 478 12 34 56',
            shippingAddress: {
                line1: 'Grote Markt 1',
                city: 'Brussel',
                postalCode: '1000',
                country: 'BE',
            },
            items: [
                {
                    name: 'iPhone 15 Pro 256GB Space Black',
                    quantity: 1,
                    unitPrice: 1199.00,
                    totalPrice: 1199.00,
                },
                {
                    name: 'Screenprotector iPhone 15 Pro',
                    quantity: 2,
                    unitPrice: 19.95,
                    totalPrice: 39.90,
                },
            ],
            subtotal: 1238.90,
            shippingAmount: 5.95,
            taxAmount: 0,
            total: 1244.85,
            fulfillmentType: 'SHIPPING' as const,
        };

        const pdfBuffer = await this.invoiceService.generateInvoicePdf(sampleData);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="invoice-preview.pdf"',
            'Content-Length': pdfBuffer.length,
        });

        res.status(HttpStatus.OK).send(pdfBuffer);
    }

    @Get('order/:orderId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate invoice PDF for an order' })
    @ApiResponse({ status: 200, description: 'PDF file' })
    async getOrderInvoice(
        @Param('orderId') orderId: string,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.invoiceService.generateInvoiceForOrder(orderId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="invoice-${orderId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.status(HttpStatus.OK).send(pdfBuffer);
    }

    @Get('order/:orderId/download')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download invoice PDF for an order' })
    @ApiResponse({ status: 200, description: 'PDF file download' })
    async downloadOrderInvoice(
        @Param('orderId') orderId: string,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.invoiceService.generateInvoiceForOrder(orderId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.status(HttpStatus.OK).send(pdfBuffer);
    }

    // Customer endpoint - allows users to download invoices for their own orders
    @Get('my/:orderId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download invoice PDF for your own order' })
    @ApiResponse({ status: 200, description: 'PDF file download' })
    @ApiResponse({ status: 403, description: 'Order does not belong to user' })
    async downloadMyOrderInvoice(
        @Param('orderId') orderId: string,
        @Req() req: any,
        @Res() res: Response,
    ) {
        // Verify user owns this order
        const userEmail = req.user?.email;
        const userId = req.user?.sub || req.user?.id;

        const isOwner = await this.invoiceService.verifyOrderOwnership(orderId, userId, userEmail);
        if (!isOwner) {
            throw new ForbiddenException('You do not have access to this order');
        }

        const pdfBuffer = await this.invoiceService.generateInvoiceForOrder(orderId);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.status(HttpStatus.OK).send(pdfBuffer);
    }

    // ============================================
    // WALK-IN CUSTOMER INVOICE ENDPOINTS
    // ============================================

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new invoice for walk-in customer' })
    async createInvoice(
        @Body() dto: CreateInvoiceDto,
        @Req() req: any,
    ) {
        const createdBy = req.user?.sub || req.user?.id;
        return this.invoiceService.createInvoice({
            ...dto,
            createdBy,
        });
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all invoices with filters' })
    async listInvoices(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.invoiceService.getInvoices({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            status,
            search,
            startDate,
            endDate,
        });
    }

    // Search endpoints MUST be before :id route
    @Get('search/customers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Search customers for autocomplete' })
    async searchCustomers(@Query('q') q: string) {
        return this.invoiceService.searchCustomers(q);
    }

    @Get('search/products')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Search products for invoice line items' })
    async searchProducts(@Query('q') q: string) {
        return this.invoiceService.searchProducts(q);
    }

    @Get('search/repairs')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Search repair services for invoice line items' })
    async searchRepairs(@Query('q') q: string) {
        return this.invoiceService.searchRepairServices(q);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get single invoice by ID' })
    async getInvoice(@Param('id') id: string) {
        return this.invoiceService.getInvoiceById(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a draft invoice' })
    async updateInvoice(
        @Param('id') id: string,
        @Body() dto: UpdateInvoiceDto,
    ) {
        return this.invoiceService.updateInvoice(id, dto);
    }

    @Post(':id/pay')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mark invoice as paid' })
    async markAsPaid(
        @Param('id') id: string,
        @Body('paymentMethod') paymentMethod: 'CASH' | 'CARD' | 'TRANSFER',
    ) {
        return this.invoiceService.markInvoiceAsPaid(id, paymentMethod);
    }

    @Post(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel invoice' })
    async cancelInvoice(@Param('id') id: string) {
        return this.invoiceService.cancelInvoice(id);
    }

    @Post(':id/send-email')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Send invoice email to customer' })
    async sendEmail(@Param('id') id: string) {
        await this.invoiceService.sendInvoiceEmail(id);
        return { success: true, message: 'Invoice email sent' };
    }

    @Get(':id/pdf')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download invoice PDF' })
    async downloadInvoicePdf(
        @Param('id') id: string,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.invoiceService.generateWalkInInvoicePdf(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.status(HttpStatus.OK).send(pdfBuffer);
    }

}
