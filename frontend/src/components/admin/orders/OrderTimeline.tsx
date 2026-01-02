/**
 * Order Timeline Component
 * 
 * Displays the order status timeline with completed steps.
 */

import { CheckCircle, Clock } from 'lucide-react';
import type { Order } from '@/lib/admin/orders/types';
import { getOrderTimeline, formatDate } from '@/lib/admin/orders/configs';

interface OrderTimelineProps {
    order: Order;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
    const timeline = getOrderTimeline(order);

    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-400" />
                Tijdlijn
            </h2>
            <div className="relative">
                {timeline.map((step, index, arr) => (
                    <div key={step.label} className="flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-500' : 'bg-zinc-200'
                                    }`}
                            >
                                <CheckCircle
                                    className={`w-4 h-4 ${step.completed ? 'text-white' : 'text-zinc-400'}`}
                                />
                            </div>
                            {index < arr.length - 1 && (
                                <div
                                    className={`w-0.5 flex-1 mt-2 ${step.completed ? 'bg-green-500' : 'bg-zinc-200'
                                        }`}
                                />
                            )}
                        </div>
                        <div className="flex-1">
                            <p
                                className={`font-medium ${step.completed ? 'text-zinc-900' : 'text-zinc-400'
                                    }`}
                            >
                                {step.label}
                            </p>
                            <p className="text-sm text-zinc-500">{formatDate(step.date, true)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
