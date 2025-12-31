"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Activity,
    Search,
    Download,
    Filter,
    User,
    Package,
    ShoppingCart,
    Settings,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    Trash2,
    LogIn,
    LogOut,
    FileText,
} from "lucide-react";

// All API calls use relative paths to go through Next.js proxy for tenant resolution

interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    entityType: string;
    entityId: string | null;
    entityName: string | null;
    description: string;
    createdAt: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
    CREATE: Package,
    UPDATE: Edit,
    DELETE: Trash2,
    STATUS_CHANGE: RefreshCw,
    LOGIN: LogIn,
    LOGOUT: LogOut,
    EXPORT: Download,
    REFUND: RefreshCw,
    OTHER: Activity,
};

const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-green-100 text-green-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    STATUS_CHANGE: "bg-purple-100 text-purple-700",
    LOGIN: "bg-emerald-100 text-emerald-700",
    LOGOUT: "bg-zinc-100 text-zinc-700",
    EXPORT: "bg-amber-100 text-amber-700",
    REFUND: "bg-orange-100 text-orange-700",
    OTHER: "bg-zinc-100 text-zinc-700",
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
    product: Package,
    order: ShoppingCart,
    user: User,
    settings: Settings,
    refund: RefreshCw,
};

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [filterAction, setFilterAction] = useState<string>("");
    const [filterEntity, setFilterEntity] = useState<string>("");

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "30",
            });
            if (filterAction) params.append("action", filterAction);
            if (filterEntity) params.append("entityType", filterEntity);

            const response = await fetch(`/api/audit-logs?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.data || []);
                setTotalPages(data.meta?.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to load audit logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem("adminAccessToken");
        try {
            const response = await fetch(`/api/audit-logs/export`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [page, filterAction, filterEntity]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Activiteitenlogboek</h1>
                    <p className="text-zinc-500">Bekijk alle admin activiteiten en wijzigingen</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Vernieuwen
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Zoeken..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={filterAction}
                    onChange={(e) => {
                        setFilterAction(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm"
                >
                    <option value="">Alle acties</option>
                    <option value="CREATE">Aangemaakt</option>
                    <option value="UPDATE">Bijgewerkt</option>
                    <option value="DELETE">Verwijderd</option>
                    <option value="STATUS_CHANGE">Status gewijzigd</option>
                    <option value="LOGIN">Ingelogd</option>
                    <option value="EXPORT">Geëxporteerd</option>
                </select>
                <select
                    value={filterEntity}
                    onChange={(e) => {
                        setFilterEntity(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm"
                >
                    <option value="">Alle types</option>
                    <option value="product">Producten</option>
                    <option value="order">Bestellingen</option>
                    <option value="user">Gebruikers</option>
                    <option value="refund">Terugbetalingen</option>
                </select>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-zinc-400 mb-4" />
                        <p className="text-zinc-500">Laden...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center">
                        <Activity className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                        <p className="text-zinc-500">Geen activiteiten gevonden</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {logs.map((log) => {
                            const ActionIcon = ACTION_ICONS[log.action] || Activity;
                            const EntityIcon = ENTITY_ICONS[log.entityType] || FileText;
                            return (
                                <div key={log.id} className="p-4 hover:bg-zinc-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Action Icon */}
                                        <div className={`p-2 rounded-lg ${ACTION_COLORS[log.action] || "bg-zinc-100"}`}>
                                            <ActionIcon className="w-5 h-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-zinc-900">{log.userName}</span>
                                                <span className="text-zinc-400">•</span>
                                                <span className="text-sm text-zinc-500">{log.userRole}</span>
                                            </div>
                                            <p className="text-zinc-700 mt-1">{log.description}</p>
                                            {log.entityName && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <EntityIcon className="w-4 h-4 text-zinc-400" />
                                                    <span className="text-sm text-zinc-500">
                                                        {log.entityType}: <strong className="text-zinc-700">{log.entityName}</strong>
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Time */}
                                        <div className="text-right text-sm text-zinc-400 flex-shrink-0">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            {formatDate(log.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-zinc-600">
                        Pagina {page} van {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
