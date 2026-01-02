"use client";

import { useState } from "react";
import { FileText, Plus, Building2 } from "lucide-react";
import {
    CreateInvoiceTab,
    InvoiceListTab,
    SettingsTab,
} from "@/components/admin/invoice";

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
                            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === tab.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
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
