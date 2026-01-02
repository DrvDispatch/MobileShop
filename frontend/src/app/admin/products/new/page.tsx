"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    Save,
    Loader2,
    Sparkles,
    Upload,
    X,
    ImageIcon,
    Wand2,
    Package,
    Battery,
    FolderOpen,
    HelpCircle,
    Check,
    Info,
} from "lucide-react";
import {
    useProductCreate,
    BRANDS,
    STORAGE_OPTIONS,
    CONDITION_OPTIONS,
    DEVICE_GRADES,
    extractAssetInfo,
} from "@/lib/admin/products";

export default function AddProductPage() {
    const {
        categories,
        productType, setProductType,
        brand, setBrand,
        modelName, setModelName,
        condition, setCondition,
        storage, setStorage,
        color, setColor,
        categoryId, setCategoryId,
        title, setTitle,
        shortDescription, setShortDescription,
        description, setDescription,
        batteryHealth, setBatteryHealth,
        deviceGrade, setDeviceGrade,
        price, setPrice,
        compareAtPrice, setCompareAtPrice,
        stockQty, setStockQty,
        isFeatured, setIsFeatured,
        isActive, setIsActive,
        imagePreviews,
        handleImageUpload, removeImage,
        fileInputRef,
        imageAnalysis, isAnalyzing,
        isGeneratingTitle, isGeneratingShort, isGeneratingLong,
        generateContent, generateAllContent,
        suggestedImages, selectedSuggestedImages, toggleSuggestedImage,
        isLoadingAssets,
        showAssetLibrary, setShowAssetLibrary,
        selectedAssets, toggleAssetSelection,
        assetSearchQuery, setAssetSearchQuery,
        filteredAssets,
        showHelp, setShowHelp,
        isSaving, error, success,
        handleSubmit,
        discountPreview,
    } = useProductCreate();

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <Link href="/admin/products" className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1">
                            <ChevronLeft className="w-4 h-4" />
                            Terug naar Producten
                        </Link>
                        <h1 className="text-2xl font-bold text-zinc-900 mt-1 flex items-center gap-2">
                            Product Toevoegen
                            <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full">AI</span>
                            <button onClick={() => setShowHelp(!showHelp)} className="ml-2 p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600" title="Handleiding">
                                <HelpCircle className="w-5 h-5" />
                            </button>
                        </h1>
                    </div>
                    <Button onClick={handleSubmit} disabled={isSaving || !title || !price} className="bg-zinc-900 hover:bg-zinc-800">
                        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Opslaan...</> : <><Save className="w-4 h-4 mr-2" />Product Opslaan</>}
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto py-8 px-6">
                {/* Messages */}
                {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
                {success && <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">✓ Product succesvol opgeslagen! Doorsturen...</div>}

                {/* Quick Start Guide */}
                <div className="mb-6">
                    <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                        <HelpCircle className="w-4 h-4" />
                        {showHelp ? "Verberg handleiding" : "Hoe werkt dit? (Klik voor handleiding)"}
                    </button>
                    {showHelp && <HelpGuide />}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Form - Left 2 columns */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Upload Section */}
                        <ImageSection
                            imagePreviews={imagePreviews}
                            handleImageUpload={handleImageUpload}
                            removeImage={removeImage}
                            fileInputRef={fileInputRef}
                            imageAnalysis={imageAnalysis}
                            isAnalyzing={isAnalyzing}
                        />

                        {/* Basic Info */}
                        <BasicInfoSection
                            productType={productType} setProductType={setProductType}
                            brand={brand} setBrand={setBrand}
                            modelName={modelName} setModelName={setModelName}
                            condition={condition} setCondition={setCondition}
                            storage={storage} setStorage={setStorage}
                            color={color} setColor={setColor}
                            categoryId={categoryId} setCategoryId={setCategoryId}
                            categories={categories}
                        />

                        {/* Descriptions with AI */}
                        <DescriptionsSection
                            title={title} setTitle={setTitle}
                            shortDescription={shortDescription} setShortDescription={setShortDescription}
                            description={description} setDescription={setDescription}
                            isGeneratingTitle={isGeneratingTitle}
                            isGeneratingShort={isGeneratingShort}
                            isGeneratingLong={isGeneratingLong}
                            generateContent={generateContent}
                            generateAllContent={generateAllContent}
                            modelName={modelName}
                        />

                        {/* AI Suggested Images */}
                        {suggestedImages.length > 0 && (
                            <SuggestedImagesSection
                                suggestedImages={suggestedImages}
                                selectedSuggestedImages={selectedSuggestedImages}
                                toggleSuggestedImage={toggleSuggestedImage}
                            />
                        )}

                        {/* Asset Library */}
                        <AssetLibrarySection
                            showAssetLibrary={showAssetLibrary}
                            setShowAssetLibrary={setShowAssetLibrary}
                            selectedAssets={selectedAssets}
                            toggleAssetSelection={toggleAssetSelection}
                            assetSearchQuery={assetSearchQuery}
                            setAssetSearchQuery={setAssetSearchQuery}
                            filteredAssets={filteredAssets}
                            isLoadingAssets={isLoadingAssets}
                        />
                    </div>

                    {/* Sidebar - Right column */}
                    <div className="space-y-6">
                        {/* Phone-specific fields */}
                        {productType === "PHONE" && (
                            <PhoneDetailsSection
                                batteryHealth={batteryHealth} setBatteryHealth={setBatteryHealth}
                                deviceGrade={deviceGrade} setDeviceGrade={setDeviceGrade}
                            />
                        )}

                        {/* Pricing */}
                        <PricingSection
                            price={price} setPrice={setPrice}
                            compareAtPrice={compareAtPrice} setCompareAtPrice={setCompareAtPrice}
                            discountPreview={discountPreview}
                        />

                        {/* Stock */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <h2 className="text-lg font-semibold mb-4">📦 Voorraad</h2>
                            <input type="number" min="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg" />
                        </div>

                        {/* Options */}
                        <OptionsSection
                            isFeatured={isFeatured} setIsFeatured={setIsFeatured}
                            isActive={isActive} setIsActive={setIsActive}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function HelpGuide() {
    return (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Snelstartgids - Product Toevoegen
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
                {[
                    { num: 1, text: <><strong>Upload een foto</strong> (optioneel) - AI detecteert automatisch de kleur en conditie van het toestel</> },
                    { num: 2, text: <><strong>Vul het model in</strong> - bijv. &quot;iPhone 15 Pro Max&quot; en selecteer het merk</> },
                    { num: 3, text: <><strong>Klik op &quot;Genereer Alles met AI&quot;</strong> - AI maakt automatisch titel en beschrijvingen + zoekt afbeeldingen</> },
                    { num: 4, text: <><strong>Selecteer afbeeldingen</strong> - Kies uit AI-voorstellen OF eerder geüploade afbeeldingen</> },
                    { num: 5, text: <><strong>Stel de prijs in</strong> en klik op &quot;Product Opslaan&quot;</> },
                ].map(step => (
                    <div key={step.num} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">{step.num}</span>
                        <div>{step.text}</div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">💡 <strong>Tip:</strong> Je kunt elk AI-gegenereerd veld handmatig aanpassen voordat je opslaat</p>
            </div>
        </div>
    );
}

interface ImageSectionProps {
    imagePreviews: string[];
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeImage: (index: number) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    imageAnalysis: { detectedColor: string; conditionAssessment: string; confidence: number } | null;
    isAnalyzing: boolean;
}

function ImageSection({ imagePreviews, handleImageUpload, removeImage, fileInputRef, imageAnalysis, isAnalyzing }: ImageSectionProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Afbeeldingen
            </h2>

            {imageAnalysis && (
                <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Analyse Resultaat
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><span className="text-zinc-600">Kleur:</span> <span className="font-medium">{imageAnalysis.detectedColor}</span></div>
                        <div><span className="text-zinc-600">Conditie:</span> <span className="font-medium">{imageAnalysis.conditionAssessment}</span></div>
                        <div><span className="text-zinc-600">Zekerheid:</span> <span className="font-medium">{imageAnalysis.confidence}%</span></div>
                    </div>
                </div>
            )}

            {isAnalyzing && (
                <div className="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-blue-700">Afbeelding analyseren met AI...</span>
                </div>
            )}

            <div className="flex flex-wrap gap-4">
                {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-200">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                            <X className="w-3 h-3" />
                        </button>
                        {index === 0 && <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded">Hoofd</span>}
                    </div>
                ))}
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                    <Upload className="w-6 h-6 text-zinc-400" />
                    <span className="text-xs text-zinc-500 mt-1">Upload</span>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
            </div>
            <p className="text-xs text-zinc-500 mt-2">💡 Upload een foto van het toestel - AI detecteert automatisch kleur en conditie</p>
        </div>
    );
}

interface BasicInfoSectionProps {
    productType: string; setProductType: (t: "PHONE" | "ACCESSORY") => void;
    brand: string; setBrand: (b: string) => void;
    modelName: string; setModelName: (m: string) => void;
    condition: string; setCondition: (c: "NEW" | "REFURBISHED" | "USED") => void;
    storage: string; setStorage: (s: string) => void;
    color: string; setColor: (c: string) => void;
    categoryId: string; setCategoryId: (c: string) => void;
    categories: { id: string; name: string }[];
}

function BasicInfoSection({ productType, setProductType, brand, setBrand, modelName, setModelName, condition, setCondition, storage, setStorage, color, setColor, categoryId, setCategoryId, categories }: BasicInfoSectionProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Informatie
            </h2>
            <div className="space-y-4">
                {/* Product Type */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setProductType("PHONE")} className={`p-3 rounded-lg border-2 text-left transition-all ${productType === "PHONE" ? "border-blue-500 bg-blue-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                            <span className="font-medium">📱 Toestel</span>
                            <p className="text-xs text-zinc-500">Smartphones, tablets</p>
                        </button>
                        <button type="button" onClick={() => setProductType("ACCESSORY")} className={`p-3 rounded-lg border-2 text-left transition-all ${productType === "ACCESSORY" ? "border-blue-500 bg-blue-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                            <span className="font-medium">🎧 Accessoire</span>
                            <p className="text-xs text-zinc-500">Hoesjes, kabels, etc.</p>
                        </button>
                    </div>
                </div>

                {/* Brand, Model */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Merk</label>
                        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Model / Naam *</label>
                        <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="bijv. iPhone 15 Pro Max" className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                {/* Condition, Storage, Color */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Conditie</label>
                        <select value={condition} onChange={(e) => setCondition(e.target.value as "NEW" | "REFURBISHED" | "USED")} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            {CONDITION_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Opslag</label>
                        <select value={storage} onChange={(e) => setStorage(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Selecteer...</option>
                            {STORAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Kleur</label>
                        <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="bijv. Zwart" className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Categorie</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Selecteer categorie...</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}

interface DescriptionsSectionProps {
    title: string; setTitle: (t: string) => void;
    shortDescription: string; setShortDescription: (d: string) => void;
    description: string; setDescription: (d: string) => void;
    isGeneratingTitle: boolean;
    isGeneratingShort: boolean;
    isGeneratingLong: boolean;
    generateContent: (field: 'title' | 'short' | 'long') => Promise<void>;
    generateAllContent: () => Promise<void>;
    modelName: string;
}

function DescriptionsSection({ title, setTitle, shortDescription, setShortDescription, description, setDescription, isGeneratingTitle, isGeneratingShort, isGeneratingLong, generateContent, generateAllContent, modelName }: DescriptionsSectionProps) {
    const disabled = !modelName.trim();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Beschrijvingen
                </h2>
                <Button variant="outline" size="sm" onClick={generateAllContent} disabled={isGeneratingTitle || disabled} className="text-purple-600 border-purple-300 hover:bg-purple-50">
                    {isGeneratingTitle ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    Genereer Alles met AI
                </Button>
            </div>

            <div className="space-y-4">
                {/* Title */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-zinc-700">Titel *</label>
                        <button onClick={() => generateContent("title")} disabled={isGeneratingTitle || disabled} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50">
                            {isGeneratingTitle ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Genereer
                        </button>
                    </div>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product titel" className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Short Description */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-zinc-700">Korte beschrijving</label>
                        <button onClick={() => generateContent("short")} disabled={isGeneratingShort || disabled} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50">
                            {isGeneratingShort ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Genereer
                        </button>
                    </div>
                    <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} placeholder="Korte samenvatting..." className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Long Description */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-zinc-700">Volledige beschrijving</label>
                        <button onClick={() => generateContent("long")} disabled={isGeneratingLong || disabled} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50">
                            {isGeneratingLong ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Genereer
                        </button>
                    </div>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Gedetailleerde productbeschrijving..." className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>
        </div>
    );
}

interface SuggestedImagesSectionProps {
    suggestedImages: { url: string; alt: string }[];
    selectedSuggestedImages: string[];
    toggleSuggestedImage: (url: string) => void;
}

function SuggestedImagesSection({ suggestedImages, selectedSuggestedImages, toggleSuggestedImage }: SuggestedImagesSectionProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Voorgestelde Afbeeldingen
            </h2>
            <p className="text-sm text-zinc-500 mb-4">Klik om te selecteren (geselecteerd: {selectedSuggestedImages.length})</p>
            <div className="grid grid-cols-4 gap-3">
                {suggestedImages.map((img, i) => (
                    <button key={i} onClick={() => toggleSuggestedImage(img.url)} className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedSuggestedImages.includes(img.url) ? "border-blue-500 ring-2 ring-blue-200" : "border-zinc-200 hover:border-zinc-300"}`}>
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23e5e7eb'%3E%3Crect width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10'%3EError%3C/text%3E%3C/svg%3E"; }} />
                        {selectedSuggestedImages.includes(img.url) && (
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <div className="bg-blue-500 text-white rounded-full p-1"><Check className="w-4 h-4" /></div>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

interface AssetLibrarySectionProps {
    showAssetLibrary: boolean;
    setShowAssetLibrary: (show: boolean) => void;
    selectedAssets: string[];
    toggleAssetSelection: (url: string) => void;
    assetSearchQuery: string;
    setAssetSearchQuery: (q: string) => void;
    filteredAssets: { url: string; key: string }[];
    isLoadingAssets: boolean;
}

function AssetLibrarySection({ showAssetLibrary, setShowAssetLibrary, selectedAssets, toggleAssetSelection, assetSearchQuery, setAssetSearchQuery, filteredAssets, isLoadingAssets }: AssetLibrarySectionProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Afbeeldingen Bibliotheek
                </h2>
                <button onClick={() => setShowAssetLibrary(!showAssetLibrary)} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    {showAssetLibrary ? "Verbergen" : "Tonen"} ({filteredAssets.length} beschikbaar)
                </button>
            </div>

            {selectedAssets.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg text-green-700 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {selectedAssets.length} afbeelding(en) geselecteerd uit bibliotheek
                </div>
            )}

            {showAssetLibrary && (
                <>
                    <div className="mb-4">
                        <input type="text" placeholder="Zoek op toestel naam... (bijv. iPhone 15, Galaxy S24)" value={assetSearchQuery} onChange={(e) => setAssetSearchQuery(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>

                    {isLoadingAssets ? (
                        <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                            <p>{assetSearchQuery ? `Geen resultaten voor "${assetSearchQuery}"` : "Geen bestaande afbeeldingen gevonden"}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-1">
                            {filteredAssets.map((asset, i) => {
                                const { brand, deviceName } = extractAssetInfo(asset.key);
                                return (
                                    <button key={i} onClick={() => toggleAssetSelection(asset.url)} className={`flex flex-col bg-white rounded-xl border-2 transition-all hover:shadow-md overflow-hidden ${selectedAssets.includes(asset.url) ? "border-green-500 ring-2 ring-green-200 shadow-md" : "border-zinc-200 hover:border-zinc-300"}`}>
                                        <div className="relative aspect-square bg-zinc-50">
                                            <img src={asset.url} alt={deviceName} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23e5e7eb'%3E%3Crect width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10'%3EError%3C/text%3E%3C/svg%3E"; }} />
                                            {selectedAssets.includes(asset.url) && (
                                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1"><Check className="w-3 h-3" /></div>
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-zinc-100 text-left">
                                            <p className="text-xs font-medium text-zinc-900 truncate">{deviceName}</p>
                                            <p className="text-[10px] text-zinc-500">{brand}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
            <p className="text-xs text-zinc-500 mt-3">📱 199 toestelafbeeldingen (Apple iPhones/iPads, Samsung Galaxy)</p>
        </div>
    );
}

interface PhoneDetailsSectionProps {
    batteryHealth: string; setBatteryHealth: (b: string) => void;
    deviceGrade: string; setDeviceGrade: (g: "A_PLUS" | "A" | "B" | "C" | "D") => void;
}

function PhoneDetailsSection({ batteryHealth, setBatteryHealth, deviceGrade, setDeviceGrade }: PhoneDetailsSectionProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Battery className="w-5 h-5" />
                Toestel Details
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Batterij Gezondheid (%)</label>
                    <input type="number" min="0" max="100" value={batteryHealth} onChange={(e) => setBatteryHealth(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-lg" />
                    <p className="text-xs text-zinc-500 mt-1">Typisch 80-100% voor refurbished</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Graad</label>
                    <select value={deviceGrade} onChange={(e) => setDeviceGrade(e.target.value as "A_PLUS" | "A" | "B" | "C" | "D")} className="w-full px-3 py-2 border border-zinc-300 rounded-lg">
                        {DEVICE_GRADES.map(g => <option key={g.value} value={g.value}>{g.label} - {g.description}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}

interface PricingSectionProps {
    price: string; setPrice: (p: string) => void;
    compareAtPrice: string; setCompareAtPrice: (p: string) => void;
    discountPreview: { amount: number; percent: number } | null;
}

function PricingSection({ price, setPrice, compareAtPrice, setCompareAtPrice, discountPreview }: PricingSectionProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold mb-4">💰 Prijs</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Prijs (€) *</label>
                    <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={`w-full px-3 py-2 border rounded-lg ${!price ? "border-orange-300 bg-orange-50" : "border-zinc-300"}`} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Vergelijkingsprijs (€)</label>
                    <input type="number" min="0" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="Originele prijs" className="w-full px-3 py-2 border border-zinc-300 rounded-lg" />
                    <p className="text-xs text-zinc-500 mt-1">Voor kortingsweergave</p>
                </div>
                {discountPreview && (
                    <div className="p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                        <strong>Korting:</strong> €{discountPreview.amount.toFixed(2)} ({discountPreview.percent}% off)
                    </div>
                )}
            </div>
        </div>
    );
}

interface OptionsSectionProps {
    isFeatured: boolean; setIsFeatured: (f: boolean) => void;
    isActive: boolean; setIsActive: (a: boolean) => void;
}

function OptionsSection({ isFeatured, setIsFeatured, isActive, setIsActive }: OptionsSectionProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold mb-4">⚙️ Opties</h2>
            <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${isFeatured ? "border-yellow-400 bg-yellow-50" : "border-zinc-200"}`}>
                    <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4" />
                    <div>
                        <span className="font-medium text-sm">⭐ Uitgelicht</span>
                        <p className="text-xs text-zinc-500">Tonen op homepage</p>
                    </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${isActive ? "border-green-400 bg-green-50" : "border-zinc-200"}`}>
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
                    <div>
                        <span className="font-medium text-sm">✓ Actief</span>
                        <p className="text-xs text-zinc-500">Zichtbaar in winkel</p>
                    </div>
                </label>
            </div>
        </div>
    );
}
