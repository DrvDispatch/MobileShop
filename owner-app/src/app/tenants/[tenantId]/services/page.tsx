'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTenant } from '../tenant-context';

// Types for services
interface ServiceCategory {
    id: string;
    tenantId: string;
    parentId: string | null;
    name: string;
    slug: string;
    icon?: string | null;
    image?: string | null;
    description?: string | null;
    depth: number;
    sortOrder: number;
    isActive: boolean;
    children?: ServiceCategory[];
    services?: Service[];
    _count?: { services: number; children: number };
}

interface Service {
    id: string;
    tenantId: string;
    categoryId: string | null;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    price?: number | null;
    priceDisplay?: string | null;
    duration?: number | null;
    durationText?: string | null;
    sortOrder: number;
    isActive: boolean;
    category?: ServiceCategory | null;
}

interface BookingFlowConfig {
    steps: string[];
    terminology: Record<string, string> | null;
}

// Simple API helper that sends token from localStorage
async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('ownerToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };
    const response = await fetch(url, { ...options, headers, credentials: 'include' });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Request failed');
    }
    return response.json();
}

// Available booking steps
const AVAILABLE_STEPS = [
    { id: 'select_category', label: 'Select Category', description: 'Navigate category hierarchy' },
    { id: 'select_service', label: 'Select Service', description: 'Choose a service' },
    { id: 'select_time', label: 'Select Date/Time', description: 'Pick appointment slot' },
    { id: 'contact', label: 'Contact Info', description: 'Enter customer details' },
    { id: 'confirm', label: 'Confirm', description: 'Review and submit' },
];

export default function TenantServicesPage() {
    const router = useRouter();
    const { tenant } = useTenant();
    const tenantId = tenant?.id || '';
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // State
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [flowConfig, setFlowConfig] = useState<BookingFlowConfig>({ steps: ['select_service', 'select_time', 'contact'], terminology: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'categories' | 'services' | 'flow'>('services');

    // Edit modals
    const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
    const [editingCategory, setEditingCategory] = useState<Partial<ServiceCategory> | null>(null);

    useEffect(() => {
        if (tenantId) {
            loadData();
        }
    }, [tenantId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [categoriesRes, servicesRes, flowRes] = await Promise.all([
                fetchWithAuth(`${apiBase}/api/services/admin/categories`, {
                    headers: { 'x-tenant-id': tenantId },
                }),
                fetchWithAuth(`${apiBase}/api/services/admin/list`, {
                    headers: { 'x-tenant-id': tenantId },
                }),
                fetchWithAuth(`${apiBase}/api/services/booking-flow`, {
                    headers: { 'x-tenant-id': tenantId },
                }).catch(() => ({ steps: ['select_service', 'select_time', 'contact'], terminology: null })),
            ]);
            setCategories(categoriesRes || []);
            setServices(servicesRes || []);
            setFlowConfig(flowRes);
        } catch (err) {
            console.error('Failed to load services data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Service CRUD
    const saveService = async () => {
        if (!editingService) return;
        setSaving(true);
        try {
            if (editingService.id) {
                // Update
                await fetchWithAuth(`${apiBase}/api/services/admin/services/${editingService.id}`, {
                    method: 'PUT',
                    headers: { 'x-tenant-id': tenantId },
                    body: JSON.stringify(editingService),
                });
            } else {
                // Create
                await fetchWithAuth(`${apiBase}/api/services/admin/services`, {
                    method: 'POST',
                    headers: { 'x-tenant-id': tenantId },
                    body: JSON.stringify(editingService),
                });
            }
            setEditingService(null);
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const deleteService = async (id: string) => {
        if (!confirm('Delete this service?')) return;
        try {
            await fetchWithAuth(`${apiBase}/api/services/admin/services/${id}`, {
                method: 'DELETE',
                headers: { 'x-tenant-id': tenantId },
            });
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete');
        }
    };

    // Category CRUD
    const saveCategory = async () => {
        if (!editingCategory) return;
        setSaving(true);
        try {
            if (editingCategory.id) {
                await fetchWithAuth(`${apiBase}/api/services/admin/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    headers: { 'x-tenant-id': tenantId },
                    body: JSON.stringify(editingCategory),
                });
            } else {
                await fetchWithAuth(`${apiBase}/api/services/admin/categories`, {
                    method: 'POST',
                    headers: { 'x-tenant-id': tenantId },
                    body: JSON.stringify(editingCategory),
                });
            }
            setEditingCategory(null);
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm('Delete this category? Services will become uncategorized.')) return;
        try {
            await fetchWithAuth(`${apiBase}/api/services/admin/categories/${id}`, {
                method: 'DELETE',
                headers: { 'x-tenant-id': tenantId },
            });
            await loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete');
        }
    };

    // Flow config
    const toggleStep = (stepId: string) => {
        const current = flowConfig.steps || [];
        if (current.includes(stepId)) {
            setFlowConfig({ ...flowConfig, steps: current.filter(s => s !== stepId) });
        } else {
            setFlowConfig({ ...flowConfig, steps: [...current, stepId] });
        }
    };

    const saveFlowConfig = async () => {
        setSaving(true);
        try {
            await fetchWithAuth(`${apiBase}/api/services/admin/booking-flow`, {
                method: 'PUT',
                headers: { 'x-tenant-id': tenantId },
                body: JSON.stringify(flowConfig),
            });
            alert('Booking flow saved!');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-lg text-gray-600">Loading services...</div>
            </div>
        );
    }

    if (error && !categories.length && !services.length) {
        return (
            <div className="flex items-center justify-center p-8">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={loadData}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Service Catalog</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage services and booking flow for this tenant.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                {[
                    { id: 'services', label: 'Services', count: services.length },
                    { id: 'categories', label: 'Categories', count: categories.length },
                    { id: 'flow', label: 'Booking Flow' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-3 px-1 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-violet-600 text-violet-600 font-medium'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        {tab.label} {tab.count !== undefined && <span className="ml-1 text-sm opacity-60">({tab.count})</span>}
                    </button>
                ))}
            </div>

            {/* Services Tab */}
            {activeTab === 'services' && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Services</CardTitle>
                            <CardDescription>Bookable services for this tenant</CardDescription>
                        </div>
                        <Button onClick={() => setEditingService({ name: '', slug: '', isActive: true, sortOrder: 0 })}>
                            + Add Service
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {services.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No services yet. Add your first service above.</p>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b dark:border-gray-700 text-left">
                                        <th className="pb-2">Name</th>
                                        <th className="pb-2">Price</th>
                                        <th className="pb-2">Duration</th>
                                        <th className="pb-2">Category</th>
                                        <th className="pb-2">Active</th>
                                        <th className="pb-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map(service => (
                                        <tr key={service.id} className="border-b dark:border-gray-800">
                                            <td className="py-3 font-medium">{service.name}</td>
                                            <td className="py-3">{service.priceDisplay || (service.price ? `€${service.price}` : '—')}</td>
                                            <td className="py-3">{service.durationText || (service.duration ? `${service.duration} min` : '—')}</td>
                                            <td className="py-3 text-gray-500">{service.category?.name || '—'}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {service.isActive ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <Button variant="ghost" onClick={() => setEditingService(service)}>Edit</Button>
                                                <Button variant="ghost" onClick={() => deleteService(service.id)} className="text-red-600">Delete</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Categories</CardTitle>
                            <CardDescription>Organize services into categories</CardDescription>
                        </div>
                        <Button onClick={() => setEditingCategory({ name: '', slug: '', isActive: true, sortOrder: 0 })}>
                            + Add Category
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {categories.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No categories yet. Categories are optional for flat service lists.</p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map(category => (
                                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{category.icon || '📁'}</span>
                                            <div>
                                                <p className="font-medium">{category.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {category._count?.services || 0} services • depth: {category.depth}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <Button variant="ghost" onClick={() => setEditingCategory(category)}>Edit</Button>
                                            <Button variant="ghost" onClick={() => deleteCategory(category.id)} className="text-red-600">Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Booking Flow Tab */}
            {activeTab === 'flow' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Booking Flow Configuration</CardTitle>
                        <CardDescription>Select which steps appear in the booking wizard</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {AVAILABLE_STEPS.map(step => (
                            <div key={step.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div>
                                    <p className="font-medium">{step.label}</p>
                                    <p className="text-sm text-gray-500">{step.description}</p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={flowConfig.steps?.includes(step.id)}
                                    onClick={() => toggleStep(step.id)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${flowConfig.steps?.includes(step.id) ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${flowConfig.steps?.includes(step.id) ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 mb-2">Current flow order:</p>
                            <div className="flex gap-2 flex-wrap">
                                {(flowConfig.steps || []).map((stepId, i) => (
                                    <span key={stepId} className="px-3 py-1 bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 rounded-full text-sm">
                                        {i + 1}. {AVAILABLE_STEPS.find(s => s.id === stepId)?.label || stepId}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <Button onClick={saveFlowConfig} disabled={saving} className="mt-4">
                            {saving ? 'Saving...' : 'Save Flow Configuration'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Service Edit Modal */}
            {editingService && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <CardTitle>{editingService.id ? 'Edit Service' : 'Add Service'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={editingService.name || ''}
                                    onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                    placeholder="e.g. Classic Haircut"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Slug *</label>
                                <input
                                    type="text"
                                    value={editingService.slug || ''}
                                    onChange={e => setEditingService({ ...editingService, slug: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                    placeholder="e.g. classic-haircut"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (€)</label>
                                    <input
                                        type="number"
                                        value={editingService.price || ''}
                                        onChange={e => setEditingService({ ...editingService, price: parseFloat(e.target.value) || null })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                        placeholder="25.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration (min)</label>
                                    <input
                                        type="number"
                                        value={editingService.duration || ''}
                                        onChange={e => setEditingService({ ...editingService, duration: parseInt(e.target.value) || null })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                        placeholder="30"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    value={editingService.categoryId || ''}
                                    onChange={e => setEditingService({ ...editingService, categoryId: e.target.value || null })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                >
                                    <option value="">No category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={editingService.description || ''}
                                    onChange={e => setEditingService({ ...editingService, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                    rows={2}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setEditingService(null)}>Cancel</Button>
                                <Button onClick={saveService} disabled={saving || !editingService.name || !editingService.slug}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Category Edit Modal */}
            {editingCategory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <CardTitle>{editingCategory.id ? 'Edit Category' : 'Add Category'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={editingCategory.name || ''}
                                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                    placeholder="e.g. Haircuts"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Slug *</label>
                                <input
                                    type="text"
                                    value={editingCategory.slug || ''}
                                    onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                    placeholder="e.g. haircuts"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
                                <input
                                    type="text"
                                    value={editingCategory.icon || ''}
                                    onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                    placeholder="✂️"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Parent Category</label>
                                <select
                                    value={editingCategory.parentId || ''}
                                    onChange={e => setEditingCategory({ ...editingCategory, parentId: e.target.value || null })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                                >
                                    <option value="">No parent (root)</option>
                                    {categories.filter(c => c.id !== editingCategory.id).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                                <Button onClick={saveCategory} disabled={saving || !editingCategory.name || !editingCategory.slug}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
