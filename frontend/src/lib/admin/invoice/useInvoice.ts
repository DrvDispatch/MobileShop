/**
 * Invoice Admin Hooks
 * 
 * Complete business logic for admin invoice page.
 * Handles invoice creation, listing, settings, and repair picker.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// ============================================
// TYPES
// ============================================

export interface InvoiceSettings {
    companyName: string;
    companyAddress: {
        line1: string;
        line2?: string;
        city: string;
        postalCode: string;
        country: string;
    };
    vatNumber: string;
    phone: string;
    email: string;
    website?: string;
    bankAccount?: string;
    bankName?: string;
    invoicePrefix: string;
    invoiceFooter: string;
    logoUrl?: string;
}

export interface InvoiceItem {
    id?: string;
    type: 'PRODUCT' | 'REPAIR' | 'CUSTOM';
    productId?: string;
    repairId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    type: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAddress?: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    paymentMethod: string;
    paidAt?: string;
    createdAt: string;
    items: InvoiceItem[];
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stockQty: number;
}

export interface RepairService {
    id: string;
    name: string;
    price: number;
    deviceId?: string;
    serviceId?: string;
}

export interface DeviceType {
    id: string;
    name: string;
    slug: string;
    icon?: string;
}

export interface Brand {
    id: string;
    name: string;
    slug: string;
    logo?: string;
}

export interface Device {
    id: string;
    name: string;
    slug: string;
    image?: string;
}

export interface RepairOption {
    id: string;
    deviceId: string;
    serviceId: string;
    price?: number;
    priceText?: string;
    duration?: string;
    service: {
        id: string;
        name: string;
        slug: string;
        icon?: string;
    };
}

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'PENDING';

// ============================================
// STATUS CONFIGS
// ============================================

export const INVOICE_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
    DRAFT: { label: 'Concept', style: 'bg-zinc-100 text-zinc-700' },
    SENT: { label: 'Verzonden', style: 'bg-blue-100 text-blue-700' },
    PAID: { label: 'Betaald', style: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Geannuleerd', style: 'bg-red-100 text-red-700' },
};

export const PAYMENT_METHODS = [
    { value: 'CASH' as const, label: 'Contant' },
    { value: 'CARD' as const, label: 'Kaart' },
    { value: 'TRANSFER' as const, label: 'Overschr.' },
    { value: 'PENDING' as const, label: 'Later' },
];

// ============================================
// CREATE INVOICE HOOK
// ============================================

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

// ============================================
// INVOICE LIST HOOK
// ============================================

export interface UseInvoiceListReturn {
    invoices: Invoice[];
    loading: boolean;
    search: string;
    setSearch: (s: string) => void;
    statusFilter: string;
    setStatusFilter: (s: string) => void;
    fetchInvoices: () => Promise<void>;
    downloadPdf: (id: string) => Promise<void>;
    getStatusConfig: (status: string) => { label: string; style: string };
}

export function useInvoiceList(): UseInvoiceListReturn {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const data = await adminFetch<{ invoices: Invoice[] }>(`/api/invoice?${params}`);
            setInvoices(data.invoices || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        fetchInvoices();
    }, [search, statusFilter, fetchInvoices]);

    const downloadPdf = useCallback(async (id: string) => {
        const token = localStorage.getItem('adminAccessToken');
        const res = await fetch(`/api/invoice/${id}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            // Get the raw array buffer and create blob with explicit type
            const arrayBuffer = await res.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Create a download link and trigger it
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            window.URL.revokeObjectURL(url);
        } else {
            console.error('Failed to download PDF:', res.status, res.statusText);
        }
    }, []);

    const getStatusConfig = useCallback((status: string) => {
        return INVOICE_STATUS_CONFIG[status] || { label: status, style: '' };
    }, []);

    return {
        invoices,
        loading,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        fetchInvoices,
        downloadPdf,
        getStatusConfig,
    };
}

// ============================================
// INVOICE SETTINGS HOOK
// ============================================

export interface UseInvoiceSettingsReturn {
    settings: InvoiceSettings;
    setSettings: React.Dispatch<React.SetStateAction<InvoiceSettings>>;
    updateField: <K extends keyof InvoiceSettings>(field: K, value: InvoiceSettings[K]) => void;
    updateAddressField: (field: keyof InvoiceSettings['companyAddress'], value: string) => void;
    loading: boolean;
    saving: boolean;
    message: { type: 'success' | 'error'; text: string } | null;
    setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
    fetchSettings: () => Promise<void>;
    saveSettings: () => Promise<void>;
}

const defaultSettings: InvoiceSettings = {
    companyName: '',
    companyAddress: { line1: '', city: '', postalCode: '', country: 'BE' },
    vatNumber: '',
    phone: '',
    email: '',
    website: '',
    bankAccount: '',
    bankName: '',
    invoicePrefix: 'INV',
    invoiceFooter: '',
};

export function useInvoiceSettings(): UseInvoiceSettingsReturn {
    const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminFetch<InvoiceSettings>('/api/invoice/settings');
            setSettings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateField = useCallback(<K extends keyof InvoiceSettings>(field: K, value: InvoiceSettings[K]) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    }, []);

    const updateAddressField = useCallback((field: keyof InvoiceSettings['companyAddress'], value: string) => {
        setSettings(prev => ({
            ...prev,
            companyAddress: { ...prev.companyAddress, [field]: value },
        }));
    }, []);

    const saveSettings = useCallback(async () => {
        setSaving(true);
        try {
            await adminFetch('/api/invoice/settings', {
                method: 'PUT',
                body: JSON.stringify(settings),
            });
            setMessage({ type: 'success', text: 'Instellingen opgeslagen!' });
        } catch {
            setMessage({ type: 'error', text: 'Fout bij opslaan instellingen' });
        } finally {
            setSaving(false);
        }
    }, [settings]);

    return {
        settings,
        setSettings,
        updateField,
        updateAddressField,
        loading,
        saving,
        message,
        setMessage,
        fetchSettings,
        saveSettings,
    };
}

// ============================================
// REPAIR PICKER HOOK
// ============================================

export interface UseRepairPickerReturn {
    step: number;
    loading: boolean;

    deviceTypes: DeviceType[];
    brands: Brand[];
    devices: Device[];
    repairs: RepairOption[];

    selectedDeviceType: DeviceType | null;
    selectedBrand: Brand | null;
    selectedDevice: Device | null;

    handleSelectDeviceType: (dt: DeviceType) => void;
    handleSelectBrand: (brand: Brand) => void;
    handleSelectDevice: (device: Device) => void;
    handleSelectRepair: (repair: RepairOption) => RepairService;

    goBack: () => void;
    getBreadcrumb: () => string;
    getStepTitle: () => string;
}

export function useRepairPicker(): UseRepairPickerReturn {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [repairs, setRepairs] = useState<RepairOption[]>([]);

    const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    // Fetch device types on mount
    useEffect(() => {
        const fetchDeviceTypes = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/repairs/device-types');
                if (res.ok) setDeviceTypes(await res.json());
            } catch (e) {
                console.error(e);
                setDeviceTypes([
                    { id: '1', name: 'Smartphone', slug: 'smartphone' },
                    { id: '2', name: 'Tablet', slug: 'tablet' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchDeviceTypes();
    }, []);

    const fetchBrands = useCallback(async (deviceTypeSlug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/brands?deviceType=${deviceTypeSlug}`);
            if (res.ok) setBrands(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDevices = useCallback(async (brandSlug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/devices?brand=${brandSlug}`);
            if (res.ok) setDevices(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRepairs = useCallback(async (deviceSlug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/services/${deviceSlug}`);
            if (res.ok) setRepairs(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSelectDeviceType = useCallback((dt: DeviceType) => {
        setSelectedDeviceType(dt);
        fetchBrands(dt.slug);
        setStep(1);
    }, [fetchBrands]);

    const handleSelectBrand = useCallback((brand: Brand) => {
        setSelectedBrand(brand);
        fetchDevices(brand.slug);
        setStep(2);
    }, [fetchDevices]);

    const handleSelectDevice = useCallback((device: Device) => {
        setSelectedDevice(device);
        fetchRepairs(device.slug);
        setStep(3);
    }, [fetchRepairs]);

    const handleSelectRepair = useCallback((repair: RepairOption): RepairService => {
        return {
            id: repair.id,
            name: `${selectedBrand?.name} ${selectedDevice?.name} - ${repair.service?.name}`,
            price: Number(repair.price) || 0,
            deviceId: repair.deviceId,
            serviceId: repair.serviceId,
        };
    }, [selectedBrand, selectedDevice]);

    const goBack = useCallback(() => {
        if (step > 0) setStep(step - 1);
    }, [step]);

    const getBreadcrumb = useCallback(() => {
        const parts = [];
        if (selectedDeviceType) parts.push(selectedDeviceType.name);
        if (selectedBrand) parts.push(selectedBrand.name);
        if (selectedDevice) parts.push(selectedDevice.name);
        return parts.join(' → ');
    }, [selectedDeviceType, selectedBrand, selectedDevice]);

    const getStepTitle = useCallback(() => {
        switch (step) {
            case 0: return 'Kies type toestel';
            case 1: return 'Kies merk';
            case 2: return 'Kies toestel';
            case 3: return 'Kies reparatie';
            default: return '';
        }
    }, [step]);

    return {
        step,
        loading,
        deviceTypes,
        brands,
        devices,
        repairs,
        selectedDeviceType,
        selectedBrand,
        selectedDevice,
        handleSelectDeviceType,
        handleSelectBrand,
        handleSelectDevice,
        handleSelectRepair,
        goBack,
        getBreadcrumb,
        getStepTitle,
    };
}
