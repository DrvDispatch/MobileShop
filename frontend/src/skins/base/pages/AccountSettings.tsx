'use client';

/**
 * Base Skin - Account Settings Page
 * PURE PRESENTATION ONLY
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AccountSettingsPageVM } from '@core/hooks/pages/useAccountSettingsPageVM';
import { ChevronLeft, Save, Eye, EyeOff, Loader2 } from 'lucide-react';

export interface AccountSettingsPageProps {
    vm: AccountSettingsPageVM;
}

function LoadingSkeleton() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-zinc-200 rounded w-1/3" />
                <div className="h-64 bg-zinc-200 rounded" />
            </div>
        </div>
    );
}

export function AccountSettingsPage({ vm }: AccountSettingsPageProps) {
    if (vm.isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/account" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-4">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Account
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900">Account Settings</h1>
            </div>

            {/* Profile Form */}
            <form onSubmit={vm.onSubmitProfile} className="space-y-6">
                <div className="bg-zinc-50 rounded-xl p-6 space-y-6">
                    <h2 className="font-semibold text-zinc-900">Personal Information</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={vm.formData.name}
                                onChange={(e) => vm.onFormChange('name', e.target.value)}
                                placeholder="Your name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={vm.formData.email} disabled className="bg-zinc-100" />
                            <p className="text-xs text-zinc-500">Email cannot be changed. Contact support if needed.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={vm.formData.phone}
                                onChange={(e) => vm.onFormChange('phone', e.target.value)}
                                placeholder="+32 465 63 81 06"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-50 rounded-xl p-6 space-y-6">
                    <h2 className="font-semibold text-zinc-900">Security</h2>
                    {!vm.showPasswordForm ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-zinc-900">Password</p>
                                <p className="text-sm text-zinc-500">Change your password</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => vm.onTogglePasswordForm(true)}>
                                Change Password
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="font-medium text-zinc-900">Change Password</p>
                                <Button type="button" variant="ghost" size="sm" onClick={() => vm.onTogglePasswordForm(false)}>
                                    Cancel
                                </Button>
                            </div>

                            {vm.passwordError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{vm.passwordError}</div>
                            )}
                            {vm.passwordSuccess && (
                                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">Password changed successfully!</div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={vm.showCurrentPassword ? "text" : "password"}
                                        value={vm.passwordData.currentPassword}
                                        onChange={(e) => vm.onPasswordChange('currentPassword', e.target.value)}
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                        onClick={vm.onToggleShowCurrentPassword}
                                    >
                                        {vm.showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={vm.showNewPassword ? "text" : "password"}
                                        value={vm.passwordData.newPassword}
                                        onChange={(e) => vm.onPasswordChange('newPassword', e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                        onClick={vm.onToggleShowNewPassword}
                                    >
                                        {vm.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500">Must be at least 8 characters</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={vm.passwordData.confirmPassword}
                                    onChange={(e) => vm.onPasswordChange('confirmPassword', e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <Button type="button" variant="default" size="sm" onClick={vm.onSubmitPassword}>
                                Update Password
                            </Button>
                        </div>
                    )}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={vm.isSaving}>
                    {vm.isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {vm.isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </form>
        </div>
    );
}
