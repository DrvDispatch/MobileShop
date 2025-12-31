'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ownerApi } from '@/lib/owner-api';
import { TenantDomain, DomainVerificationStatus, CloudflareDomainStatus } from '@/types';
import { useTenant } from '../tenant-context';

// Helper to get Cloudflare status badge variant
function getCloudflareStatusVariant(status: CloudflareDomainStatus): 'warning' | 'info' | 'success' | 'error' {
    switch (status) {
        case CloudflareDomainStatus.PENDING:
            return 'warning';
        case CloudflareDomainStatus.ACTIVE:
            return 'info';
        case CloudflareDomainStatus.DNS_CONFIGURED:
            return 'success';
        case CloudflareDomainStatus.ERROR:
            return 'error';
        default:
            return 'warning';
    }
}

// Helper to get Cloudflare status label
function getCloudflareStatusLabel(status: CloudflareDomainStatus): string {
    switch (status) {
        case CloudflareDomainStatus.PENDING:
            return 'Pending';
        case CloudflareDomainStatus.ACTIVE:
            return 'Zone Active';
        case CloudflareDomainStatus.DNS_CONFIGURED:
            return 'Live ✓';
        case CloudflareDomainStatus.ERROR:
            return 'Error';
        default:
            return status;
    }
}

export default function DomainsPage() {
    const { tenant, reloadTenant } = useTenant();
    const tenantId = tenant?.id || '';

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newDomain, setNewDomain] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [setupResult, setSetupResult] = useState<{ domainId: string; nameservers: string[]; instructions: string } | null>(null);

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain.trim()) return;

        setActionLoading('add');
        try {
            await ownerApi.addDomain(tenantId, { domain: newDomain.trim() });
            setNewDomain('');
            setShowAddForm(false);
            await reloadTenant();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to add domain');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSetupCloudflare = async (domainId: string) => {
        setActionLoading(domainId);
        setSetupResult(null);
        try {
            const result = await ownerApi.setupDomainCloudflare(tenantId, domainId);
            setSetupResult({
                domainId,
                nameservers: result.nameservers,
                instructions: result.instructions,
            });
            await reloadTenant();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to setup Cloudflare');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckAndConfigure = async (domainId: string) => {
        setActionLoading(domainId);
        try {
            const result = await ownerApi.checkAndConfigureDomain(tenantId, domainId);
            if (result.configured) {
                alert('✅ Domain is now live!');
            } else {
                alert(result.message);
            }
            await reloadTenant();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to check domain');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSetPrimary = async (domainId: string) => {
        if (!confirm('Set this as the primary domain?')) return;
        setActionLoading(domainId);
        try {
            await ownerApi.setPrimaryDomain(tenantId, domainId);
            await reloadTenant();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to set primary domain');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveDomain = async (domainId: string, domain: TenantDomain) => {
        if (domain.isPrimary) {
            alert('Cannot remove primary domain. Set another domain as primary first.');
            return;
        }
        if (!confirm(`Remove domain ${domain.domain}?`)) return;

        setActionLoading(domainId);
        try {
            await ownerApi.removeDomain(tenantId, domainId);
            await reloadTenant();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to remove domain');
        } finally {
            setActionLoading(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    if (!tenant) return null;

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Domains</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage custom domains for this tenant
                </p>
            </div>

            {/* Add Domain Button */}
            <div className="mb-6">
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? 'Cancel' : 'Add Domain'}
                </Button>
            </div>

            {/* Add Domain Form */}
            {showAddForm && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Add New Domain</CardTitle>
                        <CardDescription>Add a custom domain for this tenant</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddDomain} className="space-y-4">
                            <div>
                                <label htmlFor="domain" className="block text-sm font-medium mb-2">
                                    Domain Name
                                </label>
                                <input
                                    id="domain"
                                    type="text"
                                    placeholder="example.com"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <Button type="submit" disabled={actionLoading === 'add'}>
                                {actionLoading === 'add' ? 'Adding...' : 'Add Domain'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Nameservers Result (shown after setup) */}
            {setupResult && (
                <Card className="mb-6 border-blue-500">
                    <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                        <CardTitle className="text-blue-700 dark:text-blue-300">
                            ⚙️ Cloudflare Zone Created
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <p className="text-sm mb-4">{setupResult.instructions}</p>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-2">Update your nameservers to:</p>
                            {setupResult.nameservers.map((ns, i) => (
                                <div key={i} className="flex items-center gap-2 mb-1">
                                    <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded text-sm flex-1">
                                        {ns}
                                    </code>
                                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(ns)}>
                                        Copy
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            After updating nameservers at your registrar, click "Check DNS" on the domain to verify and configure.
                        </p>
                        <Button
                            className="mt-4"
                            variant="outline"
                            onClick={() => setSetupResult(null)}
                        >
                            Dismiss
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Domains List */}
            <Card>
                <CardHeader>
                    <CardTitle>Domains ({tenant.domains?.length || 0})</CardTitle>
                    <CardDescription>Manage custom domains for this tenant</CardDescription>
                </CardHeader>
                <CardContent>
                    {tenant.domains && tenant.domains.length > 0 ? (
                        <div className="space-y-4">
                            {tenant.domains.map((domain) => (
                                <div
                                    key={domain.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                >
                                    {/* Domain Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{domain.domain}</h3>
                                                {domain.isPrimary && (
                                                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                            {/* Status badges */}
                                            <div className="flex gap-2 flex-wrap">
                                                <StatusBadge status={domain.verificationStatus} />
                                                {domain.cloudflareStatus && (
                                                    <span className={`text-xs px-2 py-1 rounded ${domain.cloudflareStatus === CloudflareDomainStatus.DNS_CONFIGURED
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : domain.cloudflareStatus === CloudflareDomainStatus.ERROR
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                : domain.cloudflareStatus === CloudflareDomainStatus.ACTIVE
                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        }`}>
                                                        CF: {getCloudflareStatusLabel(domain.cloudflareStatus)}
                                                    </span>
                                                )}
                                                {domain.sslStatus && (
                                                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        SSL: {domain.sslStatus}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2 flex-wrap">
                                            {/* Setup Cloudflare - only if no zone yet */}
                                            {!domain.cloudflareZoneId && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSetupCloudflare(domain.id)}
                                                    disabled={actionLoading === domain.id}
                                                >
                                                    {actionLoading === domain.id ? 'Setting up...' : 'Setup Cloudflare'}
                                                </Button>
                                            )}

                                            {/* Check DNS - if zone exists but not configured */}
                                            {domain.cloudflareZoneId && domain.cloudflareStatus !== CloudflareDomainStatus.DNS_CONFIGURED && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleCheckAndConfigure(domain.id)}
                                                    disabled={actionLoading === domain.id}
                                                >
                                                    {actionLoading === domain.id ? 'Checking...' : 'Check DNS & Configure'}
                                                </Button>
                                            )}

                                            {/* Set Primary - if verified and not primary */}
                                            {!domain.isPrimary && domain.cloudflareStatus === CloudflareDomainStatus.DNS_CONFIGURED && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleSetPrimary(domain.id)}
                                                    disabled={actionLoading === domain.id}
                                                >
                                                    Set Primary
                                                </Button>
                                            )}

                                            {/* Remove - if not primary */}
                                            {!domain.isPrimary && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleRemoveDomain(domain.id, domain)}
                                                    disabled={actionLoading === domain.id}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Nameservers info - if zone exists but pending */}
                                    {domain.cloudflareZoneId &&
                                        domain.cloudflareStatus === CloudflareDomainStatus.PENDING &&
                                        domain.nameservers &&
                                        domain.nameservers.length > 0 && (
                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4 mt-3">
                                                <p className="font-medium text-sm mb-2">⏳ Waiting for nameserver update</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                                    Update your domain's nameservers to:
                                                </p>
                                                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                                    {domain.nameservers.map((ns, i) => (
                                                        <p key={i} className="text-sm font-mono">{ns}</p>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                    After updating, click "Check DNS & Configure" to verify.
                                                </p>
                                            </div>
                                        )}

                                    {/* Error message */}
                                    {domain.errorMessage && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 mt-3">
                                            <p className="font-medium text-sm text-red-700 dark:text-red-300">
                                                ❌ Error: {domain.errorMessage}
                                            </p>
                                        </div>
                                    )}

                                    {/* Success state */}
                                    {domain.cloudflareStatus === CloudflareDomainStatus.DNS_CONFIGURED && (
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4 mt-3">
                                            <p className="font-medium text-sm text-green-700 dark:text-green-300">
                                                ✅ Domain is live and fully configured!
                                            </p>
                                            {domain.verifiedAt && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    Configured on {new Date(domain.verifiedAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Last checked */}
                                    {domain.lastCheckedAt && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Last checked: {new Date(domain.lastCheckedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            No domains configured. Add a domain to get started.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
