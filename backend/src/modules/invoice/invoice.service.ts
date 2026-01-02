/**
 * Invoice Service (Facade)
 * 
 * Provides unified interface for invoice operations.
 * Delegates to specialized services for actual implementation.
 * 
 * This facade maintains backward compatibility with the controller.
 */

import { Injectable } from '@nestjs/common';
import { InvoiceSettingsService, InvoiceSettings } from './invoice-settings.service';
import { InvoicePdfService, InvoiceData } from './invoice-pdf.service';
import { InvoiceCrudService } from './invoice-crud.service';

// Re-export types for backward compatibility
export type { InvoiceSettings } from './invoice-settings.service';
export type { InvoiceData } from './invoice-pdf.service';

@Injectable()
export class InvoiceService {
    constructor(
        private readonly settingsService: InvoiceSettingsService,
        private readonly pdfService: InvoicePdfService,
        private readonly crudService: InvoiceCrudService,
    ) { }

    // ============================================
    // SETTINGS - Delegates to InvoiceSettingsService
    // ============================================

    getInvoiceSettings(): Promise<InvoiceSettings> {
        return this.settingsService.getInvoiceSettings();
    }

    updateInvoiceSettings(settings: Partial<InvoiceSettings>): Promise<void> {
        return this.settingsService.updateInvoiceSettings(settings);
    }

    // ============================================
    // PDF GENERATION - Delegates to InvoicePdfService
    // ============================================

    generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
        return this.pdfService.generateInvoicePdf(data);
    }

    generateInvoiceForOrder(orderId: string): Promise<Buffer> {
        return this.pdfService.generateInvoiceForOrder(orderId);
    }

    generateWalkInInvoicePdf(invoiceId: string): Promise<Buffer> {
        return this.pdfService.generateWalkInInvoicePdf(invoiceId);
    }

    verifyOrderOwnership(orderId: string, userId?: string, userEmail?: string): Promise<boolean> {
        return this.pdfService.verifyOrderOwnership(orderId, userId, userEmail);
    }

    // ============================================
    // CRUD OPERATIONS - Delegates to InvoiceCrudService
    // ============================================

    generateInvoiceNumber(): Promise<string> {
        return this.crudService.generateInvoiceNumber();
    }

    createInvoice(data: Parameters<InvoiceCrudService['createInvoice']>[0]) {
        return this.crudService.createInvoice(data);
    }

    getInvoices(options: Parameters<InvoiceCrudService['getInvoices']>[0]) {
        return this.crudService.getInvoices(options);
    }

    getInvoiceById(id: string) {
        return this.crudService.getInvoiceById(id);
    }

    updateInvoice(id: string, data: Parameters<InvoiceCrudService['updateInvoice']>[1]) {
        return this.crudService.updateInvoice(id, data);
    }

    markInvoiceAsPaid(id: string, paymentMethod: 'CASH' | 'CARD' | 'TRANSFER') {
        return this.crudService.markInvoiceAsPaid(id, paymentMethod);
    }

    cancelInvoice(id: string) {
        return this.crudService.cancelInvoice(id);
    }

    sendInvoiceEmail(invoiceId: string): Promise<boolean> {
        return this.crudService.sendInvoiceEmail(invoiceId);
    }

    // ============================================
    // SEARCH HELPERS - Delegates to InvoiceCrudService
    // ============================================

    searchCustomers(query: string) {
        return this.crudService.searchCustomers(query);
    }

    searchProducts(query: string) {
        return this.crudService.searchProducts(query);
    }

    searchRepairServices(query: string) {
        return this.crudService.searchRepairServices(query);
    }
}
