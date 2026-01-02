/**
 * Invoice Create Hook
 * 
 * Business logic for creating walk-in invoices.
 * Handles customer selection, item management, and submission.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';
import type {
    InvoiceItem,
    Invoice,
    Customer,
    Product,
    RepairService,
    PaymentMethod
} from './types';

export interface UseInvoiceCreateReturn {
    // Customer state
    customerType: 'existing' | 'new';
    setCustomerType: (type: 'existing' | 'new') => void;
    customerSearch: string;
    setCustomerSearch: (s: string) => void;
    customerResults: Customer[];
    selectedCustomer: Customer | null;
    customerName: string;
    setCustomerName: (s: string) => void;
    customerEmail: string;
    setCustomerEmail: (s: string) => void;
    customerPhone: string;
    setCustomerPhone: (s: string) => void;
    customerAddress: string;
    setCustomerAddress: (s: string) => void;
    selectCustomer: (customer: Customer) => void;

    // Items state
    items: InvoiceItem[];
    addProductItem: (product: Product) => void;
    addRepairItem: (repair: RepairService) => void;
    addCustomItem: () => void;
    updateItem: (index: number, field: keyof InvoiceItem, value: string | number) => void;
    removeItem: (index: number) => void;

    // Product search
    productSearch: string;
    setProductSearch: (s: string) => void;
    productResults: Product[];

    // Repair picker
    showRepairPicker: boolean;
    setShowRepairPicker: (show: boolean) => void;

    // Payment and notes
    paymentMethod: PaymentMethod;
    setPaymentMethod: (method: PaymentMethod) => void;
    discountAmount: number;
    setDiscountAmount: (amount: number) => void;
    notes: string;
    setNotes: (notes: string) => void;

    // Calculations
    subtotal: number;
    taxAmount: number;
    total: number;

    // Submission
    saving: boolean;
    message: { type: 'success' | 'error'; text: string } | null;
    setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
    handleSubmit: (markAsPaid: boolean) => Promise<void>;
    resetForm: () => void;

    // Validation
    isValid: boolean;
}

export function useInvoiceCreate(): UseInvoiceCreateReturn {
    // Customer state
    const [customerType, setCustomerType] = useState<'existing' | 'new'>('new');
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

    // Items state
    const [items, setItems] = useState<InvoiceItem[]>([]);

    // Product search
    const [productSearch, setProductSearch] = useState('');
    const [productResults, setProductResults] = useState<Product[]>([]);

    // Repair picker
    const [showRepairPicker, setShowRepairPicker] = useState(false);

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PENDING');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [notes, setNotes] = useState('');

    // Submission
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Search customers
    useEffect(() => {
        if (customerSearch.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const data = await adminFetch<Customer[]>(
                        `/api/invoice/search/customers?q=${encodeURIComponent(customerSearch)}`
                    );
                    setCustomerResults(data);
                } catch (e) {
                    console.error(e);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setCustomerResults([]);
        }
    }, [customerSearch]);

    // Search products
    useEffect(() => {
        if (productSearch.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const data = await adminFetch<Product[]>(
                        `/api/invoice/search/products?q=${encodeURIComponent(productSearch)}`
                    );
                    setProductResults(data);
                } catch (e) {
                    console.error(e);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setProductResults([]);
        }
    }, [productSearch]);

    // Select customer
    const selectCustomer = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerName(customer.name);
        setCustomerEmail(customer.email);
        setCustomerPhone(customer.phone || '');
        setCustomerSearch('');
        setCustomerResults([]);
    }, []);

    // Add product item
    const addProductItem = useCallback((product: Product) => {
        setItems(prev => [...prev, {
            type: 'PRODUCT',
            productId: product.id,
            description: product.name,
            quantity: 1,
            unitPrice: Number(product.price),
            totalPrice: Number(product.price),
        }]);
        setProductSearch('');
        setProductResults([]);
    }, []);

    // Add repair item
    const addRepairItem = useCallback((repair: RepairService) => {
        setItems(prev => [...prev, {
            type: 'REPAIR',
            repairId: repair.id,
            description: repair.name,
            quantity: 1,
            unitPrice: repair.price,
            totalPrice: repair.price,
        }]);
    }, []);

    // Add custom item
    const addCustomItem = useCallback(() => {
        setItems(prev => [...prev, {
            type: 'CUSTOM',
            description: '',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
        }]);
    }, []);

    // Update item
    const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: string | number) => {
        setItems(prev => {
            const updated = [...prev];
            const item = updated[index];
            if (field === 'description') {
                item.description = value as string;
            } else if (field === 'quantity') {
                item.quantity = value as number;
                item.totalPrice = item.quantity * item.unitPrice;
            } else if (field === 'unitPrice') {
                item.unitPrice = value as number;
                item.totalPrice = item.quantity * item.unitPrice;
            }
            return updated;
        });
    }, []);

    // Remove item
    const removeItem = useCallback((index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Calculations
    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.totalPrice, 0), [items]);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount - (taxableAmount / 1.21);
    const total = taxableAmount;

    // Validation
    const isValid = customerName.length > 0 && customerEmail.length > 0 && items.length > 0;

    // Reset form
    const resetForm = useCallback(() => {
        setItems([]);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setCustomerAddress('');
        setSelectedCustomer(null);
        setDiscountAmount(0);
        setNotes('');
    }, []);

    // Handle submit
    const handleSubmit = useCallback(async (markAsPaid: boolean) => {
        if (!isValid) {
            setMessage({ type: 'error', text: 'Vul alle verplichte velden in en voeg minimaal één item toe' });
            return;
        }

        setSaving(true);
        try {
            const invoice = await adminFetch<Invoice>('/api/invoice', {
                method: 'POST',
                body: JSON.stringify({
                    customerName,
                    customerEmail,
                    customerPhone,
                    customerAddress,
                    userId: selectedCustomer?.id,
                    items: items.map(i => ({
                        type: i.type,
                        productId: i.productId,
                        repairId: i.repairId,
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                    discountAmount,
                    notes,
                    paymentMethod: markAsPaid ? paymentMethod : 'PENDING',
                    markAsPaid,
                }),
            });

            setMessage({ type: 'success', text: `Factuur ${invoice.invoiceNumber} aangemaakt!` });

            // Auto-download PDF
            try {
                const token = localStorage.getItem('adminAccessToken');
                const pdfRes = await fetch(`/api/invoice/${invoice.id}/pdf`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (pdfRes.ok) {
                    const blob = await pdfRes.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `factuur-${invoice.invoiceNumber}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                }
            } catch (pdfError) {
                console.error('PDF download failed:', pdfError);
            }

            resetForm();
        } catch (error: unknown) {
            console.error(error);
            setMessage({ type: 'error', text: 'Fout bij aanmaken factuur' });
        } finally {
            setSaving(false);
        }
    }, [isValid, customerName, customerEmail, customerPhone, customerAddress, selectedCustomer, items, discountAmount, notes, paymentMethod, resetForm]);

    return {
        customerType,
        setCustomerType,
        customerSearch,
        setCustomerSearch,
        customerResults,
        selectedCustomer,
        customerName,
        setCustomerName,
        customerEmail,
        setCustomerEmail,
        customerPhone,
        setCustomerPhone,
        customerAddress,
        setCustomerAddress,
        selectCustomer,
        items,
        addProductItem,
        addRepairItem,
        addCustomItem,
        updateItem,
        removeItem,
        productSearch,
        setProductSearch,
        productResults,
        showRepairPicker,
        setShowRepairPicker,
        paymentMethod,
        setPaymentMethod,
        discountAmount,
        setDiscountAmount,
        notes,
        setNotes,
        subtotal,
        taxAmount,
        total,
        saving,
        message,
        setMessage,
        handleSubmit,
        resetForm,
        isValid,
    };
}
