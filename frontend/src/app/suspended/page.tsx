"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SuspendedPage() {
    useEffect(() => {
        // Clear any auth tokens since the account is suspended
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem("auth_token");
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl text-white">Account Suspended</CardTitle>
                    <CardDescription className="text-gray-400">
                        This shop has been temporarily suspended.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
                        <p className="text-sm text-gray-300">
                            If you believe this is an error or need assistance, please contact support:
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="w-4 h-4" />
                            <a href="mailto:support@servicespulse.com" className="hover:text-white transition-colors">
                                support@servicespulse.com
                            </a>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Account suspensions may occur due to billing issues, policy violations, or administrative actions.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
