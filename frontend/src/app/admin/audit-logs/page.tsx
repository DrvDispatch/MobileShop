"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Search, Download, RefreshCw, ChevronLeft, ChevronRight, Clock, Edit, Trash2, LogIn, LogOut, FileText, User, Package, ShoppingCart, Settings } from "lucide-react";
import { useAuditLogs, AUDIT_ACTION_CONFIG, ENTITY_TYPE_LABELS, AuditLog } from "@/lib/admin/audit-logs";

const ACTION_ICONS: Record<string, React.ElementType> = {
    CREATE: Package, UPDATE: Edit, DELETE: Trash2, STATUS_CHANGE: RefreshCw,
    LOGIN: LogIn, LOGOUT: LogOut, EXPORT: Download, REFUND: RefreshCw, OTHER: Activity,
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
    product: Package, order: ShoppingCart, user: User, settings: Settings, refund: RefreshCw,
};

export default function AdminAuditLogsPage() {
    const {
        logs, isLoading, isRefreshing,
        page, totalPages, goToPage, hasNextPage, hasPrevPage,
        search, setSearch, filterAction, setFilterAction, filterEntity, setFilterEntity,
        refresh, exportToCsv, formatDate,
    } = useAuditLogs();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Activiteitenlogboek</h1>
                    <p className="text-zinc-500">Bekijk alle admin activiteiten en wijzigingen</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportToCsv}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
                    <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />Vernieuwen
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input placeholder="Zoeken..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm">
                    <option value="">Alle acties</option>
                    {Object.entries(AUDIT_ACTION_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>
                <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm">
                    <option value="">Alle types</option>
                    {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-zinc-400 mb-4" /><p className="text-zinc-500">Laden...</p></div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center"><Activity className="w-12 h-12 mx-auto text-zinc-300 mb-4" /><p className="text-zinc-500">Geen activiteiten gevonden</p></div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {logs.map((log) => <LogRow key={log.id} log={log} formatDate={formatDate} />)}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={!hasPrevPage}><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-sm text-zinc-600">Pagina {page} van {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={!hasNextPage}><ChevronRight className="w-4 h-4" /></Button>
                </div>
            )}
        </div>
    );
}

function LogRow({ log, formatDate }: { log: AuditLog; formatDate: (d: string) => string }) {
    const ActionIcon = ACTION_ICONS[log.action] || Activity;
    const EntityIcon = ENTITY_ICONS[log.entityType] || FileText;
    const actionConfig = AUDIT_ACTION_CONFIG[log.action] || { color: "bg-zinc-100 text-zinc-700" };

    return (
        <div className="p-4 hover:bg-zinc-50 transition-colors">
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${actionConfig.color}`}><ActionIcon className="w-5 h-5" /></div>
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
                            <span className="text-sm text-zinc-500">{log.entityType}: <strong className="text-zinc-700">{log.entityName}</strong></span>
                        </div>
                    )}
                </div>
                <div className="text-right text-sm text-zinc-400 flex-shrink-0"><Clock className="w-4 h-4 inline mr-1" />{formatDate(log.createdAt)}</div>
            </div>
        </div>
    );
}
