'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ownerApi, type TenantUser } from '@/lib/owner-api';
import { TenantStatus } from '@/types';
import { useTenant } from './tenant-context';

export default function TenantDetailPage() {
    const router = useRouter();
    const { tenant, reloadTenant } = useTenant();

    // Derived from context tenant
    const tenantId = tenant?.id || '';

    const [actionLoading, setActionLoading] = useState(false);

    // Seed data state
    const [seedLoading, setSeedLoading] = useState(false);
    const [seedStats, setSeedStats] = useState<{ brands: number; devices: number; serviceTypes: number; deviceServices: number } | null>(null);
    const [seedError, setSeedError] = useState<string | null>(null);

    // Impersonation state
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [impersonating, setImpersonating] = useState(false);

    const handleActivate = async () => {
        if (!confirm('Are you sure you want to activate this tenant?')) return;
        setActionLoading(true);
        try {
            await ownerApi.activateTenant(tenantId);
            await reloadTenant();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to activate tenant');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!confirm('Are you sure you want to suspend this tenant? Users will not be able to access it.')) return;
        setActionLoading(true);
        try {
            await ownerApi.suspendTenant(tenantId);
            await reloadTenant();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to suspend tenant');
        } finally {
            setActionLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!confirm('Are you sure you want to archive this tenant? This action should only be used for permanent removal.')) return;
        setActionLoading(true);
        try {
            await ownerApi.archiveTenant(tenantId);
            await reloadTenant();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to archive tenant');
        } finally {
            setActionLoading(false);
        }
    };

    // Load users for impersonation dropdown
    const loadUsers = async () => {
        setUsersLoading(true);
        try {
            const data = await ownerApi.getTenantUsers(tenantId);
            setUsers(data);
            if (data.length > 0) {
                setSelectedUserId(data[0].id);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    // Handle impersonation - opens tenant site in new tab
    const handleImpersonate = async () => {
        if (!selectedUserId) {
            alert('Please select a user to impersonate');
            return;
        }

        setImpersonating(true);
        try {
            const result = await ownerApi.impersonateUser(tenantId, selectedUserId);
            // Open the redirect URL in a new tab
            window.open(result.redirectUrl, '_blank');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to start impersonation');
        } finally {
            setImpersonating(false);
        }
    };

    // Load seed stats
    const loadSeedStats = async () => {
        try {
            const stats = await ownerApi.getSeedStats(tenantId);
            setSeedStats(stats);
        } catch (err) {
            console.error('Failed to load seed stats:', err);
        }
    };

    // Seed tenant data
    const handleSeed = async () => {
        if (!confirm('This will seed the tenant with repair catalog data (all devices and services). Continue?')) return;
        setSeedLoading(true);
        setSeedError(null);
        try {
            const result = await ownerApi.seedTenant(tenantId);
            setSeedStats(result);
            alert(`Seeding complete! ${result.devices} devices, ${result.deviceServices} services created.`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to seed tenant';
            setSeedError(message);
            alert(message);
        } finally {
            setSeedLoading(false);
        }
    };

    // Reseed tenant data
    const handleReseed = async () => {
        if (!confirm('This will DELETE all existing repair data and reseed from scratch. This action is irreversible. Continue?')) return;
        setSeedLoading(true);
        setSeedError(null);
        try {
            const result = await ownerApi.reseedTenant(tenantId);
            setSeedStats(result);
            alert(`Reseeding complete! ${result.devices} devices, ${result.deviceServices} services created.`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to reseed tenant';
            setSeedError(message);
            alert(message);
        } finally {
            setSeedLoading(false);
        }
    };

    if (!tenant) return null;

    const primaryDomain = tenant.domains?.find(d => d.isPrimary);

    return (
        <>
            {/* Overview Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Tenant Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                            <p className="font-medium">{tenant.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Slug</p>
                            <p className="font-mono text-sm">{tenant.slug}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                            <StatusBadge status={tenant.status} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Primary Domain</p>
                            <p className="font-medium">{primaryDomain?.domain || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                            <p>{new Date(tenant.createdAt).toLocaleString()}</p>
                        </div>
                        {tenant.suspendedAt && (
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Suspended At</p>
                                <p className="text-yellow-600">{new Date(tenant.suspendedAt).toLocaleString()}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Domains</p>
                            <p className="text-2xl font-bold">{tenant.domains?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Verified Domains</p>
                            <p className="text-2xl font-bold text-green-600">
                                {tenant.domains?.filter(d => d.verificationStatus === 'VERIFIED').length || 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Impersonation Section */}
            {tenant.status === TenantStatus.ACTIVE && (
                <Card className="mb-8 border-violet-200 dark:border-violet-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            User Impersonation
                        </CardTitle>
                        <CardDescription>
                            Log in as a tenant user for support and debugging purposes. Actions are logged.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {users.length === 0 ? (
                                <Button
                                    onClick={loadUsers}
                                    disabled={usersLoading}
                                    variant="outline"
                                >
                                    {usersLoading ? 'Loading users...' : 'Load Users'}
                                </Button>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email}) - {user.role}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        onClick={handleImpersonate}
                                        disabled={impersonating || !selectedUserId}
                                    >
                                        {impersonating ? 'Opening...' : 'Impersonate'}
                                    </Button>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                ⚠️ Impersonation opens the tenant site in a new tab. All actions are audited.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Management Section */}
            <Card className="mb-8 border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                        Repair Catalog Seeding
                    </CardTitle>
                    <CardDescription>
                        Seed repair devices and services from the master catalog (devices.json)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Seed Stats */}
                    {seedStats ? (
                        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-600">{seedStats.brands}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Brands</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-600">{seedStats.devices}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Devices</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-600">{seedStats.serviceTypes}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Service Types</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-indigo-600">{seedStats.deviceServices}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Device Services</p>
                            </div>
                        </div>
                    ) : (
                        <Button
                            onClick={loadSeedStats}
                            variant="outline"
                            size="sm"
                        >
                            Load Current Stats
                        </Button>
                    )}

                    {seedError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                            {seedError}
                        </div>
                    )}

                    {/* Seed Actions */}
                    <div className="flex gap-4">
                        <Button
                            onClick={handleSeed}
                            disabled={seedLoading}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {seedLoading ? 'Seeding...' : 'Seed Repair Catalog'}
                        </Button>
                        <Button
                            onClick={handleReseed}
                            disabled={seedLoading}
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        >
                            {seedLoading ? 'Reseeding...' : 'Reseed (Clear & Rebuild)'}
                        </Button>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Note: Seeding creates brands, devices, and services from devices.json.
                        Reseeding will delete all existing repair data first.
                    </p>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions that affect tenant availability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tenant.status === TenantStatus.DRAFT && (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Activate Tenant</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Make this tenant live and accessible
                                </p>
                            </div>
                            <Button
                                onClick={handleActivate}
                                disabled={actionLoading}
                            >
                                Activate
                            </Button>
                        </div>
                    )}

                    {tenant.status === TenantStatus.ACTIVE && (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Suspend Tenant</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Temporarily block access to this tenant
                                </p>
                            </div>
                            <Button
                                onClick={handleSuspend}
                                disabled={actionLoading}
                                variant="destructive"
                            >
                                Suspend
                            </Button>
                        </div>
                    )}

                    {tenant.status === TenantStatus.SUSPENDED && (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Reactivate Tenant</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Restore access to this tenant
                                </p>
                            </div>
                            <Button
                                onClick={handleActivate}
                                disabled={actionLoading}
                            >
                                Reactivate
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <p className="font-medium text-red-600 dark:text-red-400">Archive Tenant</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Permanently archive this tenant (soft delete)
                            </p>
                        </div>
                        <Button
                            onClick={handleArchive}
                            disabled={actionLoading || tenant.status === TenantStatus.ARCHIVED}
                            variant="destructive"
                        >
                            Archive
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
