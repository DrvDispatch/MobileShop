"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api, AuthResponse } from "@/lib/api";
import { useFeatures } from "@/contexts/FeatureContext";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu,
    X,
    Home,
    Smartphone,
    Users,
    Calendar,
    Wrench,
    Ticket,
    ImageIcon,
    Mail,
    FileText,
    Percent,
    Megaphone,
    Boxes,
    Truck,
    RotateCcw,
    Activity,
    Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeToken } from "@/lib/api";

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    section?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

/**
 * Build navigation sections dynamically based on feature flags
 * Rule: Admin should never see a tab they cannot open
 */
function getNavigationSections(features: {
    ecommerceEnabled: boolean;
    repairsEnabled: boolean;
    ticketsEnabled: boolean;
    invoicingEnabled: boolean;
    inventoryEnabled: boolean;
}): NavSection[] {
    return [
        {
            title: "",
            items: [
                { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
            ]
        },
        // Verkoop section - only if e-commerce enabled
        ...(features.ecommerceEnabled ? [{
            title: "Verkoop",
            items: [
                { name: "Bestellingen", href: "/admin/orders", icon: ShoppingCart },
                { name: "Terugbetalingen", href: "/admin/refunds", icon: RotateCcw },
                { name: "Producten", href: "/admin/products", icon: Package },
                { name: "Galerij", href: "/admin/gallery", icon: ImageIcon },
            ]
        }] : []),
        // Reparaties section - only if repairs enabled
        ...(features.repairsEnabled ? [{
            title: "Reparaties",
            items: [
                { name: "Afspraken", href: "/admin/appointments", icon: Calendar },
                { name: "Prijzen & Services", href: "/admin/repairs", icon: Wrench },
                { name: "Toestellen Beheren", href: "/admin/devices", icon: Smartphone },
            ]
        }] : []),
        // Klanten section - tickets conditional
        {
            title: "Klanten",
            items: [
                { name: "Gebruikers", href: "/admin/users", icon: Users },
                ...(features.ticketsEnabled ? [{ name: "Support Tickets", href: "/admin/tickets", icon: Ticket }] : []),
                { name: "Marketing", href: "/admin/marketing", icon: Mail },
            ].filter(Boolean) as NavItem[]
        },
        // Promoties section - only if e-commerce enabled (coupons are e-commerce related)
        ...(features.ecommerceEnabled ? [{
            title: "Promoties",
            items: [
                { name: "Kortingscodes", href: "/admin/discounts", icon: Percent },
                { name: "Banners", href: "/admin/banners", icon: Megaphone },
            ]
        }] : []),
        // Logistiek section - only if inventory or e-commerce enabled
        ...((features.inventoryEnabled || features.ecommerceEnabled) ? [{
            title: "Logistiek",
            items: [
                ...(features.inventoryEnabled ? [{ name: "Voorraadbeheer", href: "/admin/inventory", icon: Boxes }] : []),
                ...(features.ecommerceEnabled ? [{ name: "Verzending", href: "/admin/shipping", icon: Truck }] : []),
            ].filter(Boolean) as NavItem[]
        }] : []),
        // Systeem section - invoicing conditional
        {
            title: "Systeem",
            items: [
                ...(features.invoicingEnabled ? [{ name: "Facturen", href: "/admin/invoice", icon: FileText }] : []),
                { name: "Instellingen", href: "/admin/settings", icon: Settings },
                { name: "Export Data", href: "/admin/export", icon: Download },
                { name: "Activiteitenlog", href: "/admin/audit-logs", icon: Activity },
            ].filter(Boolean) as NavItem[]
        },
    ].filter(section => section.items.length > 0) as NavSection[]; // Remove empty sections
}


export function AdminSidebar({
    collapsed,
    onToggle,
    mobile = false,
    onClose,
}: {
    collapsed: boolean;
    onToggle: () => void;
    mobile?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // Feature flags for conditional navigation
    const features = useFeatures();
    const navigationSections = getNavigationSections(features);

    const handleLogout = () => {
        removeToken();
        localStorage.removeItem("adminAuth");
        router.push("/admin/login");
    };

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <aside
            className={`
                ${mobile ? "fixed inset-y-0 left-0 z-50" : "relative"}
                ${collapsed && !mobile ? "w-16" : "w-64"}
                bg-zinc-900 text-zinc-100 flex flex-col h-full transition-all duration-300
            `}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
                {(!collapsed || mobile) && (
                    <Link href="/admin" className="font-semibold text-lg">
                        Admin Panel
                    </Link>
                )}
                {mobile ? (
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={onToggle}
                        className="p-2 hover:bg-zinc-800 rounded-lg ml-auto"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>

            {/* Navigation with Sections */}
            <nav className="flex-1 py-4 px-2 space-y-4 overflow-y-auto">
                {navigationSections.map((section) => (
                    <div key={section.title || "main"}>
                        {/* Section Title */}
                        {section.title && (!collapsed || mobile) && (
                            <div className="px-3 py-1 mb-1">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    {section.title}
                                </span>
                            </div>
                        )}
                        {section.title && collapsed && !mobile && (
                            <div className="border-t border-zinc-800 my-2" />
                        )}

                        {/* Section Items */}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={mobile ? onClose : undefined}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                            ${active
                                                ? "bg-zinc-800 text-white"
                                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                            }
                                            ${collapsed && !mobile ? "justify-center" : ""}
                                        `}
                                        title={collapsed && !mobile ? item.name : undefined}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        {(!collapsed || mobile) && (
                                            <span className="text-sm font-medium">{item.name}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-zinc-800 space-y-1">
                {/* Admin Profile */}
                {(!collapsed || mobile) && (
                    <div className="px-3 py-2 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                                {(() => {
                                    try {
                                        const adminAuth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
                                        return adminAuth.username?.charAt(0)?.toUpperCase() || "A";
                                    } catch {
                                        return "A";
                                    }
                                })()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-100 truncate">
                                    {(() => {
                                        try {
                                            const adminAuth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
                                            return adminAuth.username || "Admin";
                                        } catch {
                                            return "Admin";
                                        }
                                    })()}
                                </p>
                                <p className="text-xs text-zinc-500">Administrator</p>
                            </div>
                        </div>
                    </div>
                )}
                {collapsed && !mobile && (
                    <div className="flex justify-center py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium" title="Admin">
                            {(() => {
                                try {
                                    const adminAuth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
                                    return adminAuth.username?.charAt(0)?.toUpperCase() || "A";
                                } catch {
                                    return "A";
                                }
                            })()}
                        </div>
                    </div>
                )}
                <Link
                    href="/"
                    className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                        text-zinc-400 hover:bg-zinc-800 hover:text-white
                        ${collapsed && !mobile ? "justify-center" : ""}
                    `}
                    title={collapsed && !mobile ? "Back to Store" : undefined}
                >
                    <Home className="w-5 h-5 flex-shrink-0" />
                    {(!collapsed || mobile) && (
                        <span className="text-sm font-medium">Back to Store</span>
                    )}
                </Link>
                <button
                    onClick={handleLogout}
                    className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                        text-zinc-400 hover:bg-red-900/50 hover:text-red-400
                        ${collapsed && !mobile ? "justify-center" : ""}
                    `}
                    title={collapsed && !mobile ? "Logout" : undefined}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {(!collapsed || mobile) && (
                        <span className="text-sm font-medium">Logout</span>
                    )}
                </button>
            </div>
        </aside>
    );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Global notification state
    const [newOrderNotification, setNewOrderNotification] = useState<{
        id: string;
        orderNumber: string;
        customerName: string;
        total: number;
    } | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const previousOrderIdsRef = useRef<Set<string>>(new Set());
    const isFirstLoadRef = useRef(true);

    // Don't apply layout to login page
    const isLoginPage = pathname === "/admin/login";

    // Play notification sound
    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const playBeep = (frequency: number, startTime: number, duration: number) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };
            const now = audioContext.currentTime;
            playBeep(880, now, 0.15);
            playBeep(1108.73, now + 0.15, 0.15);
            playBeep(1318.51, now + 0.3, 0.2);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    };

    // Global order polling (only when authenticated and not on login page)
    useEffect(() => {
        if (!isAuthenticated || isLoginPage) return;

        const checkForNewOrders = async () => {
            try {
                const token = localStorage.getItem("adminAccessToken");
                if (!token) return;

                // Use relative path for tenant resolution
                const response = await fetch(`/api/orders/admin/all`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const orders = await response.json();
                    const currentIds = new Set(orders.map((o: { id: string }) => o.id));

                    if (!isFirstLoadRef.current) {
                        // Find new orders
                        const newOrders = orders.filter((o: { id: string }) =>
                            !previousOrderIdsRef.current.has(o.id)
                        );

                        if (newOrders.length > 0) {
                            const newest = newOrders[0];
                            setNewOrderNotification({
                                id: newest.id,
                                orderNumber: newest.orderNumber,
                                customerName: newest.customerName,
                                total: Number(newest.total),
                            });

                            if (soundEnabled) {
                                playNotificationSound();
                            }
                        }
                    }

                    previousOrderIdsRef.current = currentIds as Set<string>;
                    isFirstLoadRef.current = false;
                }
            } catch (error) {
                console.error("Failed to check for new orders:", error);
            }
        };

        // Initial check
        checkForNewOrders();

        // Poll every 15 seconds
        const interval = setInterval(checkForNewOrders, 15000);
        return () => clearInterval(interval);
    }, [isAuthenticated, isLoginPage, soundEnabled]);

    useEffect(() => {
        // Skip auth check for login page
        if (isLoginPage) {
            setIsLoading(false);
            return;
        }

        // Check auth by decoding JWT and verifying role
        const checkAuth = () => {
            try {
                const accessToken = localStorage.getItem("adminAccessToken");

                if (!accessToken) {
                    router.push("/admin/login");
                    return;
                }

                // Decode JWT payload (base64)
                const payload = JSON.parse(atob(accessToken.split('.')[1]));

                // Check if token is expired
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("adminAuth");
                    router.push("/admin/login");
                    return;
                }

                // CRITICAL: Verify user has ADMIN or STAFF role
                if (payload.role !== "ADMIN" && payload.role !== "STAFF") {
                    console.error("Access denied: User does not have admin privileges");
                    // Clear any spoofed adminAuth
                    localStorage.removeItem("adminAuth");
                    router.push("/admin/login?error=unauthorized");
                    return;
                }

                // User is authenticated and has proper role
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Auth check failed:", error);
                router.push("/admin/login");
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [router, isLoginPage, pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full" />
            </div>
        );
    }

    // Render login page without layout
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-100 flex">
            {/* Global New Order Notification */}
            {newOrderNotification && (
                <div
                    className="fixed top-4 right-4 z-[100] animate-slide-in-right bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-2xl p-4 max-w-sm cursor-pointer hover:from-green-700 hover:to-emerald-700 transition-all"
                    onClick={() => {
                        router.push(`/admin/orders/${newOrderNotification.id}`);
                        setNewOrderNotification(null);
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div className="bg-white/20 rounded-full p-2 animate-pulse">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-lg flex items-center gap-2">
                                🎉 Nieuwe Bestelling!
                            </p>
                            <p className="font-semibold">{newOrderNotification.orderNumber}</p>
                            <p className="text-sm opacity-90">{newOrderNotification.customerName}</p>
                            <p className="text-xl font-bold mt-1">€{newOrderNotification.total.toFixed(2)}</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setNewOrderNotification(null); }}
                            className="hover:bg-white/20 rounded-full p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs mt-2 opacity-75 text-center">Klik om te bekijken →</p>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <AdminSidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <AdminSidebar
                        collapsed={false}
                        onToggle={() => { }}
                        mobile
                        onClose={() => setMobileMenuOpen(false)}
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white border-b border-zinc-200 px-4 flex items-center justify-between">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 hover:bg-zinc-100 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="font-semibold">Admin Panel</span>
                    <div className="w-9" /> {/* Spacer for centering */}
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

