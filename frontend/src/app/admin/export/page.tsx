"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet, ShoppingCart, Package, Users, RotateCcw, MessageSquare, Loader2, CheckCircle, Calculator, FileText } from "lucide-react";
import { useExport, EXPORT_OPTIONS, QUARTER_OPTIONS, getYearOptions, AccountingExportType } from "@/lib/admin/export";

const ICON_MAP: Record<string, React.ElementType> = {
    orders: ShoppingCart, products: Package, customers: Users, refunds: RotateCcw, reviews: MessageSquare,
};

export default function AdminExportPage() {
    const {
        exportOptions, exporting, exported, filters,
        selectedQuarter, selectedYear,
        setSelectedQuarter, setSelectedYear, resetToCurrentQuarter,
        updateFilter, handleExport, handleAccountingExport,
        isExporting, wasExported,
    } = useExport();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Data Exporteren</h1>
                <p className="text-zinc-500">Download gegevens als CSV-bestand voor Excel of andere toepassingen</p>
            </div>

            {/* Belgian Accounting Section */}
            <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 border border-zinc-200 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-2 bg-zinc-200 rounded-lg"><Calculator className="w-6 h-6 text-zinc-700" /></div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Boekhoudkundig / BTW Exports</h2>
                        <p className="text-sm text-zinc-600 mt-1">Geoptimaliseerd voor Belgische belastingwetgeving. Exporteer per kwartaal voor uw BTW-aangifte.</p>
                    </div>
                </div>

                {/* Quarter/Year Selector */}
                <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-zinc-200">
                    <div>
                        <label className="text-xs font-medium text-zinc-700 block mb-1">Kwartaal</label>
                        <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))} className="px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm">
                            {QUARTER_OPTIONS.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-700 block mb-1">Jaar</label>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm">
                            {getYearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={resetToCurrentQuarter} className="px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors">Huidig kwartaal</button>
                    </div>
                </div>

                {/* Accounting Export Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <AccountingCard type="btw" title="BTW Aangifte" description="Samenvatting van omzet, BTW en terugbetalingen voor uw kwartaalaangifte." subtitle="Kwartaaloverzicht BTW 21%"
                        isExporting={isExporting("accounting_btw")} quarter={selectedQuarter} year={selectedYear} onExport={() => handleAccountingExport("btw")} icon={FileText} />
                    <AccountingCard type="accountant" title="Accountant Rapport" description="Volledige boekhouding per kwartaal met alle transacties en BTW." subtitle="Gedetailleerd overzicht"
                        isExporting={isExporting("accounting_accountant")} quarter={selectedQuarter} year={selectedYear} onExport={() => handleAccountingExport("accountant")} icon={FileSpreadsheet} />
                    <AccountingCard type="annual" title="Jaaroverzicht" description="Compleet jaaroverzicht voor uw boekhouding en belastingaangifte." subtitle="Hele jaar samengevat"
                        isExporting={isExporting("accounting_annual")} quarter={selectedQuarter} year={selectedYear} onExport={() => handleAccountingExport("annual")} icon={Calculator} isAnnual />
                </div>
            </div>

            {/* General Export Section */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Algemene Exports</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {exportOptions.map((option) => {
                        const Icon = ICON_MAP[option.id] || FileSpreadsheet;
                        return (
                            <div key={option.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-2 bg-zinc-100 rounded-lg"><Icon className="w-5 h-5 text-zinc-600" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-zinc-900">{option.name}</h3>
                                        <p className="text-sm text-zinc-500 mt-1">{option.description}</p>
                                    </div>
                                </div>
                                {option.filters && (
                                    <div className="mb-4 space-y-2">
                                        {option.filters.map((filter) => (
                                            <div key={filter.key}>
                                                {filter.type === "date" ? (
                                                    <div>
                                                        <label className="text-xs text-zinc-500">{filter.label}</label>
                                                        <Input type="date" className="mt-1 text-sm" value={(filters[option.id]?.[filter.key] as string) || ""}
                                                            onChange={(e) => updateFilter(option.id, filter.key, e.target.value)} />
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center gap-2">
                                                        <input type="checkbox" className="rounded" checked={!!filters[option.id]?.[filter.key]}
                                                            onChange={(e) => updateFilter(option.id, filter.key, e.target.checked)} />
                                                        <span className="text-sm text-zinc-600">{filter.label}</span>
                                                    </label>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Button onClick={() => handleExport(option)} disabled={isExporting(option.id)} className="w-full" variant={wasExported(option.id) ? "outline" : "default"}>
                                    {isExporting(option.id) ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporteren...</>
                                    ) : wasExported(option.id) ? (
                                        <><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Opnieuw downloaden</>
                                    ) : (
                                        <><Download className="w-4 h-4 mr-2" />Downloaden</>
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function AccountingCard({ type, title, subtitle, description, isExporting, quarter, year, onExport, icon: Icon, isAnnual }: {
    type: string; title: string; subtitle: string; description: string; isExporting: boolean;
    quarter: number; year: number; onExport: () => void; icon: React.ElementType; isAnnual?: boolean;
}) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-zinc-100 rounded-lg"><Icon className="w-5 h-5 text-zinc-700" /></div>
                <div>
                    <h3 className="font-semibold text-zinc-900">{title}</h3>
                    <p className="text-xs text-zinc-500">{subtitle}</p>
                </div>
            </div>
            <p className="text-xs text-zinc-600 mb-4">{description}</p>
            <Button className="w-full bg-zinc-900 hover:bg-zinc-800" onClick={onExport} disabled={isExporting}>
                {isExporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporteren...</> : <><Download className="w-4 h-4 mr-2" />{isAnnual ? year : `Q${quarter} ${year}`}</>}
            </Button>
        </div>
    );
}
