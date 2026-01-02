/**
 * Reset Password Modal Component
 * 
 * UI component for resetting user password.
 * All business logic is in useUsers hook - this is pure presentation.
 */

"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResetPasswordModalProps {
    newPassword: string;
    isResetting: boolean;
    onPasswordChange: (password: string) => void;
    onReset: () => void;
    onClose: () => void;
}

export function ResetPasswordModal({
    newPassword,
    isResetting,
    onPasswordChange,
    onReset,
    onClose,
}: ResetPasswordModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-md m-4 p-6">
                <h2 className="text-xl font-bold mb-4">Wachtwoord Resetten</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Nieuw Wachtwoord</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            placeholder="Voer nieuw wachtwoord in"
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={onClose}>Annuleren</Button>
                        <Button className="flex-1" onClick={onReset} disabled={!newPassword || isResetting}>
                            {isResetting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Resetten...
                                </>
                            ) : (
                                "Wachtwoord Resetten"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
