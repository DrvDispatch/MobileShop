'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ownerApi, type TenantFeatures } from '@/lib/owner-api';
import { useTenant } from '../tenant-context';

// Tab navigation component for tenant detail pages


// Feature Toggle Switch Component
function FeatureToggle({
    label,
    description,
    enabled,
    disabled,
    onChange,
}: {
    label: string;
    description: string;
    enabled: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className={`flex items-center justify-between py-3 ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex-1 mr-4">
                <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                disabled={disabled}
                onClick={() => !disabled && onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${enabled ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'
                    } ${disabled ? 'cursor-not-allowed' : ''}`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

// Module Card with nested toggles
function ModuleCard({
    icon,
    title,
    mainFeature,
    mainEnabled,
    subFeatures,
    features,
    onFeatureChange,
}: {
    icon: string;
    title: string;
    mainFeature: keyof TenantFeatures;
    mainEnabled: boolean;
    subFeatures: { key: keyof TenantFeatures; label: string; description: string }[];
    features: TenantFeatures;
    onFeatureChange: (key: keyof TenantFeatures, value: boolean) => void;
}) {
    return (
        <Card className={`${!mainEnabled ? 'border-gray-300 dark:border-gray-700' : 'border-violet-200 dark:border-violet-800'}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <span>{title}</span>
                    <span className={`ml-auto text-sm px-2 py-1 rounded-full ${mainEnabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                        {mainEnabled ? 'ON' : 'OFF'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                {/* Main Toggle */}
                <FeatureToggle
                    label="Enable Module"
                    description="Turn this entire module on or off"
                    enabled={mainEnabled}
                    onChange={(value) => onFeatureChange(mainFeature, value)}
                />

                {/* Sub-features (disabled if parent is off) */}
                {subFeatures.length > 0 && (
                    <div className={`ml-4 pl-4 border-l-2 ${mainEnabled ? 'border-violet-200 dark:border-violet-700' : 'border-gray-200 dark:border-gray-700'}`}>
                        {subFeatures.map((sub) => (
                            <FeatureToggle
                                key={sub.key}
                                label={sub.label}
                                description={sub.description}
                                enabled={features[sub.key] as boolean}
                                disabled={!mainEnabled}
                                onChange={(value) => onFeatureChange(sub.key, value)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function TenantFeaturesPage() {
    const router = useRouter();
    const { tenant } = useTenant();

    // Derived from context
    const tenantId = tenant?.id || '';

    const [features, setFeatures] = useState<TenantFeatures | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (tenantId) {
            loadFeatures();
        }
    }, [tenantId]);

    const loadFeatures = async () => {
        try {
            const featuresData = await ownerApi.getFeatures(tenantId);
            setFeatures(featuresData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load features');
            if (err instanceof Error && err.message.includes('Unauthorized')) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFeatureChange = (key: keyof TenantFeatures, value: boolean | number) => {
        if (!features) return;
        setFeatures({ ...features, [key]: value });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!features) return;
        setSaving(true);
        try {
            // Sanitize payload: remove read-only fields that cause backend validation errors
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, tenantId: _tid, ...sanitizedFeatures } = features as any;
            // Also remove timestamps if they exist in the object
            delete sanitizedFeatures.createdAt;
            delete sanitizedFeatures.updatedAt;

            await ownerApi.updateFeatures(tenantId, sanitizedFeatures);
            setHasChanges(false);
            alert('Features saved successfully!');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save features');
        } finally {
            setSaving(false);
        }
    };

    const handleApplyPlan = async (planName: string) => {
        if (!confirm(`Apply "${planName}" plan template? This will overwrite current feature settings.`)) return;
        setSaving(true);
        try {
            const updatedFeatures = await ownerApi.applyPlanTemplate(tenantId, planName);
            setFeatures(updatedFeatures);
            setHasChanges(false);
            alert(`${planName} plan applied successfully!`);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to apply plan');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-lg text-gray-600">Loading features...</div>
            </div>
        );
    }

    if (error || !features) {
        return (
            <div className="flex items-center justify-center p-8">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600 mb-4">{error || 'Failed to load data'}</p>
                        <Button onClick={loadFeatures}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Control</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Toggle features for this tenant. Changes take effect immediately.
                </p>
            </div>

            {/* Plan Templates */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Quick Plan Templates</CardTitle>
                    <CardDescription>Apply a predefined feature bundle</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 flex-wrap">
                        <Button variant="outline" onClick={() => handleApplyPlan('starter')} disabled={saving}>
                            🚀 Starter (Repairs Only)
                        </Button>
                        <Button variant="outline" onClick={() => handleApplyPlan('professional')} disabled={saving}>
                            💼 Professional (All Features)
                        </Button>
                        <Button variant="outline" onClick={() => handleApplyPlan('enterprise')} disabled={saving}>
                            🏢 Enterprise (Advanced)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Feature Modules Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* E-Commerce Module */}
                <ModuleCard
                    icon="🛒"
                    title="E-Commerce"
                    mainFeature="ecommerceEnabled"
                    mainEnabled={features.ecommerceEnabled}
                    subFeatures={[
                        { key: 'refurbishedGrading', label: 'Refurbished Grading', description: 'A/B/C condition badges' },
                        { key: 'wishlistEnabled', label: 'Wishlist', description: 'Customer wishlist feature' },
                        { key: 'stockNotifications', label: 'Stock Notifications', description: 'Back-in-stock alerts' },
                        { key: 'couponsEnabled', label: 'Discount Codes', description: 'Coupon system' },
                    ]}
                    features={features}
                    onFeatureChange={handleFeatureChange}
                />

                {/* Repairs Module */}
                <ModuleCard
                    icon="📅"
                    title="Repair Appointments"
                    mainFeature="repairsEnabled"
                    mainEnabled={features.repairsEnabled}
                    subFeatures={[
                        { key: 'quoteOnRequest', label: 'Quote on Request', description: 'Hide prices, show "Op aanvraag"' },
                        { key: 'mailInRepairs', label: 'Mail-in Repairs', description: 'Shipping label generation' },
                        { key: 'walkInQueue', label: 'Walk-in Queue', description: 'Digital ticket system' },
                    ]}
                    features={features}
                    onFeatureChange={handleFeatureChange}
                />

                {/* Tickets Module */}
                <ModuleCard
                    icon="🎫"
                    title="Support Tickets"
                    mainFeature="ticketsEnabled"
                    mainEnabled={features.ticketsEnabled}
                    subFeatures={[
                        { key: 'liveChatWidget', label: 'Live Chat Widget', description: 'Chat bubble on frontend' },
                    ]}
                    features={features}
                    onFeatureChange={handleFeatureChange}
                />

                {/* Invoicing Module */}
                <ModuleCard
                    icon="🧾"
                    title="Invoicing"
                    mainFeature="invoicingEnabled"
                    mainEnabled={features.invoicingEnabled}
                    subFeatures={[
                        { key: 'vatCalculation', label: 'VAT Calculation', description: 'Automatic BTW/VAT' },
                        { key: 'pdfGeneration', label: 'PDF Generation', description: 'Invoice PDF export' },
                    ]}
                    features={features}
                    onFeatureChange={handleFeatureChange}
                />

                {/* Inventory Module */}
                <ModuleCard
                    icon="📦"
                    title="Inventory"
                    mainFeature="inventoryEnabled"
                    mainEnabled={features.inventoryEnabled}
                    subFeatures={[
                        { key: 'advancedInventory', label: 'Advanced Inventory', description: 'Multi-location, transfers' },
                    ]}
                    features={features}
                    onFeatureChange={handleFeatureChange}
                />

                {/* Team & Analytics */}
                <Card className="border-violet-200 dark:border-violet-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">👥</span>
                            <span>Team & Analytics</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <FeatureToggle
                            label="Employee Management"
                            description="Multiple staff accounts"
                            enabled={features.employeeManagement}
                            onChange={(value) => handleFeatureChange('employeeManagement', value)}
                        />
                        <div className="flex items-center justify-between py-3">
                            <div className="flex-1 mr-4">
                                <p className="font-medium text-gray-900 dark:text-white">Max Admin Users</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Limit of admin accounts</p>
                            </div>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={features.maxAdminUsers}
                                onChange={(e) => handleFeatureChange('maxAdminUsers', parseInt(e.target.value) || 1)}
                                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <FeatureToggle
                            label="Analytics Dashboard"
                            description="Performance metrics"
                            enabled={features.analyticsEnabled}
                            onChange={(value) => handleFeatureChange('analyticsEnabled', value)}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-4 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className={`px-8 py-3 ${hasChanges ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-400'}`}
                >
                    {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
                </Button>
            </div>
        </div>
    );
}
