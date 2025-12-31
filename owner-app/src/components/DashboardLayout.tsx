'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ownerApi } from '@/lib/owner-api';

interface SidebarProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await ownerApi.logout();
        } catch {
            // Ignore errors - cookie might already be cleared
        }
        router.push('/login');
    };

    const navItems = [
        { href: '/', label: 'Dashboard', icon: '📊' },
        { href: '/tenants', label: 'Tenants', icon: '🏢' },
    ];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                {/* Logo/Brand */}
                <div className="h-16 flex items-center px-6 border-b border-gray-700">
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                        ServicePulse
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                                    ? 'bg-violet-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center gap-3 px-4 py-2 text-gray-300 text-sm mb-3">
                        <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center font-medium">
                            O
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">Owner</p>
                            <p className="text-xs text-gray-400 truncate">Platform Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                    >
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
