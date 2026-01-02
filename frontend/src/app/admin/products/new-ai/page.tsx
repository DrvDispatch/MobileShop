"use client";

import Link from "next/link";
import {
    useProductAI,
    BRANDS,
    STORAGE_OPTIONS,
    CONDITIONS,
    PRODUCT_TYPES,
    DEVICE_GRADES,
    PLACEHOLDER_IMAGE,
    type AIProductType as ProductType,
    type AICondition as Condition,
    type AIDeviceGrade as DeviceGrade,
} from "@/lib/admin/products";

export default function NewProductWithAI() {
    const {
        step, setStep,
        categories, selectedCategory, setSelectedCategory,
        productType, setProductType,
        modelName, setModelName,
        brand, setBrand,
        condition, setCondition,
        inputStorage, setInputStorage,
        inputColor, setInputColor,
        deviceImage, deviceImagePreview,
        handleDeviceImageUpload, removeDeviceImage,
        generatedContent, imageAnalysis,
        isGenerating, isAnalyzing,
        editableTitle, setEditableTitle,
        editableShortDesc, setEditableShortDesc,
        editableLongDesc, setEditableLongDesc,
        editableColor, setEditableColor,
        editableStorage, setEditableStorage,
        batteryHealth, setBatteryHealth,
        deviceGrade, setDeviceGrade,
        price, setPrice,
        comparePrice, setComparePrice,
        stockQty, setStockQty,
        isFeatured, setIsFeatured,
        isOnSale, setIsOnSale,
        selectedImages, toggleImageSelection,
        manualImagePreviews,
        handleManualImageUpload, removeManualImage,
        includeDeviceImage, setIncludeDeviceImage,
        totalSelectedImages,
        handleGenerate, handleSave,
        isSaving, error,
        discountPreview,
    } = useProductAI();

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <Link href="/admin/products" className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                            ← Back to Products
                        </Link>
                        <h1 className="text-2xl font-bold text-zinc-900 mt-1">Add Product with AI</h1>
                    </div>
                    <Link href="/admin/products/new" className="text-sm text-zinc-600 hover:text-zinc-900 underline">
                        Use manual entry instead
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto py-8 px-6">
                {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

                {/* Step 1: Input */}
                {step === "input" && (
                    <InputStep
                        productType={productType} setProductType={setProductType}
                        categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                        modelName={modelName} setModelName={setModelName}
                        brand={brand} setBrand={setBrand}
                        inputStorage={inputStorage} setInputStorage={setInputStorage}
                        inputColor={inputColor} setInputColor={setInputColor}
                        condition={condition} setCondition={setCondition}
                        deviceImagePreview={deviceImagePreview}
                        handleDeviceImageUpload={handleDeviceImageUpload}
                        removeDeviceImage={removeDeviceImage}
                        isGenerating={isGenerating}
                        onGenerate={handleGenerate}
                    />
                )}

                {/* Step 2: Review & Edit */}
                {step === "review" && generatedContent && (
                    <ReviewStep
                        productType={productType}
                        imageAnalysis={imageAnalysis}
                        isAnalyzing={isAnalyzing}
                        editableTitle={editableTitle} setEditableTitle={setEditableTitle}
                        editableShortDesc={editableShortDesc} setEditableShortDesc={setEditableShortDesc}
                        editableLongDesc={editableLongDesc} setEditableLongDesc={setEditableLongDesc}
                        editableColor={editableColor} setEditableColor={setEditableColor}
                        editableStorage={editableStorage} setEditableStorage={setEditableStorage}
                        batteryHealth={batteryHealth} setBatteryHealth={setBatteryHealth}
                        deviceGrade={deviceGrade} setDeviceGrade={setDeviceGrade}
                        price={price} setPrice={setPrice}
                        comparePrice={comparePrice} setComparePrice={setComparePrice}
                        stockQty={stockQty} setStockQty={setStockQty}
                        isFeatured={isFeatured} setIsFeatured={setIsFeatured}
                        isOnSale={isOnSale} setIsOnSale={setIsOnSale}
                        discountPreview={discountPreview}
                        suggestedImages={generatedContent.suggestedImages}
                        selectedImages={selectedImages}
                        toggleImageSelection={toggleImageSelection}
                        deviceImagePreview={deviceImagePreview}
                        includeDeviceImage={includeDeviceImage}
                        setIncludeDeviceImage={setIncludeDeviceImage}
                        manualImagePreviews={manualImagePreviews}
                        handleManualImageUpload={handleManualImageUpload}
                        removeManualImage={removeManualImage}
                        totalSelectedImages={totalSelectedImages}
                        onBack={() => setStep("input")}
                        onSave={handleSave}
                        isSaving={isSaving}
                    />
                )}
            </div>
        </div>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface InputStepProps {
    productType: ProductType; setProductType: (t: ProductType) => void;
    categories: { id: string; name: string; slug: string }[];
    selectedCategory: string; setSelectedCategory: (c: string) => void;
    modelName: string; setModelName: (m: string) => void;
    brand: string; setBrand: (b: string) => void;
    inputStorage: string; setInputStorage: (s: string) => void;
    inputColor: string; setInputColor: (c: string) => void;
    condition: Condition; setCondition: (c: Condition) => void;
    deviceImagePreview: string | null;
    handleDeviceImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeDeviceImage: () => void;
    isGenerating: boolean;
    onGenerate: () => void;
}

function InputStep(props: InputStepProps) {
    const { productType, setProductType, categories, selectedCategory, setSelectedCategory, modelName, setModelName, brand, setBrand, inputStorage, setInputStorage, inputColor, setInputColor, condition, setCondition, deviceImagePreview, handleDeviceImageUpload, removeDeviceImage, isGenerating, onGenerate } = props;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold mb-6">Tell us about the product</h2>
            <div className="space-y-6">
                {/* Product Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-3">Product Type *</label>
                    <div className="grid grid-cols-3 gap-3">
                        {PRODUCT_TYPES.map(type => (
                            <button key={type.value} type="button" onClick={() => setProductType(type.value)}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${productType === type.value ? "border-blue-500 bg-blue-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                                <span className="text-lg">{type.label}</span>
                                <p className="text-xs text-zinc-500 mt-1">{type.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Category *</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Select a category...</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>

                {/* Model Name */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">{productType === "PHONE" ? "Device Model *" : "Product Name *"}</label>
                    <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)}
                        placeholder={productType === "PHONE" ? "e.g., iPhone 16 Pro Max" : "e.g., Screen Protector for iPhone 16"}
                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    <p className="mt-1 text-sm text-zinc-500">
                        {productType === "PHONE" ? "Enter the device model name (AI will research specs and find images)" : "Enter the product name"}
                    </p>
                </div>

                {/* Brand, Storage, Color, Condition */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Brand</label>
                        <select value={brand} onChange={(e) => setBrand(e.target.value)}
                            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Storage</label>
                        <select value={inputStorage} onChange={(e) => setInputStorage(e.target.value)}
                            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Select...</option>
                            {STORAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Color (optional)</label>
                        <input type="text" value={inputColor} onChange={(e) => setInputColor(e.target.value)} placeholder="e.g., Black"
                            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Condition</label>
                        <select value={condition} onChange={(e) => setCondition(e.target.value as Condition)}
                            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Device Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Upload Device Photo (Optional)</label>
                    <p className="text-sm text-zinc-500 mb-3">AI will analyze the image to detect color and condition.</p>
                    <div className="flex items-start gap-4">
                        <label className="flex-1 flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                            <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-zinc-600">Click to upload</span>
                            <input type="file" accept="image/*" onChange={handleDeviceImageUpload} className="hidden" />
                        </label>
                        {deviceImagePreview && (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-zinc-200">
                                <img src={deviceImagePreview} alt="Device preview" className="w-full h-full object-cover" />
                                <button onClick={removeDeviceImage} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">×</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Generate Button */}
                <button onClick={onGenerate} disabled={isGenerating || !modelName.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isGenerating ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating with AI...</> : "Generate Product Content"}
                </button>
            </div>
        </div>
    );
}

interface ReviewStepProps {
    productType: string;
    imageAnalysis: { detectedColor: string; conditionAssessment: string; confidence: number } | null;
    isAnalyzing: boolean;
    editableTitle: string; setEditableTitle: (t: string) => void;
    editableShortDesc: string; setEditableShortDesc: (d: string) => void;
    editableLongDesc: string; setEditableLongDesc: (d: string) => void;
    editableColor: string; setEditableColor: (c: string) => void;
    editableStorage: string; setEditableStorage: (s: string) => void;
    batteryHealth: string; setBatteryHealth: (b: string) => void;
    deviceGrade: DeviceGrade; setDeviceGrade: (g: DeviceGrade) => void;
    price: string; setPrice: (p: string) => void;
    comparePrice: string; setComparePrice: (p: string) => void;
    stockQty: string; setStockQty: (q: string) => void;
    isFeatured: boolean; setIsFeatured: (f: boolean) => void;
    isOnSale: boolean; setIsOnSale: (s: boolean) => void;
    discountPreview: { amount: number; percent: number } | null;
    suggestedImages: { url: string; alt: string }[];
    selectedImages: string[];
    toggleImageSelection: (url: string) => void;
    deviceImagePreview: string | null;
    includeDeviceImage: boolean;
    setIncludeDeviceImage: (include: boolean) => void;
    manualImagePreviews: string[];
    handleManualImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeManualImage: (index: number) => void;
    totalSelectedImages: number;
    onBack: () => void;
    onSave: () => void;
    isSaving: boolean;
}

function ReviewStep(props: ReviewStepProps) {
    return (
        <div className="space-y-6">
            {/* Image Analysis Results */}
            {props.imageAnalysis && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2">Image Analysis Results</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><span className="text-zinc-600">Color:</span> <span className="font-medium">{props.imageAnalysis.detectedColor}</span></div>
                        <div><span className="text-zinc-600">Condition:</span> <span className="font-medium">{props.imageAnalysis.conditionAssessment}</span></div>
                        <div><span className="text-zinc-600">Confidence:</span> <span className="font-medium">{props.imageAnalysis.confidence}%</span></div>
                    </div>
                </div>
            )}

            {props.isAnalyzing && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-blue-700">Analyzing your device image...</span>
                </div>
            )}

            {/* Editable Content */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold mb-6">Review & Edit Generated Content</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Product Title</label>
                        <input type="text" value={props.editableTitle} onChange={(e) => props.setEditableTitle(e.target.value)} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Short Description</label>
                        <textarea value={props.editableShortDesc} onChange={(e) => props.setEditableShortDesc(e.target.value)} rows={2} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Full Description</label>
                        <textarea value={props.editableLongDesc} onChange={(e) => props.setEditableLongDesc(e.target.value)} rows={6} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Color</label>
                            <input type="text" value={props.editableColor} onChange={(e) => props.setEditableColor(e.target.value)} placeholder="e.g., Desert Titanium" className="w-full px-4 py-2 border border-zinc-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Storage</label>
                            <input type="text" value={props.editableStorage} onChange={(e) => props.setEditableStorage(e.target.value)} placeholder="e.g., 128GB" className="w-full px-4 py-2 border border-zinc-300 rounded-lg" />
                        </div>
                    </div>

                    {props.productType === "PHONE" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Battery Health (%)</label>
                                <input type="number" min="0" max="100" value={props.batteryHealth} onChange={(e) => props.setBatteryHealth(e.target.value)} placeholder="100" className="w-full px-4 py-2 border border-zinc-300 rounded-lg" />
                                <p className="mt-1 text-xs text-zinc-500">0-100%, typical range for refurbished is 80-100%</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Device Grade</label>
                                <select value={props.deviceGrade} onChange={(e) => props.setDeviceGrade(e.target.value as DeviceGrade)} className="w-full px-4 py-2 border border-zinc-300 rounded-lg">
                                    {DEVICE_GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Pricing */}
                    <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                        <h3 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />Pricing (Required)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Price (€) <span className="text-red-500">*</span></label>
                                <input type="number" min="0" step="0.01" value={props.price} onChange={(e) => props.setPrice(e.target.value)} placeholder="899.00"
                                    className={`w-full px-4 py-2 border rounded-lg ${!props.price ? "border-orange-400 bg-orange-50" : "border-zinc-300"}`} />
                                {!props.price && <p className="mt-1 text-xs text-orange-600">⚠️ Price is required</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Compare at Price (€)</label>
                                <input type="number" min="0" step="0.01" value={props.comparePrice} onChange={(e) => props.setComparePrice(e.target.value)} placeholder="1199.00" className="w-full px-4 py-2 border border-zinc-300 rounded-lg" />
                                <p className="mt-1 text-xs text-zinc-500">Original price for showing discount</p>
                            </div>
                        </div>
                        {props.discountPreview && (
                            <div className="mt-3 p-2 bg-green-100 rounded-lg flex items-center gap-2 text-green-700">
                                <span className="font-medium">Save €{props.discountPreview.amount.toFixed(2)} ({props.discountPreview.percent}% off)</span>
                            </div>
                        )}
                    </div>

                    {/* Stock */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Stock Quantity</label>
                        <input type="number" min="0" value={props.stockQty} onChange={(e) => props.setStockQty(e.target.value)} className="w-full px-4 py-2 border border-zinc-300 rounded-lg" />
                    </div>

                    {/* Feature & Sale Toggles */}
                    <div className="grid grid-cols-2 gap-4">
                        <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${props.isFeatured ? "border-yellow-400 bg-yellow-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                            <input type="checkbox" checked={props.isFeatured} onChange={(e) => props.setIsFeatured(e.target.checked)} className="w-5 h-5 rounded text-yellow-500" />
                            <div>
                                <span className="font-medium text-zinc-900">Feature on Homepage</span>
                                <p className="text-xs text-zinc-500">Show in featured products section</p>
                            </div>
                        </label>
                        <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${props.isOnSale ? "border-red-400 bg-red-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                            <input type="checkbox" checked={props.isOnSale} onChange={(e) => props.setIsOnSale(e.target.checked)} className="w-5 h-5 rounded text-red-500" />
                            <div>
                                <span className="font-medium text-zinc-900">🔥 On Sale / Promo</span>
                                <p className="text-xs text-zinc-500">Highlight as sale item</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* AI Suggested Images */}
            {props.suggestedImages && props.suggestedImages.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                    <h2 className="text-lg font-semibold mb-4">AI Found These Images</h2>
                    <p className="text-sm text-zinc-500 mb-4">Click to select images for your product</p>
                    <div className="grid grid-cols-4 gap-4">
                        {props.suggestedImages.map((img, i) => (
                            <div key={i} onClick={() => props.toggleImageSelection(img.url)}
                                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${props.selectedImages.includes(img.url) ? "border-blue-500 ring-2 ring-blue-200" : "border-zinc-200 hover:border-zinc-400"}`}>
                                <img src={img.url} alt={img.alt} className="w-full h-32 object-contain bg-zinc-50"
                                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                                {props.selectedImages.includes(img.url) && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Manual Image Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Upload Your Own Images</h2>
                <p className="text-sm text-zinc-500 mb-4">
                    {props.suggestedImages?.length ? "Add additional images or replace AI suggestions" : "AI couldn't find suitable images. Please upload your own product photos."}
                </p>
                <div className="flex flex-wrap gap-4">
                    {props.deviceImagePreview && (
                        <div onClick={() => props.setIncludeDeviceImage(!props.includeDeviceImage)}
                            className={`relative w-32 h-32 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${props.includeDeviceImage ? "border-green-500 ring-2 ring-green-200" : "border-zinc-300 opacity-50"}`}>
                            <img src={props.deviceImagePreview} alt="Device photo" className="w-full h-full object-cover" />
                            {props.includeDeviceImage && <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">✓</div>}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">📸 Your Photo</div>
                        </div>
                    )}
                    {props.manualImagePreviews.map((preview, i) => (
                        <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border border-zinc-200">
                            <img src={preview} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                            <button onClick={() => props.removeManualImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600">×</button>
                        </div>
                    ))}
                    <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                        <svg className="w-8 h-8 text-zinc-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-zinc-500">Add Image</span>
                        <input type="file" accept="image/*" multiple onChange={props.handleManualImageUpload} className="hidden" />
                    </label>
                </div>
                {props.totalSelectedImages > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        <span className="font-medium">{props.totalSelectedImages} image(s) ready</span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button onClick={props.onBack} className="flex-1 py-3 border border-zinc-300 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50">
                    ← Back to Edit Input
                </button>
                <button onClick={props.onSave} disabled={props.isSaving || !props.editableTitle || !props.price}
                    className="flex-1 py-3 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2">
                    {props.isSaving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : "Save Product"}
                </button>
            </div>
        </div>
    );
}
