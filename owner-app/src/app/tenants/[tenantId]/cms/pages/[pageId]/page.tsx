'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ownerApi } from '@/lib/owner-api';
import { useTenant } from '../../../tenant-context';
import { TenantPage, CmsStatus } from '@/types';
import TipTapEditor from '@/components/TipTapEditor';

interface PageEditorProps {
    params: Promise<{ tenantId: string; pageId: string }>;
}

export default function PageEditorPage({ params }: PageEditorProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { tenant } = useTenant();
    const tenantId = tenant?.id || resolvedParams.tenantId;
    const pageId = resolvedParams.pageId;

    const [page, setPage] = useState<TenantPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: {} as unknown, // TipTap JSON content
        seoTitle: '',
        seoDescription: '',
        showInNav: false,
        navOrder: 0,
    });

    useEffect(() => {
        if (tenantId && pageId) {
            loadPage();
        }
    }, [tenantId, pageId]);

    const loadPage = async () => {
        try {
            const data = await ownerApi.getPage(tenantId, pageId);
            setPage(data);

            setFormData({
                title: data.title || '',
                content: data.content || { type: 'doc', content: [] },
                seoTitle: data.seoTitle || '',
                seoDescription: data.seoDescription || '',
                showInNav: data.showInNav ?? false,
                navOrder: data.navOrder ?? 0,
            });
        } catch (err) {
            console.error('Failed to load page:', err);
            alert('Page not found');
            router.push(`/tenants/${tenantId}/cms`);
        } finally {
            setLoading(false);
        }
    };



    const handleSave = async () => {
        setSaving(true);
        try {
            await ownerApi.updatePage(tenantId, pageId, {
                title: formData.title,
                content: formData.content as object,
                seoTitle: formData.seoTitle || undefined,
                seoDescription: formData.seoDescription || undefined,
                showInNav: formData.showInNav,
                navOrder: formData.navOrder,
            });
            router.push(`/tenants/${tenantId}/cms`);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save page');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setSaving(true);
        try {
            await ownerApi.publishPage(tenantId, pageId);
            await loadPage();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to publish page');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: string | boolean | number | unknown) => {
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        Edit Page: {page?.title || 'Loading...'}
                    </h2>
                    {page && (
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/{page.slug}</code>
                            <span className={`text-xs px-2 py-1 rounded ${page.status === CmsStatus.PUBLISHED
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {page.status}
                            </span>
                            {page.isSystemPage && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">System Page</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {page?.status === CmsStatus.DRAFT && (
                        <Button variant="outline" onClick={handlePublish} disabled={saving}>
                            Publish
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="grid gap-6">
                    {/* Title */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Page Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Content</CardTitle>
                            <CardDescription>
                                Use the toolbar to format your content with headings, lists, links, and more.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TipTapEditor
                                content={formData.content}
                                onChange={(newContent) => handleChange('content', newContent)}
                                placeholder="Start writing your page content..."
                            />
                        </CardContent>
                    </Card>

                    {/* SEO */}
                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Settings</CardTitle>
                            <CardDescription>Search engine optimization</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">SEO Title</label>
                                <input
                                    type="text"
                                    value={formData.seoTitle}
                                    onChange={(e) => handleChange('seoTitle', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Leave empty to use page title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">SEO Description</label>
                                <textarea
                                    value={formData.seoDescription}
                                    onChange={(e) => handleChange('seoDescription', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    rows={2}
                                    placeholder="Meta description for search engines"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Navigation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showInNav"
                                    checked={formData.showInNav}
                                    onChange={(e) => handleChange('showInNav', e.target.checked)}
                                />
                                <label htmlFor="showInNav" className="text-sm">Show in navigation menu</label>
                            </div>
                            {formData.showInNav && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nav Order</label>
                                    <input
                                        type="number"
                                        value={formData.navOrder}
                                        onChange={(e) => handleChange('navOrder', parseInt(e.target.value) || 0)}
                                        className="w-24 px-3 py-2 border rounded-md"
                                    />
                                </div>
                            )}
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
