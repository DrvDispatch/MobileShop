"use client";

import { Button } from "@/components/ui/button";
import {
    Mail,
    Users,
    ShoppingCart,
    Calendar,
    X,
    FileText,
} from "lucide-react";
import {
    useMarketing,
    EMAIL_TEMPLATES,
} from "@/lib/admin/marketing";
import { useSettingsStore } from "@/lib/store";
import {
    SegmentSelector,
    FeaturedProducts,
    EmailForm,
    LivePreview,
    ProductPickerModal,
    TemplatesModal,
    PreviewModal,
    UserPreviewModal,
    ConfirmationModal,
} from "@/components/admin/marketing";

export default function AdminMarketingPage() {
    const {
        // Segments
        segments,
        selectedSegment,
        isLoadingSegments,
        setSelectedSegment,

        // User preview
        showUserPreview,
        previewUsers,
        previewSegmentLabel,
        isLoadingUsers,
        fetchUsersForSegment,
        closeUserPreview,

        // Specific email
        specificEmail,
        setSpecificEmail,

        // Products
        selectedProducts,
        addProduct,
        removeProduct,
        filteredProducts,

        // Product picker
        showProductPicker,
        productSearch,
        setShowProductPicker,
        setProductSearch,

        // Templates
        showTemplates,
        setShowTemplates,
        loadTemplate,

        // Email form
        subject,
        headline,
        bodyHtml,
        ctaText,
        ctaUrl,
        setSubject,
        setHeadline,
        setBodyHtml,
        setCtaText,
        setCtaUrl,

        // Preview & confirmation
        showPreview,
        setShowPreview,
        showConfirmation,
        setShowConfirmation,

        // Sending
        isSending,
        sendResult,
        handleSend,

        // Validation
        isValid,
    } = useMarketing();

    // Get store name for email preview headers
    const { settings } = useSettingsStore();
    const shopName = settings.store.name || 'Store';

    const getSegmentIcon = (segment: string) => {
        switch (segment) {
            case "all": return <Users className="w-5 h-5" />;
            case "customers": return <ShoppingCart className="w-5 h-5" />;
            case "appointment_completed": return <Calendar className="w-5 h-5" />;
            case "unsubscribed": return <X className="w-5 h-5" />;
            default: return <Mail className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Marketing Emails</h1>
                    <p className="text-zinc-500">Verstuur promotie-emails naar klanten</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - Segment Selection */}
                <div className="space-y-6">
                    <SegmentSelector
                        segments={segments}
                        selectedSegment={selectedSegment}
                        isLoading={isLoadingSegments}
                        onSelect={(s) => { setSelectedSegment(s); setSpecificEmail(""); }}
                        onViewUsers={fetchUsersForSegment}
                        getSegmentIcon={getSegmentIcon}
                    />

                    {/* Specific Email Option */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                            Of stuur naar specifiek adres:
                        </label>
                        <input
                            type="email"
                            value={specificEmail}
                            onChange={(e) => setSpecificEmail(e.target.value)}
                            placeholder="email@voorbeeld.nl"
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                        />
                    </div>

                    {/* Featured Products */}
                    <FeaturedProducts
                        selectedProducts={selectedProducts}
                        onAdd={() => setShowProductPicker(true)}
                        onRemove={removeProduct}
                    />
                </div>

                {/* Right Side - Email Composer with Live Preview */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-zinc-900">Email Opstellen</h3>
                        <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
                            <FileText className="w-4 h-4 mr-1" /> Templates
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Email Form */}
                        <EmailForm
                            subject={subject} setSubject={setSubject}
                            headline={headline} setHeadline={setHeadline}
                            bodyHtml={bodyHtml} setBodyHtml={setBodyHtml}
                            ctaText={ctaText} setCtaText={setCtaText}
                            ctaUrl={ctaUrl} setCtaUrl={setCtaUrl}
                            sendResult={sendResult}
                            isSending={isSending}
                            isValid={isValid}
                            onSend={() => setShowConfirmation(true)}
                        />

                        {/* Live Preview */}
                        <LivePreview
                            subject={subject}
                            headline={headline}
                            bodyHtml={bodyHtml}
                            ctaText={ctaText}
                            ctaUrl={ctaUrl}
                            selectedProducts={selectedProducts}
                            shopName={shopName}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showProductPicker && (
                <ProductPickerModal
                    products={filteredProducts}
                    search={productSearch}
                    onSearch={setProductSearch}
                    onSelect={addProduct}
                    onClose={() => setShowProductPicker(false)}
                />
            )}

            {showTemplates && (
                <TemplatesModal
                    templates={EMAIL_TEMPLATES}
                    onSelect={loadTemplate}
                    onClose={() => setShowTemplates(false)}
                />
            )}

            {showPreview && (
                <PreviewModal
                    subject={subject}
                    headline={headline}
                    bodyHtml={bodyHtml}
                    ctaText={ctaText}
                    ctaUrl={ctaUrl}
                    selectedProducts={selectedProducts}
                    onClose={() => setShowPreview(false)}
                />
            )}

            {showUserPreview && (
                <UserPreviewModal
                    label={previewSegmentLabel}
                    users={previewUsers}
                    isLoading={isLoadingUsers}
                    onClose={closeUserPreview}
                />
            )}

            {showConfirmation && (
                <ConfirmationModal
                    segments={segments}
                    selectedSegment={selectedSegment}
                    specificEmail={specificEmail}
                    subject={subject}
                    headline={headline}
                    bodyHtml={bodyHtml}
                    ctaText={ctaText}
                    ctaUrl={ctaUrl}
                    selectedProducts={selectedProducts}
                    isSending={isSending}
                    onConfirm={() => { setShowConfirmation(false); handleSend(); }}
                    onCancel={() => setShowConfirmation(false)}
                    shopName={shopName}
                />
            )}
        </div>
    );
}
