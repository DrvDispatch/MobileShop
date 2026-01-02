'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { TipTapRenderer } from '@/components/cms';

interface CmsPageData {
    id: string;
    slug: string;
    title: string;
    content: object | null;
    seoTitle?: string;
    seoDescription?: string;
}

export default function DynamicCmsPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [page, setPage] = useState<CmsPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!slug) return;

        const fetchPage = async () => {
            try {
                const res = await fetch(`/api/tenant/pages/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError(true);
                        return;
                    }
                    throw new Error('Failed to fetch page');
                }
                const data = await res.json();
                setPage(data);
            } catch (err) {
                console.error('Failed to load CMS page:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    if (error || !page) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <article className="prose prose-lg dark:prose-invert max-w-none">
                    <h1 className="text-4xl font-bold text-foreground mb-8">
                        {page.title}
                    </h1>
                    <div className="text-foreground/80">
                        <TipTapRenderer content={page.content} />
                    </div>
                </article>
            </div>
        </div>
    );
}
