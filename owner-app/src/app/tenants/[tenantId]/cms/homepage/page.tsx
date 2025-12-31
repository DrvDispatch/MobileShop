'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ownerApi } from '@/lib/owner-api';
import { useTenant } from '../../tenant-context';
import { TenantHomepage, CmsStatus } from '@/types';

export default function HomepageEditorPage() {
    const router = useRouter();
    const { tenant } = useTenant();
    const tenantId = tenant?.id || '';

    const [homepage, setHomepage] = useState<TenantHomepage | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        heroTitle: '',
        heroSubtitle: '',
        heroDescription: '',
        heroCta1Text: '',
        heroCta1Link: '',
        heroCta2Text: '',
        heroCta2Link: '',
        trustBadge1: '',
        trustBadge2: '',
        trustBadge3: '',
        conversionTitle: '',
        conversionFeature1: '',
        conversionFeature2: '',
        conversionFeature3: '',
        showConversionStrip: true,
        showServices: true,
    });

    useEffect(() => {
        if (tenantId) {
            loadHomepage();
        }
    }, [tenantId]);

    const loadHomepage = async () => {
        try {
            const data = await ownerApi.getHomepage(tenantId);
            setHomepage(data);
            setFormData({
                heroTitle: data.heroTitle || '',
                heroSubtitle: data.heroSubtitle || '',
                heroDescription: data.heroDescription || '',
                heroCta1Text: data.heroCta1Text || '',
                heroCta1Link: data.heroCta1Link || '',
                heroCta2Text: data.heroCta2Text || '',
                heroCta2Link: data.heroCta2Link || '',
                trustBadge1: data.trustBadge1 || '',
                trustBadge2: data.trustBadge2 || '',
                trustBadge3: data.trustBadge3 || '',
                conversionTitle: data.conversionTitle || '',
                conversionFeature1: data.conversionFeature1 || '',
                conversionFeature2: data.conversionFeature2 || '',
                conversionFeature3: data.conversionFeature3 || '',
                showConversionStrip: data.showConversionStrip ?? true,
                showServices: data.showServices ?? true,
            });
        } catch (err) {
            console.error('Failed to load homepage:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await ownerApi.updateHomepage(tenantId, formData);
            router.push(`/tenants/${tenantId}/cms`);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save homepage');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!tenant) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link href={`/tenants/${tenantId}/cms`} className="text-violet-600 hover:text-violet-800 text-sm">
                        ← Back to CMS
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Edit Homepage</h2>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="grid gap-6">
                    {/* Hero Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hero Section</CardTitle>
                            <CardDescription>Main banner content</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Hero Title</label>
                                <input
                                    type="text"
                                    value={formData.heroTitle}
                                    onChange={(e) => handleChange('heroTitle', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Problemen met uw toestel?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Hero Subtitle</label>
                                <input
                                    type="text"
                                    value={formData.heroSubtitle}
                                    onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Wij helpen u graag."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Hero Description</label>
                                <textarea
                                    value={formData.heroDescription}
                                    onChange={(e) => handleChange('heroDescription', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    rows={2}
                                    placeholder="Optional longer description..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* CTA Buttons */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Call-to-Action Buttons</CardTitle>
                            <CardDescription>Primary and secondary action buttons</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Primary Button Text</label>
                                    <input
                                        type="text"
                                        value={formData.heroCta1Text}
                                        onChange={(e) => handleChange('heroCta1Text', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Primary Button Link</label>
                                    <input
                                        type="text"
                                        value={formData.heroCta1Link}
                                        onChange={(e) => handleChange('heroCta1Link', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Secondary Button Text</label>
                                    <input
                                        type="text"
                                        value={formData.heroCta2Text}
                                        onChange={(e) => handleChange('heroCta2Text', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Secondary Button Link</label>
                                    <input
                                        type="text"
                                        value={formData.heroCta2Link}
                                        onChange={(e) => handleChange('heroCta2Link', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trust Badges */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Trust Badges</CardTitle>
                            <CardDescription>Short trust statements below the hero</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Badge 1</label>
                                    <input
                                        type="text"
                                        value={formData.trustBadge1}
                                        onChange={(e) => handleChange('trustBadge1', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="Gratis verzending"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Badge 2</label>
                                    <input
                                        type="text"
                                        value={formData.trustBadge2}
                                        onChange={(e) => handleChange('trustBadge2', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="1 jaar garantie"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Badge 3</label>
                                    <input
                                        type="text"
                                        value={formData.trustBadge3}
                                        onChange={(e) => handleChange('trustBadge3', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="Veilig betalen"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conversion Strip */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversion Strip</CardTitle>
                            <CardDescription>Dark banner with features</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showConversionStrip"
                                    checked={formData.showConversionStrip}
                                    onChange={(e) => handleChange('showConversionStrip', e.target.checked)}
                                />
                                <label htmlFor="showConversionStrip" className="text-sm">Show conversion strip</label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.conversionTitle}
                                    onChange={(e) => handleChange('conversionTitle', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Vandaag kapot. Vandaag opgelost."
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Feature 1</label>
                                    <input
                                        type="text"
                                        value={formData.conversionFeature1}
                                        onChange={(e) => handleChange('conversionFeature1', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Feature 2</label>
                                    <input
                                        type="text"
                                        value={formData.conversionFeature2}
                                        onChange={(e) => handleChange('conversionFeature2', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Feature 3</label>
                                    <input
                                        type="text"
                                        value={formData.conversionFeature3}
                                        onChange={(e) => handleChange('conversionFeature3', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section Visibility */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Section Visibility</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showServices"
                                    checked={formData.showServices}
                                    onChange={(e) => handleChange('showServices', e.target.checked)}
                                />
                                <label htmlFor="showServices" className="text-sm">Show services section</label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end gap-4">
                        <Link href={`/tenants/${tenantId}/cms`}>
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
