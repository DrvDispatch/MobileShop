'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ownerApi } from '@/lib/owner-api';
import type { Tenant } from '@/types';

export default function TenantsPage() {
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Create tenant modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTenantName, setNewTenantName] = useState('');
    const [newTenantSlug, setNewTenantSlug] = useState('');
    const [createError, setCreateError] = useState('');

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        try {
            const data = await ownerApi.getTenants();
            setTenants(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tenants');
            if (err instanceof Error && err.message.includes('Unauthorized')) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const getPrimaryDomain = (tenant: Tenant) => {
        const primary = tenant.domains?.find(d => d.isPrimary);
        return primary?.domain || 'No domain';
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setNewTenantName(name);
        setNewTenantSlug(generateSlug(name));
    };

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newTenantName.trim() || !newTenantSlug.trim()) {
            setCreateError('Name and slug are required');
            return;
        }

        setCreating(true);
        setCreateError('');

        try {
            const tenant = await ownerApi.createTenant({
                name: newTenantName.trim(),
                slug: newTenantSlug.trim(),
            });

            setNewTenantName('');
            setNewTenantSlug('');
            setShowCreateModal(false);
            await loadTenants();
            router.push(`/tenants/${tenant.id}`);
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Failed to create tenant');
        } finally {
            setCreating(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                {/* Page Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Tenants
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage all tenants on the platform
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        + Create Tenant
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-lg text-gray-600">Loading tenants...</div>
                    </div>
                ) : error ? (
                    <Card>
                        <CardContent className="py-8">
                            <p className="text-red-600 text-center">{error}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>All Tenants ({tenants.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tenants.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No tenants yet. Create your first tenant to get started.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                                                    Name
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                                                    Slug
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                                                    Status
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                                                    Primary Domain
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                                                    Created
                                                </th>
                                                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tenants.map((tenant) => (
                                                <tr
                                                    key={tenant.id}
                                                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                                    onClick={() => router.push(`/tenants/${tenant.id}`)}
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {tenant.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                            {tenant.slug}
                                                        </code>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <StatusBadge status={tenant.status} />
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {getPrimaryDomain(tenant)}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {new Date(tenant.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Link href={`/tenants/${tenant.id}`} onClick={(e) => e.stopPropagation()}>
                                                            <Button size="sm" variant="outline">
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Create Tenant Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                            Create New Tenant
                        </h3>

                        <form onSubmit={handleCreateTenant} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Tenant Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={newTenantName}
                                    onChange={handleNameChange}
                                    placeholder="My Business"
                                    required
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="slug" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Slug (URL identifier)
                                </label>
                                <input
                                    id="slug"
                                    type="text"
                                    value={newTenantSlug}
                                    onChange={(e) => setNewTenantSlug(e.target.value)}
                                    placeholder="my-business"
                                    required
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Only lowercase letters, numbers, and hyphens
                                </p>
                            </div>

                            {createError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
                                    {createError}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewTenantName('');
                                        setNewTenantSlug('');
                                        setCreateError('');
                                    }}
                                    disabled={creating}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create Tenant'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
