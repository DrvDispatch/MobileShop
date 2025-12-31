'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTenant } from './tenant-context';

export function TenantLayoutContent({ children, tenantId }: { children: React.ReactNode; tenantId: string }) {
    const pathname = usePathname();
    const { tenant, loading, error } = useTenant();

    // Helper to check active tab
    const isActive = (path: string) => {
        if (path === `/tenants/${tenantId}`) {
            return pathname === path;
        }
        return pathname?.startsWith(path);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', href: `/tenants/${tenantId}` },
        { id: 'cms', label: 'CMS', href: `/tenants/${tenantId}/cms` },
        { id: 'features', label: 'Features', href: `/tenants/${tenantId}/features` },
        { id: 'users', label: 'Users', href: `/tenants/${tenantId}/users` },
        { id: 'domains', label: 'Domains', href: `/tenants/${tenantId}/domains` },
        { id: 'config', label: 'Configuration', href: `/tenants/${tenantId}/config` },
        { id: 'audit', label: 'Audit Log', href: `/tenants/${tenantId}/audit` },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-lg text-gray-600">Loading tenant...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !tenant) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full p-8">
                    <Card className="max-w-md">
                        <CardHeader>
                            <CardTitle>Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-600 mb-4">{error || 'Tenant not found'}</p>
                            <Link href="/tenants">
                                <Button>Back to Tenants</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link href="/tenants" className="text-violet-600 hover:text-violet-800 dark:text-violet-400">
                        ← Back to Tenants
                    </Link>
                </div>

                {/* Tenant Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {tenant.name}
                        </h1>
                        <StatusBadge status={tenant.status} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Slug: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{tenant.slug}</code>
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex gap-8 overflow-x-auto">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={`border-b-2 pb-4 whitespace-nowrap transition-colors ${isActive(tab.href)
                                    ? 'border-violet-600 text-violet-600 font-medium'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Page Content */}
                {children}
            </div>
        </DashboardLayout>
    );
}
