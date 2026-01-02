/**
 * Analytics Dashboard Component
 * Displays appointment analytics metrics
 */

import { TrendingUp } from "lucide-react";

export interface AnalyticsDashboardProps {
    analytics: {
        total: number;
        completed: number;
        completionRate: number;
        noShow: number;
    };
}

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
    const noShowRate = analytics.total > 0 ? ((analytics.noShow / analytics.total) * 100) : 0;

    return (
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-zinc-900"><TrendingUp className="w-5 h-5 text-blue-600" />Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-zinc-500 text-xs mb-1">Totaal Afspraken</p><p className="text-2xl font-bold text-zinc-900">{analytics.total}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-zinc-500 text-xs mb-1">Voltooid</p><p className="text-2xl font-bold text-zinc-900">{analytics.completed}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-zinc-500 text-xs mb-1">Voltooiingspercentage</p><p className="text-2xl font-bold text-green-600">{analytics.completionRate}%</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <p className="text-zinc-500 text-xs mb-1">No-Show Rate</p><p className={`text-2xl font-bold ${noShowRate > 10 ? 'text-red-600' : 'text-green-600'}`}>{noShowRate.toFixed(1)}%</p>
                </div>
            </div>
        </div>
    );
}
