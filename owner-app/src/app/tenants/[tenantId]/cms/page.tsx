'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ownerApi } from '@/lib/owner-api';
import { useTenant } from '../tenant-context';
import { TenantPageListItem, TenantHomepage, CmsStatus } from '@/types';

export default function CmsPage() {
    const { tenant } = useTenant();
    const tenantId = tenant?.id || '';

    const [homepage, setHomepage] = useState<TenantHomepage | null>(null);
    const [pages, setPages] = useState<TenantPageListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showNewPageForm, setShowNewPageForm] = useState(false);
    const [newPageSlug, setNewPageSlug] = useState('');
    const [newPageTitle, setNewPageTitle] = useState('');

    useEffect(() => {
        if (tenantId) {
            loadData();
        }
    }, [tenantId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [homepageData, pagesData] = await Promise.all([
                ownerApi.getHomepage(tenantId),
                ownerApi.listPages(tenantId),
            ]);
            setHomepage(homepageData);
            setPages(pagesData);
        } catch (err) {
            console.error('Failed to load CMS data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedPages = async () => {
        if (!confirm('This will create default pages (About, Terms, Privacy, Returns) for this tenant. Continue?')) return;

        setActionLoading('seed');
        try {
            await ownerApi.seedPages(tenantId);
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to seed pages');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreatePage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPageSlug.trim() || !newPageTitle.trim()) return;

        setActionLoading('create');
        try {
            await ownerApi.createPage(tenantId, {
                slug: newPageSlug.trim().toLowerCase().replace(/\s+/g, '-'),
                title: newPageTitle.trim(),
            });
            setNewPageSlug('');
            setNewPageTitle('');
            setShowNewPageForm(false);
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create page');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePublish = async (pageId: string) => {
        setActionLoading(pageId);
        try {
            await ownerApi.publishPage(tenantId, pageId);
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to publish page');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnpublish = async (pageId: string) => {
        setActionLoading(pageId);
        try {
            await ownerApi.unpublishPage(tenantId, pageId);
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to unpublish page');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (pageId: string, slug: string) => {
        if (!confirm(`Delete page "${slug}"? This cannot be undone.`)) return;

        setActionLoading(pageId);
        try {
            await ownerApi.deletePage(tenantId, pageId);
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete page');
        } finally {
            setActionLoading(null);
        }
    };

    if (!tenant) return null;

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage homepage and pages for this tenant
                </p>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <>
                    {/* Homepage Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>🏠 Homepage</CardTitle>
                            <CardDescription>Edit hero section, trust badges, and conversion strip</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {homepage ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Hero Title:</span>
                                            <p className="font-medium">{homepage.heroTitle}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <span className={`ml-2 text-xs px-2 py-1 rounded ${homepage.status === CmsStatus.PUBLISHED
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {homepage.status}
                                            </span>
                                        </div>
                                    </div>
                                    <Link href={`/tenants/${tenantId}/cms/homepage`}>
                                        <Button>Edit Homepage</Button>
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-gray-500">No homepage configured yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pages Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>📄 Pages ({pages.length})</CardTitle>
                                <CardDescription>Manage static content pages</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {pages.length === 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={handleSeedPages}
                                        disabled={actionLoading === 'seed'}
                                    >
                                        {actionLoading === 'seed' ? 'Seeding...' : 'Seed Default Pages'}
                                    </Button>
                                )}
                                <Button onClick={() => setShowNewPageForm(!showNewPageForm)}>
                                    {showNewPageForm ? 'Cancel' : 'New Page'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* New Page Form */}
                            {showNewPageForm && (
                                <form onSubmit={handleCreatePage} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Page Slug</label>
                                            <input
                                                type="text"
                                                value={newPageSlug}
                                                onChange={(e) => setNewPageSlug(e.target.value)}
                                                placeholder="e.g., faq, shipping"
                                                className="w-full px-3 py-2 border rounded-md"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">URL path: /{newPageSlug || 'slug'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Page Title</label>
                                            <input
                                                type="text"
                                                value={newPageTitle}
                                                onChange={(e) => setNewPageTitle(e.target.value)}
                                                placeholder="e.g., Frequently Asked Questions"
                                                className="w-full px-3 py-2 border rounded-md"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={actionLoading === 'create'}>
                                        {actionLoading === 'create' ? 'Creating...' : 'Create Page'}
                                    </Button>
                                </form>
                            )}

                            {/* Pages Table */}
                            {pages.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="pb-3 font-medium">Page</th>
                                                <th className="pb-3 font-medium">Slug</th>
                                                <th className="pb-3 font-medium">Status</th>
                                                <th className="pb-3 font-medium">Type</th>
                                                <th className="pb-3 font-medium">Updated</th>
                                                <th className="pb-3 font-medium text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pages.map((page) => (
                                                <tr key={page.id} className="border-b">
                                                    <td className="py-3 font-medium">{page.title}</td>
                                                    <td className="py-3">
                                                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                            /{page.slug}
                                                        </code>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`text-xs px-2 py-1 rounded ${page.status === CmsStatus.PUBLISHED
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {page.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        {page.isSystemPage && (
                                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                System
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-sm text-gray-500">
                                                        {new Date(page.updatedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <Link href={`/tenants/${tenantId}/cms/pages/${page.id}`}>
                                                                <Button size="sm" variant="outline">Edit</Button>
                                                            </Link>
                                                            {page.status === CmsStatus.DRAFT ? (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handlePublish(page.id)}
                                                                    disabled={actionLoading === page.id}
                                                                >
                                                                    Publish
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUnpublish(page.id)}
                                                                    disabled={actionLoading === page.id}
                                                                >
                                                                    Unpublish
                                                                </Button>
                                                            )}
                                                            {!page.isSystemPage && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => handleDelete(page.id, page.slug)}
                                                                    disabled={actionLoading === page.id}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No pages yet. Click "Seed Default Pages" to create system pages.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
