'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ownerApi } from '@/lib/owner-api';
import { OwnerAuditLog } from '@/types';
import { useTenant } from '../tenant-context';

export default function AuditPage() {
    const { tenant, error: tenantError } = useTenant();

    // Derived from context
    const tenantId = tenant?.id || '';

    const [auditLogs, setAuditLogs] = useState<OwnerAuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (tenantId) {
            loadData();
        }
    }, [tenantId]);

    const loadData = async () => {
        try {
            const logsData = await ownerApi.getAuditLogs({ limit: 50 });
            // Filter logs for this tenant (ideally backend should support filtering by targetId)
            const tenantLogs = logsData.filter(
                log => log.targetId === tenantId || log.targetType === 'TENANT'
            );
            setAuditLogs(tenantLogs);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-lg text-gray-600">Loading audit log...</div>
            </div>
        );
    }

    if (error || !tenant) {
        return (
            <div className="flex items-center justify-center p-8">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600">{error || tenantError || 'Failed to load data'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Review administrative actions for this tenant
                </p>
            </div>

            {/* Audit Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Audit History</CardTitle>
                    <CardDescription>
                        All owner actions performed on this tenant
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {auditLogs.length > 0 ? (
                        <div className="space-y-4">
                            {auditLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {log.action}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {log.targetType}: {log.targetId}
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    {log.owner && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            By: {log.owner.email}
                                        </p>
                                    )}

                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                        <details className="mt-2">
                                            <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer">
                                                View metadata
                                            </summary>
                                            <pre className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                        </details>
                                    )}

                                    {log.ipAddress && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            IP: {log.ipAddress}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            No audit logs found for this tenant
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>

    );
}
