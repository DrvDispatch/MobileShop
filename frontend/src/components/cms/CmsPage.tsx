"use client";

import { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/landing";
import { TipTapRenderer } from "./TipTapRenderer";
import { FileText, Loader2 } from "lucide-react";

interface CmsPageProps {
    slug: string;
    fallbackTitle?: string;
    fallbackContent?: string;
    icon?: React.ReactNode;
}

interface PageData {
    id: string;
    title: string;
    content: object;
    seoTitle?: string;
    seoDescription?: string;
}

/**
 * CmsPage - Reusable component for loading and displaying CMS page content
 * Falls back to provided fallback content if page not found in CMS
 */
export function CmsPage({ slug, fallbackTitle, fallbackContent, icon }: CmsPageProps) {
    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`/api/tenant/pages/${slug}`, { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error('Page not found');
                return res.json();
            })
            .then(data => {
                setPage(data);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [slug]);

    // While loading, show skeleton
    if (loading) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    // If error or no page, show fallback content
    if (error || !page) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
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
                <Footer />
            </main>
        );
    }

    // Render CMS page content
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
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
            <Footer />
        </main>
    );
}
