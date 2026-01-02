/**
 * Refund Modal Component
 * 
 * Modal for creating a refund for an order.
 */

import { Button } from '@/components/ui/button';
import { X, RotateCcw, Loader2 } from 'lucide-react';
import type { Order, RefundReason } from '@/lib/admin/orders/types';
import { REFUND_REASON_OPTIONS } from '@/lib/admin/orders/types';
import { formatCurrency } from '@/lib/admin/orders/configs';

interface RefundModalProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;

    // Form state
    refundAmount: string;
    setRefundAmount: (value: string) => void;
    refundReason: RefundReason;
    setRefundReason: (value: RefundReason) => void;
    refundReasonText: string;
    setRefundReasonText: (value: string) => void;
    refundNotes: string;
    setRefundNotes: (value: string) => void;
    returnRequired: boolean;
    setReturnRequired: (value: boolean) => void;

    // Actions
    isCreating: boolean;
    onSubmit: () => void;
}

export function RefundModal({
    order,
    isOpen,
    onClose,
    refundAmount,
    setRefundAmount,
    refundReason,
    setRefundReason,
    refundReasonText,
    setRefundReasonText,
    refundNotes,
    setRefundNotes,
    returnRequired,
    setReturnRequired,
    isCreating,
    onSubmit,
}: RefundModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-violet-600" />
                        Terugbetaling aanmaken
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Order Info */}
                    <div className="bg-zinc-50 rounded-lg p-3">
                        <p className="text-sm text-zinc-500">Order</p>
                        <p className="font-semibold">{order.orderNumber}</p>
                        <p className="text-sm text-zinc-600">Totaal: {formatCurrency(order.total)}</p>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Bedrag (€) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={order.total}
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder={`Max ${formatCurrency(order.total)}`}
                            className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <button
                            type="button"
                            onClick={() => setRefundAmount(order.total.toString())}
                            className="text-xs text-violet-600 hover:underline mt-1"
                        >
                            Volledig bedrag terugbetalen
                        </button>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Reden <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value as RefundReason)}
                            className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            {REFUND_REASON_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Reason Text */}
                    {refundReason === 'OTHER' && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                                Toelichting
                            </label>
                            <input
                                type="text"
                                value={refundReasonText}
                                onChange={(e) => setRefundReasonText(e.target.value)}
                                placeholder="Beschrijf de reden..."
                                className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Interne notities
                        </label>
                        <textarea
                            value={refundNotes}
                            onChange={(e) => setRefundNotes(e.target.value)}
                            placeholder="Optionele notities voor intern gebruik..."
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                        />
                    </div>

                    {/* Return Required */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={returnRequired}
                            onChange={(e) => setReturnRequired(e.target.checked)}
                            className="w-5 h-5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-sm text-zinc-700">
                            Klant moet product retourneren
                        </span>
                    </label>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-zinc-200">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Annuleren
                        </Button>
                        <Button
                            className="flex-1 bg-violet-600 hover:bg-violet-700"
                            onClick={onSubmit}
                            disabled={isCreating || !refundAmount}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aanmaken...
                                </>
                            ) : (
                                <>Terugbetaling aanmaken</>
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-zinc-500 text-center">
                        Na aanmaken kun je de terugbetaling verwerken via Stripe in het Terugbetalingen overzicht
                    </p>
                </div>
            </div>
        </div>
    );
}
