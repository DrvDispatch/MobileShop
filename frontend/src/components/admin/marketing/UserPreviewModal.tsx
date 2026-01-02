/**
 * User Preview Modal Component
 * Modal showing users in a selected segment
 */

import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { type MarketingUser } from "@/lib/admin/marketing";

export interface UserPreviewModalProps {
    label: string;
    users: MarketingUser[];
    isLoading: boolean;
    onClose: () => void;
}

export function UserPreviewModal({ label, users, isLoading, onClose }: UserPreviewModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                    <h2 className="text-lg font-semibold text-zinc-900">{label} ({users.length} gebruikers)</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">Geen gebruikers gevonden in dit segment.</div>
                    ) : (
                        <div className="grid gap-3 p-4">
                            {users.map((user) => (
                                <div key={user.id} className="bg-zinc-50 rounded-lg p-4 hover:bg-zinc-100 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-zinc-900">{user.name}</p>
                                                {user.orderCount !== undefined && user.orderCount > 0 && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                        {user.orderCount} bestelling{user.orderCount !== 1 ? 'en' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-600 mt-0.5">{user.email}</p>
                                            {user.phone && <p className="text-sm text-zinc-500 mt-1">📞 {user.phone}</p>}
                                        </div>
                                        <div className="text-right text-sm">
                                            {user.lastOrder && <p className="text-zinc-500">Laatste bestelling: {new Date(user.lastOrder).toLocaleDateString('nl-NL')}</p>}
                                            {user.lastAppointment && <p className="text-zinc-500">Afspraak: {new Date(user.lastAppointment).toLocaleDateString('nl-NL')}</p>}
                                            {user.unsubscribedAt && <p className="text-red-500">Uitgeschreven: {new Date(user.unsubscribedAt).toLocaleDateString('nl-NL')}</p>}
                                            {user.totalSpent !== undefined && user.totalSpent > 0 && <p className="text-green-600 font-medium mt-1">€{user.totalSpent.toFixed(2)} totaal</p>}
                                        </div>
                                    </div>
                                    {(user.deviceBrand || user.deviceModel || user.repairType) && (
                                        <div className="mt-3 pt-3 border-t border-zinc-200 flex flex-wrap gap-2">
                                            {user.deviceBrand && user.deviceModel && (
                                                <span className="px-2 py-1 bg-white border border-zinc-200 text-zinc-700 text-xs rounded">📱 {user.deviceBrand} {user.deviceModel}</span>
                                            )}
                                            {user.repairType && (
                                                <span className="px-2 py-1 bg-white border border-zinc-200 text-zinc-700 text-xs rounded">🔧 {user.repairType.replace('_', ' ')}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-zinc-200">
                    <Button onClick={onClose} className="w-full">Sluiten</Button>
                </div>
            </div>
        </div>
    );
}
