/**
 * Product Reviews Hook
 * 
 * Business logic for product reviews component.
 * Handles loading reviews, stats, submitting new reviews, and display toggle.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Types
export interface Review {
    id: string;
    reviewerName: string;
    rating: number;
    title: string | null;
    comment: string | null;
    isVerified: boolean;
    createdAt: string;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
}

export interface ReviewFormData {
    rating: number;
    title: string;
    comment: string;
    reviewerName: string;
    reviewerEmail: string;
}

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface UseProductReviewsReturn {
    // Reviews data
    reviews: Review[];
    displayedReviews: Review[];
    stats: ReviewStats | null;

    // Loading state
    isLoading: boolean;

    // Display controls
    showAll: boolean;
    setShowAll: (show: boolean) => void;
    showForm: boolean;
    setShowForm: (show: boolean) => void;
    toggleForm: () => void;
    hasMoreReviews: boolean;

    // Form state
    formData: ReviewFormData;
    setFormField: <K extends keyof ReviewFormData>(field: K, value: ReviewFormData[K]) => void;
    setFormRating: (rating: number) => void;

    // Submission
    submitStatus: SubmitStatus;
    handleSubmit: (e?: React.FormEvent) => Promise<void>;

    // Refresh
    refresh: () => Promise<void>;
}

const DEFAULT_FORM_DATA: ReviewFormData = {
    rating: 5,
    title: '',
    comment: '',
    reviewerName: '',
    reviewerEmail: '',
};

export function useProductReviews(productId: string): UseProductReviewsReturn {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<ReviewFormData>(DEFAULT_FORM_DATA);
    const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');

    // Load reviews
    const loadReviews = useCallback(async () => {
        try {
            const response = await fetch(`/api/reviews/product/${productId}`);
            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    // Initial load
    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    // Derived state
    const displayedReviews = useMemo(() => {
        return showAll ? reviews : reviews.slice(0, 3);
    }, [reviews, showAll]);

    const hasMoreReviews = reviews.length > 3;

    // Form field setter
    const setFormField = useCallback(<K extends keyof ReviewFormData>(
        field: K,
        value: ReviewFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const setFormRating = useCallback((rating: number) => {
        setFormData(prev => ({ ...prev, rating }));
    }, []);

    // Toggle form
    const toggleForm = useCallback(() => {
        setShowForm(prev => !prev);
    }, []);

    // Submit review
    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSubmitStatus('submitting');

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    ...formData,
                }),
            });

            if (response.ok) {
                setSubmitStatus('success');
                setShowForm(false);
                setFormData(DEFAULT_FORM_DATA);
                // Optionally refresh reviews
                // await loadReviews();
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Failed to submit review:', error);
            setSubmitStatus('error');
        }
    }, [productId, formData]);

    return {
        // Reviews data
        reviews,
        displayedReviews,
        stats,

        // Loading
        isLoading,

        // Display controls
        showAll,
        setShowAll,
        showForm,
        setShowForm,
        toggleForm,
        hasMoreReviews,

        // Form
        formData,
        setFormField,
        setFormRating,

        // Submission
        submitStatus,
        handleSubmit,

        // Refresh
        refresh: loadReviews,
    };
}
