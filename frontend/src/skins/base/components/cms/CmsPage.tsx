"use client";

import { TipTapRenderer } from "./TipTapRenderer";
import { FileText, Loader2 } from "lucide-react";
import type { CmsPageVM } from "@/core/hooks/pages/useCmsPageVM";

interface CmsPageProps {
    vm: CmsPageVM;
    icon?: React.ReactNode;
}

/**
 * CmsPage - Pure presentational component for CMS page content
 * 
 * This component receives all data via the vm prop and renders accordingly.
 * It does NOT perform any data fetching or use hooks directly.
 * 
 * Usage:
 * - Route delegate calls useCmsPageVM() to get the VM
 * - Page is rendered within PublicLayout (navbar/footer handled there)
 * - This component focuses purely on rendering the CMS content
 */
export function CmsPage({ vm, icon }: CmsPageProps) {
    const { isLoading, hasError, page, fallbackTitle, fallbackContent } = vm;

    // While loading, show skeleton
    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
            </div>
        );
    }

    // If error or no page, show fallback content
    if (hasError || !page) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        {icon || <FileText className="w-8 h-8 text-zinc-600" />}
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-3">
                        {fallbackTitle || 'Pagina niet gevonden'}
                    </h1>
                </div>
                {fallbackContent && (
                    <div className="prose prose-zinc max-w-none">
                        <p className="text-zinc-600">{fallbackContent}</p>
                    </div>
                )}
            </div>
        );
    }

    // Render CMS page content
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {icon || <FileText className="w-8 h-8 text-zinc-600" />}
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-3">
                    {page.title}
                </h1>
            </div>

            {/* Content */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 lg:p-8">
                <TipTapRenderer content={page.content} />
            </div>
        </div>
    );
}
