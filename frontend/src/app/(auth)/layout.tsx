import Link from "next/link";
import { Smartphone } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
            {/* Header */}
            <header className="p-6">
                <Link href="/" className="inline-flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-zinc-900" />
                    <span className="font-semibold text-xl text-zinc-900 tracking-tight">SMARTPHONE SERVICE</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 text-center">
                <p className="text-sm text-zinc-500">
                    © {new Date().getFullYear()} SMARTPHONE SERVICE. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
