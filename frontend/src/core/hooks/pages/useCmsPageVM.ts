"use client";

import { useState, useEffect } from "react";

/**
 * CMS Page ViewModel Interface
 * Represents the data and state for rendering a CMS-sourced page
 */
export interface CmsPageVM {
    /** Whether the page is loading */
    isLoading: boolean;
    /** Whether an error occurred */
    hasError: boolean;
    /** Page data if loaded successfully */
    page: {
        id: string;
        title: string;
        content: object;
        seoTitle?: string;
        seoDescription?: string;
    } | null;
    /** Fallback title to display if page not found */
    fallbackTitle?: string;
    /** Fallback content to display if page not found */
    fallbackContent?: string;
    /** Icon to display in header (as string identifier for skin to render) */
    iconType?: 'file' | 'default';
}

interface UseCmsPageVMOptions {
    slug: string;
    fallbackTitle?: string;
    fallbackContent?: string;
}

/**
 * useCmsPageVM - Core hook for fetching and managing CMS page state
 * This hook handles all data fetching and state management for CMS pages.
 * Skins should NEVER use this hook directly - they receive the VM as props.
 */
export function useCmsPageVM({ slug, fallbackTitle, fallbackContent }: UseCmsPageVMOptions): CmsPageVM {
    const [page, setPage] = useState<CmsPageVM['page']>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);

        fetch(`/api/tenant/pages/${slug}`, { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error('Page not found');
                return res.json();
            })
            .then(data => {
                setPage(data);
                setIsLoading(false);
            })
            .catch(() => {
                setHasError(true);
                setIsLoading(false);
            });
    }, [slug]);

    return {
        isLoading,
        hasError,
        page,
        fallbackTitle,
        fallbackContent,
        iconType: 'file',
    };
}
