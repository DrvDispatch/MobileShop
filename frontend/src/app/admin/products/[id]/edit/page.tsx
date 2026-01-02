"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ChevronLeft, Save, Loader2, Trash2, Copy, Upload, X, ImageIcon,
    Wand2, Battery, HardDrive, Palette, Star,
} from "lucide-react";
import {
    useProductEdit, STORAGE_OPTIONS, COLOR_OPTIONS, GRADE_OPTIONS,
    type ExistingImage, type NewImage, type ProductFormData,
} from "@/lib/admin/products";

export default function EditProductPage() {
    const {
        product, categories, formData, setFormData,
        existingImages, newImages, fileInputRef,
        isLoading, isSaving, isDeleting, isCloning, isUploading,
        error, success, showDeviceSpecs,
        handleNameChange, regenerateSlug, updateField,
        handleFileSelect, removeNewImage, removeExistingImage, triggerFileInput,
        handleSubmit, handleClone, handleDelete,
    } = useProductEdit();

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-8 w-32 bg-zinc-200 rounded animate-pulse" />
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="space-y-4">
                        <div className="h-10 bg-zinc-200 rounded animate-pulse" />
                        <div className="h-10 bg-zinc-200 rounded animate-pulse" />
                        <div className="h-24 bg-zinc-200 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <p className="text-zinc-500 mb-4">Product not found</p>
                <Link href="/admin/products"><Button>Back to Products</Button></Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <Link href="/admin/products" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-2">
                        <ChevronLeft className="w-4 h-4" />Back to Products
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-900">Edit Product</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleClone} disabled={isCloning}>
                        {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}Clone
                    </Button>
                    <Button variant="outline" onClick={handleDelete} disabled={isDeleting} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}Delete
                    </Button>
                </div>
            </div>

            {/* Messages */}
            {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">{error}</div>}
            {success && <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-600">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <BasicInfoSection formData={formData} setFormData={setFormData} handleNameChange={handleNameChange} regenerateSlug={regenerateSlug} />
                        <ImagesSection existingImages={existingImages} newImages={newImages} fileInputRef={fileInputRef}
                            onFileSelect={handleFileSelect} onRemoveExisting={removeExistingImage} onRemoveNew={removeNewImage} onTriggerInput={triggerFileInput} />
                        {showDeviceSpecs && <DeviceSpecsSection formData={formData} setFormData={setFormData} />}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <PricingSection formData={formData} setFormData={setFormData} />
                        <OrganizationSection formData={formData} setFormData={setFormData} categories={categories} />
                        <ActionsSection isSaving={isSaving} isUploading={isUploading} />
                    </div>
                </div>
            </form>
        </div>
    );
}

function BasicInfoSection({ formData, setFormData, handleNameChange, regenerateSlug }: {
    formData: ProductFormData; setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
    handleNameChange: (name: string) => void; regenerateSlug: () => void;
}) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Basic Information</h2>
            <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="slug" className="flex items-center gap-2">
                        URL Slug
                        <button type="button" onClick={regenerateSlug} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            <Wand2 className="w-3 h-3" />Auto
                        </button>
                    </Label>
                    <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input id="shortDescription" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            </div>
        </div>
    );
}

function ImagesSection({ existingImages, newImages, fileInputRef, onFileSelect, onRemoveExisting, onRemoveNew, onTriggerInput }: {
    existingImages: ExistingImage[]; newImages: NewImage[];
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveExisting: (i: number) => void; onRemoveNew: (i: number) => void;
    onTriggerInput: () => void;
}) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-zinc-900">Product Images</h2>
                <button type="button" onClick={onTriggerInput} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Upload className="w-4 h-4" />Add Images
                </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFileSelect} className="hidden" />

            {existingImages.length === 0 && newImages.length === 0 ? (
                <div onClick={onTriggerInput} className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center cursor-pointer hover:border-zinc-400 transition-colors">
                    <ImageIcon className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                    <p className="text-sm text-zinc-600">Click to upload product images</p>
                    <p className="text-xs text-zinc-400">JPG, PNG, WebP (max 10MB each)</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {existingImages.map((img, i) => (
                        <div key={img.id} className="relative aspect-square bg-zinc-100 rounded-lg overflow-hidden group">
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => onRemoveExisting(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                            </button>
                            {i === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-zinc-900 text-white text-xs rounded">Main</span>}
                        </div>
                    ))}
                    {newImages.map((p, i) => (
                        <div key={`new-${i}`} className="relative aspect-square bg-zinc-100 rounded-lg overflow-hidden group">
                            <img src={p.preview} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => onRemoveNew(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded">New</span>
                        </div>
                    ))}
                    <div onClick={onTriggerInput} className="aspect-square border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors">
                        <Upload className="w-6 h-6 text-zinc-400" />
                    </div>
                </div>
            )}
        </div>
    );
}

function DeviceSpecsSection({ formData, setFormData }: { formData: ProductFormData; setFormData: React.Dispatch<React.SetStateAction<ProductFormData>> }) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Device Specifications</h2>
            <p className="text-sm text-zinc-500">For refurbished/used devices</p>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Battery className="w-4 h-4" />Battery Health: {formData.batteryHealth}%</Label>
                    <input type="range" min="50" max="100" value={formData.batteryHealth} onChange={(e) => setFormData({ ...formData, batteryHealth: parseInt(e.target.value) })}
                        className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Star className="w-4 h-4" />Grade</Label>
                    <select value={formData.deviceGrade} onChange={(e) => setFormData({ ...formData, deviceGrade: e.target.value as 'A_PLUS' | 'A' | 'B' | 'C' | '' })} className="w-full h-10 px-3 rounded-lg border border-zinc-200">
                        <option value="">Select grade</option>
                        {GRADE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><HardDrive className="w-4 h-4" />Storage</Label>
                    <select value={formData.storage} onChange={(e) => setFormData({ ...formData, storage: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-zinc-200">
                        <option value="">Select storage</option>
                        {STORAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Palette className="w-4 h-4" />Color</Label>
                    <select value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-zinc-200">
                        <option value="">Select color</option>
                        {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}

function PricingSection({ formData, setFormData }: { formData: ProductFormData; setFormData: React.Dispatch<React.SetStateAction<ProductFormData>> }) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Pricing</h2>
            <div className="space-y-2">
                <Label htmlFor="price">Price (€) *</Label>
                <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price (€)</Label>
                <Input id="compareAtPrice" type="number" step="0.01" min="0" value={formData.compareAtPrice} onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="stockQty">Stock *</Label>
                <Input id="stockQty" type="number" min="0" value={formData.stockQty} onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })} required />
            </div>
        </div>
    );
}

function OrganizationSection({ formData, setFormData, categories }: {
    formData: ProductFormData; setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
    categories: { id: string; name: string }[];
}) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Organization</h2>
            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-zinc-200">
                    <option value="">No category</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <select id="condition" value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value as 'NEW' | 'USED' | 'REFURBISHED' })} className="w-full h-10 px-3 rounded-lg border border-zinc-200">
                    <option value="NEW">New</option>
                    <option value="USED">Used</option>
                    <option value="REFURBISHED">Refurbished</option>
                </select>
            </div>
            <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-zinc-300" />
                    <span className="text-sm">Active (visible on store)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-zinc-300" />
                    <span className="text-sm">Featured on homepage</span>
                </label>
            </div>
        </div>
    );
}

function ActionsSection({ isSaving, isUploading }: { isSaving: boolean; isUploading: boolean }) {
    return (
        <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={isSaving || isUploading}>
                {isSaving || isUploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isUploading ? "Uploading..." : "Saving..."}</>
                ) : (
                    <><Save className="w-4 h-4 mr-2" />Save Changes</>
                )}
            </Button>
            <Link href="/admin/products" className="block">
                <Button type="button" variant="outline" className="w-full">Cancel</Button>
            </Link>
        </div>
    );
}
