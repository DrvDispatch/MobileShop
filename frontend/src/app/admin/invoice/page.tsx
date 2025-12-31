"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Save,
    Eye,
    Building2,
    Phone,
    Mail,
    Globe,
    CreditCard,
    MapPin,
    Hash,
    Loader2,
    Download,
    RefreshCw,
    Plus,
    Search,
    Trash2,
    Send,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Package,
    Wrench,
    X,
    ChevronLeft,
    Smartphone,
    Tablet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// All API calls use relative paths to go through Next.js proxy for tenant resolution

// ============================================
// TYPES
// ============================================

interface InvoiceSettings {
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

interface InvoiceItem {
    id?: string;
    type: "PRODUCT" | "REPAIR" | "CUSTOM";
    productId?: string;
    repairId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    type: string;
    status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
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

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stockQty: number;
}

interface RepairService {
    id: string;
    name: string;
    price: number;
    deviceId?: string;
    serviceId?: string;
}

interface DeviceType {
    id: string;
    name: string;
    slug: string;
    icon?: string;
}

interface Brand {
    id: string;
    name: string;
    slug: string;
    logo?: string;
}

interface Device {
    id: string;
    name: string;
    slug: string;
    image?: string;
}

interface RepairOption {
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminInvoicePage() {
    const [activeTab, setActiveTab] = useState<"create" | "list" | "settings">("create");

    const tabs = [
        { id: "create" as const, label: "Nieuwe Factuur", icon: Plus },
        { id: "list" as const, label: "Facturen", icon: FileText },
        { id: "settings" as const, label: "Instellingen", icon: Building2 },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Facturatie</h1>
                    <p className="text-sm text-zinc-500">Maak en beheer facturen voor winkelklanten</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-zinc-200 pb-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === tab.id
                                ? "bg-zinc-900 text-white"
                                : "text-zinc-600 hover:bg-zinc-100"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === "create" && <CreateInvoiceTab />}
            {activeTab === "list" && <InvoiceListTab />}
            {activeTab === "settings" && <SettingsTab />}
        </div>
    );
}

// ============================================
// CREATE INVOICE TAB
// ============================================

function CreateInvoiceTab() {
    const [customerType, setCustomerType] = useState<"existing" | "new">("new");
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerResults, setCustomerResults] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");

    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [notes, setNotes] = useState("");

    const [productSearch, setProductSearch] = useState("");
    const [productResults, setProductResults] = useState<Product[]>([]);

    const [repairSearch, setRepairSearch] = useState("");
    const [repairResults, setRepairResults] = useState<RepairService[]>([]);
    const [showRepairPicker, setShowRepairPicker] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER" | "PENDING">("PENDING");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Search customers
    useEffect(() => {
        if (customerSearch.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const token = localStorage.getItem("adminAccessToken");
                    const res = await fetch(`/api/invoice/search/customers?q=${encodeURIComponent(customerSearch)}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) setCustomerResults(await res.json());
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
                    const token = localStorage.getItem("adminAccessToken");
                    const res = await fetch(`/api/invoice/search/products?q=${encodeURIComponent(productSearch)}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) setProductResults(await res.json());
                } catch (e) {
                    console.error(e);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setProductResults([]);
        }
    }, [productSearch]);

    // Search repairs
    useEffect(() => {
        if (repairSearch.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const token = localStorage.getItem("adminAccessToken");
                    const res = await fetch(`/api/invoice/search/repairs?q=${encodeURIComponent(repairSearch)}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) setRepairResults(await res.json());
                } catch (e) {
                    console.error(e);
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setRepairResults([]);
        }
    }, [repairSearch]);

    const selectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerName(customer.name);
        setCustomerEmail(customer.email);
        setCustomerPhone(customer.phone || "");
        setCustomerSearch("");
        setCustomerResults([]);
    };

    const addProductItem = (product: Product) => {
        setItems([...items, {
            type: "PRODUCT",
            productId: product.id,
            description: product.name,
            quantity: 1,
            unitPrice: Number(product.price),
            totalPrice: Number(product.price),
        }]);
        setProductSearch("");
        setProductResults([]);
    };

    const addRepairItem = (repair: RepairService) => {
        setItems([...items, {
            type: "REPAIR",
            repairId: repair.id,
            description: repair.name,
            quantity: 1,
            unitPrice: repair.price,
            totalPrice: repair.price,
        }]);
        setRepairSearch("");
        setRepairResults([]);
    };

    const addCustomItem = () => {
        setItems([...items, {
            type: "CUSTOM",
            description: "",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
        }]);
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const updated = [...items];
        (updated[index] as any)[field] = value;
        if (field === "quantity" || field === "unitPrice") {
            updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
        }
        setItems(updated);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount - (taxableAmount / 1.21);
    const total = taxableAmount;

    const handleSubmit = async (markAsPaid: boolean) => {
        if (!customerName || !customerEmail || items.length === 0) {
            setMessage({ type: "error", text: "Vul alle verplichte velden in en voeg minimaal één item toe" });
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`/api/invoice`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
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
                    paymentMethod: markAsPaid ? paymentMethod : "PENDING",
                    markAsPaid,
                }),
            });

            if (res.ok) {
                const invoice = await res.json();
                setMessage({ type: "success", text: `Factuur ${invoice.invoiceNumber} aangemaakt!` });

                // Auto-download PDF
                try {
                    const pdfRes = await fetch(`/api/invoice/${invoice.id}/pdf`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (pdfRes.ok) {
                        const blob = await pdfRes.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `factuur-${invoice.invoiceNumber}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                    }
                } catch (pdfError) {
                    console.error("PDF download failed:", pdfError);
                }

                // Reset form
                setItems([]);
                setCustomerName("");
                setCustomerEmail("");
                setCustomerPhone("");
                setCustomerAddress("");
                setSelectedCustomer(null);
                setDiscountAmount(0);
                setNotes("");
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Invoice creation error:", errorData);
                throw new Error(errorData.message || "Failed to create invoice");
            }
        } catch (error: any) {
            console.error(error);
            setMessage({ type: "error", text: "Fout bij aanmaken factuur" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-semibold">Klantgegevens</h2>
                        </div>

                        <div className="flex gap-4 mb-4">
                            <button
                                onClick={() => setCustomerType("new")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${customerType === "new" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}
                            >
                                Nieuwe klant
                            </button>
                            <button
                                onClick={() => setCustomerType("existing")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${customerType === "existing" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}
                            >
                                Bestaande klant
                            </button>
                        </div>

                        {customerType === "existing" && (
                            <div className="mb-4 relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <Input
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        placeholder="Zoek op naam, email of telefoon..."
                                        className="pl-10"
                                    />
                                </div>
                                {customerResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        {customerResults.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => selectCustomer(c)}
                                                className="w-full px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100 last:border-0"
                                            >
                                                <div className="font-medium">{c.name}</div>
                                                <div className="text-sm text-zinc-500">{c.email}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-700 mb-1 block">Naam *</label>
                                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-700 mb-1 block">Email *</label>
                                <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-700 mb-1 block">Telefoon</label>
                                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-700 mb-1 block">Adres</label>
                                <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-purple-600" />
                                <h2 className="text-lg font-semibold">Factuurregels</h2>
                            </div>
                            <button
                                onClick={addCustomItem}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700"
                            >
                                <Plus className="w-4 h-4" /> Vrije regel
                            </button>
                        </div>

                        {/* Product Search */}
                        <div className="mb-4 relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <Input
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="Zoek product om toe te voegen..."
                                    className="pl-10"
                                />
                            </div>
                            {productResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {productResults.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => addProductItem(p)}
                                            className="w-full px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100 last:border-0 flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="font-medium">{p.name}</div>
                                                <div className="text-sm text-zinc-500">SKU: {p.sku} • Voorraad: {p.stockQty}</div>
                                            </div>
                                            <div className="font-semibold">€{Number(p.price).toFixed(2)}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Repair Picker Button */}
                        <div className="mb-4">
                            <button
                                onClick={() => setShowRepairPicker(true)}
                                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-zinc-300 rounded-lg text-zinc-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors w-full justify-center"
                            >
                                <Wrench className="w-5 h-5" />
                                <span className="font-medium">Reparatie toevoegen</span>
                            </button>
                        </div>

                        {/* Repair Picker Modal */}
                        {showRepairPicker && (
                            <RepairPickerModal
                                onSelect={(repair) => {
                                    addRepairItem(repair);
                                    setShowRepairPicker(false);
                                }}
                                onClose={() => setShowRepairPicker(false)}
                            />
                        )}

                        {/* Items Table */}
                        {items.length > 0 ? (
                            <div className="border border-zinc-200 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-zinc-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Omschrijving</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500">Aantal</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Prijs</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Totaal</th>
                                            <th className="px-4 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="border-t border-zinc-100">
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.type === "PRODUCT" ? "bg-blue-100 text-blue-700" :
                                                        item.type === "REPAIR" ? "bg-orange-100 text-orange-700" :
                                                            "bg-zinc-100 text-zinc-700"
                                                        }`}>
                                                        {item.type === "PRODUCT" ? "Product" : item.type === "REPAIR" ? "Reparatie" : "Vrij"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.type === "CUSTOM" ? (
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                                                            className="h-8"
                                                        />
                                                    ) : (
                                                        <span>{item.description}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                                                        className="h-8 w-16 text-center"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.type === "CUSTOM" ? (
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                                                            className="h-8 w-24 text-right"
                                                        />
                                                    ) : (
                                                        <span className="text-right block">€{item.unitPrice.toFixed(2)}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium">€{item.totalPrice.toFixed(2)}</td>
                                                <td className="px-4 py-2">
                                                    <button onClick={() => removeItem(idx)} className="p-1 hover:bg-red-50 rounded text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-zinc-500">
                                Zoek een product of voeg een vrije regel toe
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-zinc-200 p-6 sticky top-6">
                        <h3 className="font-semibold mb-4">Overzicht</h3>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Subtotaal</span>
                                <span>€{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500">Korting</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                    className="w-24 h-8 text-right"
                                />
                            </div>
                            <div className="flex justify-between text-zinc-500">
                                <span>BTW 21% (incl.)</span>
                                <span>€{taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-zinc-200 pt-2 mt-2">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Totaal</span>
                                    <span>€{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="text-sm font-medium text-zinc-700 mb-2 block">Betaalmethode</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: "CASH" as const, label: "Contant" },
                                    { value: "CARD" as const, label: "Kaart" },
                                    { value: "TRANSFER" as const, label: "Overschr." },
                                    { value: "PENDING" as const, label: "Later" },
                                ].map((m) => (
                                    <button
                                        key={m.value}
                                        onClick={() => setPaymentMethod(m.value)}
                                        className={`px-3 py-2 text-sm rounded-lg ${paymentMethod === m.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Notities</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                                placeholder="Optionele notities..."
                            />
                        </div>

                        <div className="mt-6 space-y-2">
                            <Button
                                onClick={() => handleSubmit(true)}
                                disabled={saving || items.length === 0}
                                className="w-full bg-zinc-900 hover:bg-zinc-800"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Aanmaken & Betaald
                            </Button>
                            <Button
                                onClick={() => handleSubmit(false)}
                                disabled={saving || items.length === 0}
                                variant="outline"
                                className="w-full"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                Opslaan als concept
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// INVOICE LIST TAB
// ============================================

function InvoiceListTab() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        fetchInvoices();
    }, [search, statusFilter]);

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetch(`/api/invoice?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setInvoices(data.invoices || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const downloadPdf = async (id: string) => {
        const token = localStorage.getItem("adminAccessToken");
        const res = await fetch(`/api/invoice/${id}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            DRAFT: "bg-zinc-100 text-zinc-700",
            SENT: "bg-blue-100 text-blue-700",
            PAID: "bg-green-100 text-green-700",
            CANCELLED: "bg-red-100 text-red-700",
        };
        const labels: Record<string, string> = {
            DRAFT: "Concept",
            SENT: "Verzonden",
            PAID: "Betaald",
            CANCELLED: "Geannuleerd",
        };
        return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || ""}`}>{labels[status] || status}</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Zoeken op factuurnummer, klant..."
                        className="pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-zinc-200 rounded-lg"
                >
                    <option value="">Alle statussen</option>
                    <option value="DRAFT">Concept</option>
                    <option value="SENT">Verzonden</option>
                    <option value="PAID">Betaald</option>
                    <option value="CANCELLED">Geannuleerd</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-zinc-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Factuurnummer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Klant</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Bedrag</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Datum</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                                <td className="px-4 py-3 font-mono text-sm">{inv.invoiceNumber}</td>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{inv.customerName}</div>
                                    <div className="text-sm text-zinc-500">{inv.customerEmail}</div>
                                </td>
                                <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                                <td className="px-4 py-3 text-right font-medium">€{Number(inv.total).toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-zinc-500">
                                    {new Date(inv.createdAt).toLocaleDateString("nl-BE")}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => downloadPdf(inv.id)} className="p-1.5 hover:bg-zinc-100 rounded">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                                    Geen facturen gevonden
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================
// SETTINGS TAB (existing functionality)
// ============================================

function SettingsTab() {
    const [settings, setSettings] = useState<InvoiceSettings>({
        companyName: "",
        companyAddress: { line1: "", city: "", postalCode: "", country: "BE" },
        vatNumber: "",
        phone: "",
        email: "",
        website: "",
        bankAccount: "",
        bankName: "",
        invoicePrefix: "INV",
        invoiceFooter: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`/api/invoice/settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setSettings(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`/api/invoice/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setMessage({ type: "success", text: "Instellingen opgeslagen!" });
            } else {
                throw new Error();
            }
        } catch {
            setMessage({ type: "error", text: "Fout bij opslaan instellingen" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
    }

    return (
        <div className="space-y-6">
            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Opslaan
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Info */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Bedrijfsgegevens</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Bedrijfsnaam</label>
                            <Input value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">BTW Nummer</label>
                            <Input value={settings.vatNumber} onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Factuur Prefix</label>
                            <Input value={settings.invoicePrefix} onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Adres</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Adresregel 1</label>
                            <Input value={settings.companyAddress.line1} onChange={(e) => setSettings({ ...settings, companyAddress: { ...settings.companyAddress, line1: e.target.value } })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-700 mb-1 block">Postcode</label>
                                <Input value={settings.companyAddress.postalCode} onChange={(e) => setSettings({ ...settings, companyAddress: { ...settings.companyAddress, postalCode: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-700 mb-1 block">Stad</label>
                                <Input value={settings.companyAddress.city} onChange={(e) => setSettings({ ...settings, companyAddress: { ...settings.companyAddress, city: e.target.value } })} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Phone className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Contactgegevens</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Telefoon</label>
                            <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Email</label>
                            <Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Website</label>
                            <Input value={settings.website || ""} onChange={(e) => setSettings({ ...settings, website: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Bank */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Bankgegevens</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">IBAN</label>
                            <Input value={settings.bankAccount || ""} onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Banknaam</label>
                            <Input value={settings.bankName || ""} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Factuur Voettekst</h2>
                    </div>
                    <textarea
                        value={settings.invoiceFooter}
                        onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg"
                        placeholder="Bedankt voor uw aankoop!..."
                    />
                </div>
            </div>
        </div>
    );
}

// ============================================
// REPAIR PICKER MODAL
// ============================================

interface RepairPickerModalProps {
    onSelect: (repair: RepairService) => void;
    onClose: () => void;
}

function RepairPickerModal({ onSelect, onClose }: RepairPickerModalProps) {
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
        fetchDeviceTypes();
    }, []);

    const fetchDeviceTypes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/device-types`);
            if (res.ok) setDeviceTypes(await res.json());
        } catch (e) {
            console.error(e);
            setDeviceTypes([
                { id: "1", name: "Smartphone", slug: "smartphone" },
                { id: "2", name: "Tablet", slug: "tablet" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrands = async (deviceTypeSlug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/brands?deviceType=${deviceTypeSlug}`);
            if (res.ok) setBrands(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchDevices = async (brandSlug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/devices?brand=${brandSlug}`);
            if (res.ok) setDevices(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchRepairs = async (deviceSlug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/services/${deviceSlug}`);
            if (res.ok) setRepairs(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDeviceType = (dt: DeviceType) => {
        setSelectedDeviceType(dt);
        fetchBrands(dt.slug);
        setStep(1);
    };

    const handleSelectBrand = (brand: Brand) => {
        setSelectedBrand(brand);
        fetchDevices(brand.slug);
        setStep(2);
    };

    const handleSelectDevice = (device: Device) => {
        setSelectedDevice(device);
        fetchRepairs(device.slug);
        setStep(3);
    };

    const handleSelectRepair = (repair: RepairOption) => {
        onSelect({
            id: repair.id,
            name: `${selectedBrand?.name} ${selectedDevice?.name} - ${repair.service?.name}`,
            price: Number(repair.price) || 0,
            deviceId: repair.deviceId,
            serviceId: repair.serviceId,
        });
    };

    const goBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const getBreadcrumb = () => {
        const parts = [];
        if (selectedDeviceType) parts.push(selectedDeviceType.name);
        if (selectedBrand) parts.push(selectedBrand.name);
        if (selectedDevice) parts.push(selectedDevice.name);
        return parts.join(" → ");
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                    <div className="flex items-center gap-3">
                        {step > 0 && (
                            <button onClick={goBack} className="p-2 hover:bg-zinc-100 rounded-lg">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-semibold">
                                {step === 0 && "Kies type toestel"}
                                {step === 1 && "Kies merk"}
                                {step === 2 && "Kies toestel"}
                                {step === 3 && "Kies reparatie"}
                            </h2>
                            {step > 0 && (
                                <p className="text-sm text-zinc-500">{getBreadcrumb()}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : (
                        <>
                            {/* Step 0: Device Types */}
                            {step === 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {deviceTypes.map((dt) => (
                                        <button
                                            key={dt.id}
                                            onClick={() => handleSelectDeviceType(dt)}
                                            className="bg-zinc-50 rounded-xl border-2 border-zinc-200 p-6 text-center hover:border-purple-400 hover:bg-purple-50 transition-all"
                                        >
                                            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                                {dt.slug === "smartphone" ? (
                                                    <Smartphone className="w-12 h-12 text-zinc-600" />
                                                ) : dt.slug === "tablet" ? (
                                                    <Tablet className="w-12 h-12 text-zinc-600" />
                                                ) : (
                                                    <Smartphone className="w-12 h-12 text-zinc-600" />
                                                )}
                                            </div>
                                            <p className="font-semibold text-zinc-900">{dt.name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Step 1: Brands */}
                            {step === 1 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {brands.map((brand) => (
                                        <button
                                            key={brand.id}
                                            onClick={() => handleSelectBrand(brand)}
                                            className="bg-white rounded-xl border-2 border-zinc-200 p-4 hover:border-purple-400 hover:shadow-md transition-all"
                                        >
                                            <div className="aspect-[3/2] flex items-center justify-center mb-2">
                                                {brand.logo ? (
                                                    <img src={brand.logo} alt={brand.name} className="max-h-10 object-contain" />
                                                ) : (
                                                    <span className="text-lg font-bold text-zinc-600">{brand.name}</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-zinc-700 text-center">{brand.name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Step 2: Devices */}
                            {step === 2 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {devices.map((device) => (
                                        <button
                                            key={device.id}
                                            onClick={() => handleSelectDevice(device)}
                                            className="bg-white rounded-xl border-2 border-zinc-200 p-4 hover:border-purple-400 hover:shadow-md transition-all text-center"
                                        >
                                            <div className="aspect-square flex items-center justify-center mb-2 bg-zinc-50 rounded-lg">
                                                {device.image ? (
                                                    <img src={device.image} alt={device.name} className="max-h-20 object-contain" />
                                                ) : (
                                                    <Smartphone className="w-10 h-10 text-zinc-300" />
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900">{device.name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Step 3: Repairs */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    {/* Device Header */}
                                    <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl">
                                        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                                            {selectedDevice?.image ? (
                                                <img src={selectedDevice.image} alt={selectedDevice.name} className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <Smartphone className="w-10 h-10 text-zinc-300" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{selectedBrand?.name} {selectedDevice?.name}</h3>
                                            <p className="text-sm text-zinc-500">Selecteer de gewenste reparatie</p>
                                        </div>
                                    </div>

                                    {/* Repair Options */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {repairs.map((repair) => (
                                            <button
                                                key={repair.id}
                                                onClick={() => handleSelectRepair(repair)}
                                                className="bg-white border-2 border-zinc-200 rounded-xl p-4 text-left hover:border-purple-400 hover:bg-purple-50 transition-all"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    {repair.service?.icon ? (
                                                        <img src={repair.service.icon} alt="" className="w-6 h-6" />
                                                    ) : (
                                                        <Wrench className="w-5 h-5 text-purple-600" />
                                                    )}
                                                    <span className="font-medium text-sm">{repair.service?.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-bold text-purple-600">
                                                        {repair.priceText || (repair.price ? `€${Number(repair.price).toFixed(2)}` : "Op aanvraag")}
                                                    </span>
                                                </div>
                                                {repair.duration && (
                                                    <p className="text-xs text-zinc-500 mt-1">{repair.duration}</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {repairs.length === 0 && (
                                        <p className="text-center text-zinc-500 py-8">Geen reparaties gevonden voor dit toestel.</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

