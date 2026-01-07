'use client';

/**
 * Base Skin - Track Order Page
 * PURE PRESENTATION ONLY
 */

import type { TrackOrderVM, TimelineStep } from '@core/hooks/pages/useTrackOrderPageVM';
import { Button } from '@/components/ui/button';
import { Search, Package, Clock, Truck, CheckCircle, XCircle, Loader2, AlertCircle, MapPin } from 'lucide-react';

export interface TrackOrderPageProps {
    vm: TrackOrderVM;
}

function StatusIcon({ type, className }: { type: string; className?: string }) {
    switch (type) {
        case 'clock': return <Clock className={className} />;
        case 'check': return <CheckCircle className={className} />;
        case 'package': return <Package className={className} />;
        case 'truck': return <Truck className={className} />;
        case 'x': return <XCircle className={className} />;
        default: return <Package className={className} />;
    }
}

function TimelineItem({ step, index, total }: { step: TimelineStep; index: number; total: number }) {
    return (
        <div className="flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.completed ? (step.isCancelled ? "bg-red-500" : "bg-zinc-900") : "bg-zinc-200"}`}>
                    {step.completed ? (
                        step.isCancelled ? <XCircle className="w-4 h-4 text-white" /> : <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-zinc-400" />
                    )}
                </div>
                {index < total - 1 && <div className={`w-0.5 flex-1 mt-2 ${step.completed ? "bg-zinc-900" : "bg-zinc-200"}`} />}
            </div>
            <div className="flex-1 pb-2">
                <p className={`font-medium ${step.completed ? "text-zinc-900" : "text-zinc-400"}`}>{step.label}</p>
                {step.date && (
                    <p className="text-sm text-zinc-500">
                        {new Date(step.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </div>
        </div>
    );
}

export function TrackOrderPage({ vm }: TrackOrderPageProps) {
    return (
        <div className="max-w-2xl mx-auto px-4 py-16">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Truck className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-3">Track & Trace</h1>
                <p className="text-zinc-600">Volg de status van uw bestelling met uw bestelnummer</p>
            </div>

            {/* Search Form */}
            <form onSubmit={vm.onTrack} className="mb-8">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            value={vm.orderNumber}
                            onChange={(e) => vm.onOrderNumberChange(e.target.value)}
                            placeholder="Bijv. ND-MJO7C2AA-9JII"
                            className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-lg"
                        />
                    </div>
                    <Button type="submit" disabled={vm.isLoading} className="h-12 px-8">
                        {vm.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Zoeken"}
                    </Button>
                </div>
            </form>

            {/* Error Message */}
            {vm.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-8">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700">{vm.error}</p>
                </div>
            )}

            {/* Order Result */}
            {vm.order && vm.statusConfig && (
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className={`rounded-xl border p-6 ${vm.statusConfig.bg} border-zinc-200`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full ${vm.statusConfig.bg} flex items-center justify-center`}>
                                <StatusIcon type={vm.statusConfig.iconType} className={`w-7 h-7 ${vm.statusConfig.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500 mb-1">Bestelnummer</p>
                                <p className="text-xl font-bold text-zinc-900">{vm.order.orderNumber}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-sm text-zinc-500 mb-1">Status</p>
                                <p className={`text-lg font-semibold ${vm.statusConfig.color}`}>{vm.statusConfig.label}</p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-6">Voortgang</h2>
                        <div className="relative">
                            {vm.timelineSteps.map((step, index) => (
                                <TimelineItem key={step.key} step={step} index={index} total={vm.timelineSteps.length} />
                            ))}
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-4">Bestelgegevens</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Klant</span>
                                <span className="text-zinc-900">{vm.order.customerName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Levering</span>
                                <span className="text-zinc-900 flex items-center gap-1">
                                    {vm.order.fulfillmentType === "PICKUP" ? <><MapPin className="w-4 h-4" /> Afhalen in winkel</> : <><Truck className="w-4 h-4" /> Verzending</>}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Besteldatum</span>
                                <span className="text-zinc-900">{new Date(vm.order.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between font-medium pt-3 border-t border-zinc-200">
                                <span className="text-zinc-900">Totaal</span>
                                <span className="text-zinc-900">€{Number(vm.order.total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-4">Producten ({vm.order.items.length})</h2>
                        <div className="space-y-3">
                            {vm.order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center py-2">
                                    <div>
                                        <p className="text-zinc-900">{item.productName}</p>
                                        <p className="text-sm text-zinc-500">Aantal: {item.quantity}</p>
                                    </div>
                                    <p className="text-zinc-900 font-medium">€{Number(item.totalPrice).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Help Text */}
            {!vm.order && !vm.error && (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-500">
                        Voer uw bestelnummer in om de status van uw bestelling te bekijken.<br />
                        U vindt het bestelnummer in uw bevestigingsmail.
                    </p>
                </div>
            )}
        </div>
    );
}
