/**
 * Invoice List Tab Component
 * Displays list of invoices with search and status filtering
 */

import { Input } from "@/components/ui/input";
import { Search, Loader2, Download } from "lucide-react";
import { useInvoiceList } from "@/lib/admin/invoice";

export function InvoiceListTab() {
    const { invoices, loading, search, setSearch, statusFilter, setStatusFilter, downloadPdf, getStatusConfig } = useInvoiceList();

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
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoeken op factuurnummer, klant..." className="pl-10" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-zinc-200 rounded-lg">
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
                        {invoices.map((inv) => {
                            const statusCfg = getStatusConfig(inv.status);
                            return (
                                <tr key={inv.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                                    <td className="px-4 py-3 font-mono text-sm">{inv.invoiceNumber}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{inv.customerName}</div>
                                        <div className="text-sm text-zinc-500">{inv.customerEmail}</div>
                                    </td>
                                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusCfg.style}`}>{statusCfg.label}</span></td>
                                    <td className="px-4 py-3 text-right font-medium">€{Number(inv.total).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-zinc-500">{new Date(inv.createdAt).toLocaleDateString("nl-BE")}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => downloadPdf(inv.id)} className="p-1.5 hover:bg-zinc-100 rounded"><Download className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {invoices.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Geen facturen gevonden</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
