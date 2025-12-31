'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ownerApi, TenantUser } from '@/lib/owner-api';
import { UserPlus, Key, RefreshCw, X } from 'lucide-react';

export default function TenantUsersPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modals state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState<string | null>(null); // userId or null

    // Form state
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [resetPassword, setResetPassword] = useState('');
    const [generatedPass, setGeneratedPass] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await ownerApi.getTenantUsers(tenantId);
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [tenantId]);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const result = await ownerApi.createTenantUser(tenantId, {
                name: formData.name,
                email: formData.email,
                role: 'ADMIN', // Explicitly creating Admin
                password: formData.password || undefined
            });

            // If backend generated a password (and returned it), show it
            if ((result as any).initialPassword) {
                setGeneratedPass((result as any).initialPassword);
            } else {
                setShowCreateModal(false);
                setFormData({ name: '', email: '', password: '' });
                alert('Admin user created successfully!');
            }
            fetchUsers();
        } catch (error: any) {
            alert('Failed to create user: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showResetModal) return;

        setActionLoading(true);
        try {
            const result = await ownerApi.resetUserPassword(tenantId, showResetModal, resetPassword || undefined);

            if ((result as any).newPassword) {
                setGeneratedPass((result as any).newPassword);
            } else {
                setShowResetModal(null);
                setResetPassword('');
                alert('Password reset successfully!');
            }
        } catch (error: any) {
            alert('Failed to reset password: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setShowResetModal(null);
        setGeneratedPass(null);
        setFormData({ name: '', email: '', password: '' });
        setResetPassword('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Management</h2>
                <Button onClick={() => setShowCreateModal(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Admin
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading users...</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Name</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Email</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Role</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-3 px-4 font-medium">{user.name}</td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <StatusBadge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowResetModal(user.id)}
                                                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                    title="Reset Password"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Create Admin Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                            <CardTitle>Create Admin User</CardTitle>
                            <button onClick={closeModals}><X className="w-5 h-5 text-gray-500" /></button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {generatedPass ? (
                                <div className="space-y-4 text-center">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                        <p className="text-green-800 dark:text-green-300 font-medium mb-2">User Created Successfully!</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Generated Password:</p>
                                        <code className="bg-white dark:bg-black px-3 py-1 rounded text-lg font-mono border select-all">
                                            {generatedPass}
                                        </code>
                                    </div>
                                    <p className="text-sm text-red-500">Copy this password now. It will not be shown again.</p>
                                    <Button onClick={closeModals} className="w-full">Close</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateAdmin} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <input
                                            required
                                            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="admin@tenant.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Password (Optional)</label>
                                        <input
                                            type="password"
                                            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Leave empty to auto-generate"
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="pt-2 flex gap-2 justify-end">
                                        <Button type="button" variant="outline" onClick={closeModals}>Cancel</Button>
                                        <Button type="submit" disabled={actionLoading}>
                                            {actionLoading ? 'Creating...' : 'Create Admin'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                            <CardTitle>Reset Password</CardTitle>
                            <button onClick={closeModals}><X className="w-5 h-5 text-gray-500" /></button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {generatedPass ? (
                                <div className="space-y-4 text-center">
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-2">Password Reset Successful!</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Password:</p>
                                        <code className="bg-white dark:bg-black px-3 py-1 rounded text-lg font-mono border select-all">
                                            {generatedPass}
                                        </code>
                                    </div>
                                    <p className="text-sm text-red-500">Copy this password now. It will not be shown again.</p>
                                    <Button onClick={closeModals} className="w-full">Close</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Resetting password for this user. You can provide a specific password or leave it blank to auto-generate one.
                                    </p>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">New Password (Optional)</label>
                                        <input
                                            type="password"
                                            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            placeholder="Leave empty to auto-generate"
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="pt-2 flex gap-2 justify-end">
                                        <Button type="button" variant="outline" onClick={closeModals}>Cancel</Button>
                                        <Button type="submit" disabled={actionLoading} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                            {actionLoading ? 'Resetting...' : 'Reset Password'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
