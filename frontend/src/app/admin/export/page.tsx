"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Download,
    FileSpreadsheet,
    ShoppingCart,
    Package,
    Users,
    RotateCcw,
    MessageSquare,
    Loader2,
    CheckCircle,
    Calculator,
    FileText,
    CalendarRange,
} from "lucide-react";

// All API calls use relative paths to go through Next.js proxy for tenant resolution

interface ExportOption {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    endpoint: string;
    filters?: { key: string; label: string; type: "date" | "checkbox" }[];
}

const exportOptions: ExportOption[] = [
    {
        id: "orders",
        name: "Bestellingen",
        description: "Alle bestellingen met klantgegevens, producten en bedragen",
        icon: ShoppingCart,
        endpoint: "/api/export/orders",
        filters: [
            { key: "startDate", label: "Vanaf datum", type: "date" },
            { key: "endDate", label: "Tot datum", type: "date" },
        ],
    },
    {
        id: "products",
        name: "Producten",
        description: "Complete productcatalogus met prijzen en voorraad",
        icon: Package,
        endpoint: "/api/export/products",
        filters: [
            { key: "includeInactive", label: "Inclusief inactieve producten", type: "checkbox" },
            { key: "lowStockOnly", label: "Alleen lage voorraad", type: "checkbox" },
        ],
    },
    {
        id: "customers",
        name: "Klanten",
        description: "Klantenlijst met contactgegevens en besteloverzicht",
        icon: Users,
        endpoint: "/api/export/customers",
        filters: [
            { key: "includeInactive", label: "Inclusief inactieve accounts", type: "checkbox" },
            { key: "vipOnly", label: "Alleen VIP klanten", type: "checkbox" },
        ],
    },
    {
        id: "refunds",
        name: "Terugbetalingen",
        description: "Overzicht van alle terugbetalingen en retouren",
        icon: RotateCcw,
        endpoint: "/api/export/refunds",
        filters: [
            { key: "startDate", label: "Vanaf datum", type: "date" },
            { key: "endDate", label: "Tot datum", type: "date" },
        ],
    },
    {
        id: "reviews",
        name: "Reviews",
        description: "Alle productbeoordelingen van klanten",
        icon: MessageSquare,
        endpoint: "/api/export/reviews",
    },
];

// Get current quarter
const getCurrentQuarter = () => Math.ceil((new Date().getMonth() + 1) / 3);
const getCurrentYear = () => new Date().getFullYear();

export default function AdminExportPage() {
    const [exporting, setExporting] = useState<string | null>(null);
    const [exported, setExported] = useState<string[]>([]);
    const [filters, setFilters] = useState<Record<string, Record<string, string | boolean>>>({});

    // Belgian accounting state
    const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());
    const [accountingExporting, setAccountingExporting] = useState<string | null>(null);
    const [accountingExported, setAccountingExported] = useState<string[]>([]);

    const handleExport = async (option: ExportOption) => {
        setExporting(option.id);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const params = new URLSearchParams();

            // Add filters
            const optionFilters = filters[option.id] || {};
            Object.entries(optionFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== "" && value !== false) {
                    params.append(key, String(value));
                }
            });

            const response = await fetch(`${option.endpoint}?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${option.id}-${new Date().toISOString().split("T")[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                setExported([...exported, option.id]);
            }
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setExporting(null);
        }
    };

    const handleAccountingExport = async (type: "btw" | "accountant" | "annual") => {
        setAccountingExporting(type);
        try {
            const token = localStorage.getItem("adminAccessToken");
            let endpoint = "";
            let filename = "";

            if (type === "btw") {
                endpoint = `/api/export/btw-aangifte?quarter=${selectedQuarter}&year=${selectedYear}`;
                filename = `btw-aangifte-Q${selectedQuarter}-${selectedYear}.csv`;
            } else if (type === "accountant") {
                endpoint = `/api/export/accountant?quarter=${selectedQuarter}&year=${selectedYear}`;
                filename = `boekhouding-Q${selectedQuarter}-${selectedYear}.csv`;
            } else {
                endpoint = `/api/export/annual-summary?year=${selectedYear}`;
                filename = `jaaroverzicht-${selectedYear}.csv`;
            }

            const response = await fetch(`${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                setAccountingExported([...accountingExported, type]);
            }
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setAccountingExporting(null);
        }
    };

    const updateFilter = (optionId: string, key: string, value: string | boolean) => {
        setFilters({
            ...filters,
            [optionId]: {
                ...(filters[optionId] || {}),
                [key]: value,
            },
        });
    };

    const quarterOptions = [
        { value: 1, label: "Q1 (Jan - Mar)" },
        { value: 2, label: "Q2 (Apr - Jun)" },
        { value: 3, label: "Q3 (Jul - Sep)" },
        { value: 4, label: "Q4 (Oct - Dec)" },
    ];

    const yearOptions = Array.from({ length: 5 }, (_, i) => getCurrentYear() - i);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Data Exporteren</h1>
                <p className="text-zinc-500">Download gegevens als CSV-bestand voor Excel of andere toepassingen</p>
            </div>

            {/* ============================================ */}
            {/* BELGIAN ACCOUNTING SECTION */}
            {/* ============================================ */}
            <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 border border-zinc-200 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-2 bg-zinc-200 rounded-lg">
                        <Calculator className="w-6 h-6 text-zinc-700" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Boekhoudkundig / BTW Exports</h2>
                        <p className="text-sm text-zinc-600 mt-1">
                            Geoptimaliseerd voor Belgische belastingwetgeving. Exporteer per kwartaal voor uw BTW-aangifte.
                        </p>
                    </div>
                </div>

                {/* Quarter/Year Selector */}
                <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-zinc-200">
                    <div>
                        <label className="text-xs font-medium text-zinc-700 block mb-1">Kwartaal</label>
                        <select
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                            className="px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                        >
                            {quarterOptions.map((q) => (
                                <option key={q.value} value={q.value}>
                                    {q.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-700 block mb-1">Jaar</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSelectedQuarter(getCurrentQuarter());
                                setSelectedYear(getCurrentYear());
                            }}
                            className="px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
                        >
                            Huidig kwartaal
                        </button>
                    </div>
                </div>

                {/* Accounting Export Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* BTW Aangifte */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <FileText className="w-5 h-5 text-zinc-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-zinc-900">BTW Aangifte</h3>
                                <p className="text-xs text-zinc-500">Kwartaaloverzicht BTW 21%</p>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-600 mb-4">
                            Samenvatting van omzet, BTW en terugbetalingen voor uw kwartaalaangifte.
                        </p>
                        <Button
                            className="w-full bg-zinc-900 hover:bg-zinc-800"
                            onClick={() => handleAccountingExport("btw")}
                            disabled={accountingExporting === "btw"}
                        >
                            {accountingExporting === "btw" ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporteren...</>
                            ) : (
                                <><Download className="w-4 h-4 mr-2" />Q{selectedQuarter} {selectedYear}</>
                            )}
                        </Button>
                    </div>

                    {/* Accountant Report */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <FileSpreadsheet className="w-5 h-5 text-zinc-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-zinc-900">Boekhouding</h3>
                                <p className="text-xs text-zinc-500">Gedetailleerde transactielijst</p>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-600 mb-4">
                            Elke factuur en creditnota met Netto, BTW en Bruto bedragen.
                        </p>
                        <Button
                            className="w-full bg-zinc-900 hover:bg-zinc-800"
                            onClick={() => handleAccountingExport("accountant")}
                            disabled={accountingExporting === "accountant"}
                        >
                            {accountingExporting === "accountant" ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporteren...</>
                            ) : (
                                <><Download className="w-4 h-4 mr-2" />Q{selectedQuarter} {selectedYear}</>
                            )}
                        </Button>
                    </div>

                    {/* Annual Summary */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <CalendarRange className="w-5 h-5 text-zinc-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-zinc-900">Jaaroverzicht</h3>
                                <p className="text-xs text-zinc-500">Volledig jaar samenvatting</p>
                            </div>
                        </div>
                        <p className="text-xs text-zinc-600 mb-4">
                            Overzicht van alle 4 kwartalen voor jaarlijkse belastingaangifte.
                        </p>
                        <Button
                            className="w-full bg-zinc-900 hover:bg-zinc-800"
                            onClick={() => handleAccountingExport("annual")}
                            disabled={accountingExporting === "annual"}
                        >
                            {accountingExporting === "annual" ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporteren...</>
                            ) : (
                                <><Download className="w-4 h-4 mr-2" />{selectedYear}</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* GENERAL EXPORTS */}
            {/* ============================================ */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Algemene Exports</h2>

                {/* Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-900">CSV Export</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Geëxporteerde bestanden kunnen direct worden geopend in Excel, Google Sheets, of andere spreadsheet-applicaties.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Export Options Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {exportOptions.map((option) => {
                        const Icon = option.icon;
                        const isExporting = exporting === option.id;
                        const wasExported = exported.includes(option.id);

                        return (
                            <div
                                key={option.id}
                                className={`bg-white rounded-xl border p-5 transition-all ${wasExported ? "border-green-200" : "border-zinc-200"
                                    }`}
                            >
                                <div className="flex items-start gap-3 mb-4">
                                    <div className={`p-2 rounded-lg ${wasExported ? "bg-green-100" : "bg-zinc-100"}`}>
                                        {wasExported ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Icon className="w-5 h-5 text-zinc-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-900">{option.name}</h3>
                                        <p className="text-sm text-zinc-500">{option.description}</p>
                                    </div>
                                </div>

                                {/* Filters */}
                                {option.filters && option.filters.length > 0 && (
                                    <div className="space-y-3 mb-4 border-t border-zinc-100 pt-4">
                                        {option.filters.map((filter) => (
                                            <div key={filter.key}>
                                                {filter.type === "date" ? (
                                                    <div>
                                                        <label className="text-xs text-zinc-500 mb-1 block">
                                                            {filter.label}
                                                        </label>
                                                        <Input
                                                            type="date"
                                                            className="text-sm h-9"
                                                            value={(filters[option.id]?.[filter.key] as string) || ""}
                                                            onChange={(e) =>
                                                                updateFilter(option.id, filter.key, e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-zinc-300"
                                                            checked={!!filters[option.id]?.[filter.key]}
                                                            onChange={(e) =>
                                                                updateFilter(option.id, filter.key, e.target.checked)
                                                            }
                                                        />
                                                        <span className="text-zinc-600">{filter.label}</span>
                                                    </label>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    className="w-full"
                                    onClick={() => handleExport(option)}
                                    disabled={isExporting}
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Exporteren...
                                        </>
                                    ) : wasExported ? (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Opnieuw downloaden
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download CSV
                                        </>
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
