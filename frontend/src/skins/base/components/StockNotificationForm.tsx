"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, CheckCircle, AlertCircle, Mail } from "lucide-react";

const API_URL = '';

interface StockNotificationFormProps {
    productId: string;
    productName: string;
}

export function StockNotificationForm({ productId, productName }: StockNotificationFormProps) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        try {
            const response = await fetch(`${API_URL}/api/stock-notifications/subscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, productId }),
            });

            if (response.ok) {
                setStatus("success");
            } else {
                const data = await response.json();
                setErrorMessage(data.message || "Er is iets misgegaan");
                setStatus("error");
            }
        } catch (error) {
            setErrorMessage("Kon niet verbinden met de server");
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-green-900">Ingeschreven!</h3>
                <p className="text-sm text-green-700 mt-1">
                    We sturen je een email zodra <strong>{productName}</strong> weer op voorraad is.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-amber-900">Niet op voorraad</h3>
                    <p className="text-sm text-amber-700">
                        Ontvang een melding zodra dit product weer beschikbaar is
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        type="email"
                        placeholder="Je email adres"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10"
                    />
                </div>
                {status === "error" && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errorMessage}
                    </div>
                )}
                <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={status === "loading"}
                >
                    <Bell className="w-4 h-4 mr-2" />
                    {status === "loading" ? "Even geduld..." : "Meld mij aan"}
                </Button>
            </form>

            <p className="text-xs text-amber-600 mt-3 text-center">
                Je ontvangt alleen een email als dit product weer beschikbaar komt
            </p>
        </div>
    );
}
