/**
 * Create Invoice Tab Component
 * Form for creating new invoices
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    User,
    Package,
    Search,
    Plus,
    Trash2,
    Loader2,
    CheckCircle,
    Clock,
    Wrench,
} from "lucide-react";
import {
    useInvoiceCreate,
    PAYMENT_METHODS,
} from "@/lib/admin/invoice";
import { RepairPickerModal } from "./RepairPickerModal";

export function CreateInvoiceTab() {
    const {
        customerType, setCustomerType,
        customerSearch, setCustomerSearch, customerResults,
        customerName, setCustomerName,
        customerEmail, setCustomerEmail,
        customerPhone, setCustomerPhone,
        customerAddress, setCustomerAddress,
        selectCustomer,
        items, addProductItem, addCustomItem, updateItem, removeItem,
        productSearch, setProductSearch, productResults,
        showRepairPicker, setShowRepairPicker,
        paymentMethod, setPaymentMethod,
        discountAmount, setDiscountAmount,
        notes, setNotes,
        subtotal, taxAmount, total,
        saving, message,
        handleSubmit, addRepairItem,
    } = useInvoiceCreate();

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
                            <button onClick={() => setCustomerType("new")} className={`px-4 py-2 rounded-lg text-sm font-medium ${customerType === "new" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                                Nieuwe klant
                            </button>
                            <button onClick={() => setCustomerType("existing")} className={`px-4 py-2 rounded-lg text-sm font-medium ${customerType === "existing" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                                Bestaande klant
                            </button>
                        </div>

                        {customerType === "existing" && (
                            <div className="mb-4 relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <Input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Zoek op naam, email of telefoon..." className="pl-10" />
                                </div>
                                {customerResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        {customerResults.map((c) => (
                                            <button key={c.id} onClick={() => selectCustomer(c)} className="w-full px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100 last:border-0">
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
                            <button onClick={addCustomItem} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700">
                                <Plus className="w-4 h-4" /> Vrije regel
                            </button>
                        </div>

                        {/* Product Search */}
                        <div className="mb-4 relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Zoek product om toe te voegen..." className="pl-10" />
                            </div>
                            {productResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {productResults.map((p) => (
                                        <button key={p.id} onClick={() => addProductItem(p)} className="w-full px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100 last:border-0 flex justify-between items-center">
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
                            <button onClick={() => setShowRepairPicker(true)} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-zinc-300 rounded-lg text-zinc-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors w-full justify-center">
                                <Wrench className="w-5 h-5" />
                                <span className="font-medium">Reparatie toevoegen</span>
                            </button>
                        </div>

                        {/* Repair Picker Modal */}
                        {showRepairPicker && (
                            <RepairPickerModal
                                onSelect={(repair) => { addRepairItem(repair); setShowRepairPicker(false); }}
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
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.type === "PRODUCT" ? "bg-blue-100 text-blue-700" : item.type === "REPAIR" ? "bg-orange-100 text-orange-700" : "bg-zinc-100 text-zinc-700"}`}>
                                                        {item.type === "PRODUCT" ? "Product" : item.type === "REPAIR" ? "Reparatie" : "Vrij"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.type === "CUSTOM" ? (
                                                        <Input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} className="h-8" />
                                                    ) : (
                                                        <span>{item.description}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className="h-8 w-16 text-center" />
                                                </td>
                                                <td className="px-4 py-2">
                                                    {item.type === "CUSTOM" ? (
                                                        <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="h-8 w-24 text-right" />
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
                            <div className="text-center py-8 text-zinc-500">Zoek een product of voeg een vrije regel toe</div>
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
                                <Input type="number" step="0.01" value={discountAmount} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right" />
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
                                {PAYMENT_METHODS.map((m) => (
                                    <button key={m.value} onClick={() => setPaymentMethod(m.value)} className={`px-3 py-2 text-sm rounded-lg ${paymentMethod === m.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Notities</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="Optionele notities..." />
                        </div>

                        <div className="mt-6 space-y-2">
                            <Button onClick={() => handleSubmit(true)} disabled={saving || items.length === 0} className="w-full bg-zinc-900 hover:bg-zinc-800">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Aanmaken & Betaald
                            </Button>
                            <Button onClick={() => handleSubmit(false)} disabled={saving || items.length === 0} variant="outline" className="w-full">
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
