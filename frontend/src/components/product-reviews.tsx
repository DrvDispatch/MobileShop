"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Star,
    MessageSquare,
    VerifiedIcon,
    ChevronDown,
    Send,
    AlertCircle,
    CheckCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Review {
    id: string;
    reviewerName: string;
    rating: number;
    title: string | null;
    comment: string | null;
    isVerified: boolean;
    createdAt: string;
}

interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
}

interface ProductReviewsProps {
    productId: string;
}

const StarRating = ({ rating, interactive, onChange }: {
    rating: number;
    interactive?: boolean;
    onChange?: (rating: number) => void;
}) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type={interactive ? "button" : undefined}
                onClick={() => interactive && onChange?.(star)}
                className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}
                disabled={!interactive}
            >
                <Star
                    className={`w-5 h-5 ${star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : interactive
                                ? "text-zinc-300 hover:text-yellow-300"
                                : "text-zinc-200"
                        }`}
                />
            </button>
        ))}
    </div>
);

export function ProductReviews({ productId }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        rating: 5,
        title: "",
        comment: "",
        reviewerName: "",
        reviewerEmail: "",
    });
    const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    const loadReviews = async () => {
        try {
            const response = await fetch(`${API_URL}/api/reviews/product/${productId}`);
            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error("Failed to load reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus("submitting");

        try {
            const response = await fetch(`${API_URL}/api/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    ...formData,
                }),
            });

            if (response.ok) {
                setSubmitStatus("success");
                setShowForm(false);
                setFormData({ rating: 5, title: "", comment: "", reviewerName: "", reviewerEmail: "" });
            } else {
                setSubmitStatus("error");
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
            setSubmitStatus("error");
        }
    };

    useEffect(() => {
        loadReviews();
    }, [productId]);

    const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-zinc-200 rounded w-1/4"></div>
                    <div className="h-4 bg-zinc-100 rounded w-full"></div>
                    <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {/* Header with Stats */}
            <div className="p-6 border-b border-zinc-100">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Klantbeoordelingen
                        </h2>
                        {stats && stats.totalReviews > 0 && (
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                    <span className="text-3xl font-bold text-zinc-900">
                                        {stats.averageRating}
                                    </span>
                                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                </div>
                                <span className="text-zinc-500">
                                    {stats.totalReviews} {stats.totalReviews === 1 ? "beoordeling" : "beoordelingen"}
                                </span>
                            </div>
                        )}
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Star className="w-4 h-4 mr-2" />
                        Schrijf een review
                    </Button>
                </div>

                {/* Rating Distribution */}
                {stats && stats.totalReviews > 0 && (
                    <div className="mt-4 space-y-1">
                        {[5, 4, 3, 2, 1].map((stars) => {
                            const count = stats.distribution[stars] || 0;
                            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                            return (
                                <div key={stars} className="flex items-center gap-2 text-sm">
                                    <span className="w-3 text-right text-zinc-500">{stars}</span>
                                    <Star className="w-3 h-3 text-yellow-400" />
                                    <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-zinc-400">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Review Form */}
            {showForm && (
                <div className="p-6 bg-zinc-50 border-b border-zinc-100">
                    {submitStatus === "success" ? (
                        <div className="text-center py-4">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h3 className="font-semibold text-zinc-900">Bedankt voor je review!</h3>
                            <p className="text-sm text-zinc-500 mt-1">
                                Je review wordt beoordeeld en verschijnt binnenkort op de site.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    Jouw beoordeling
                                </label>
                                <StarRating
                                    rating={formData.rating}
                                    interactive
                                    onChange={(rating) => setFormData({ ...formData, rating })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Naam</label>
                                    <Input
                                        value={formData.reviewerName}
                                        onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                                        required
                                        placeholder="Je naam"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                                    <Input
                                        type="email"
                                        value={formData.reviewerEmail}
                                        onChange={(e) => setFormData({ ...formData, reviewerEmail: e.target.value })}
                                        required
                                        placeholder="je@email.nl"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Titel (optioneel)</label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Korte samenvatting"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Review</label>
                                <textarea
                                    value={formData.comment}
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Deel je ervaring met dit product..."
                                />
                            </div>
                            {submitStatus === "error" && (
                                <div className="flex items-center gap-2 text-red-600 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    Er is iets misgegaan. Probeer het opnieuw.
                                </div>
                            )}
                            <Button type="submit" disabled={submitStatus === "submitting"}>
                                <Send className="w-4 h-4 mr-2" />
                                Review versturen
                            </Button>
                        </form>
                    )}
                </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-zinc-200 mb-3" />
                    <p className="text-zinc-500">Nog geen beoordelingen voor dit product</p>
                    <p className="text-sm text-zinc-400 mt-1">Wees de eerste om een review te schrijven!</p>
                </div>
            ) : (
                <div className="divide-y divide-zinc-100">
                    {displayedReviews.map((review) => (
                        <div key={review.id} className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                    {review.reviewerName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-zinc-900">{review.reviewerName}</span>
                                        {review.isVerified && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                <VerifiedIcon className="w-3 h-3" />
                                                Geverifieerd
                                            </span>
                                        )}
                                        <span className="text-sm text-zinc-400">
                                            {new Date(review.createdAt).toLocaleDateString("nl-NL")}
                                        </span>
                                    </div>
                                    <div className="mt-1">
                                        <StarRating rating={review.rating} />
                                    </div>
                                    {review.title && (
                                        <h4 className="font-medium text-zinc-900 mt-2">{review.title}</h4>
                                    )}
                                    {review.comment && (
                                        <p className="text-zinc-600 mt-1">{review.comment}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Show More Button */}
            {reviews.length > 3 && !showAll && (
                <button
                    onClick={() => setShowAll(true)}
                    className="w-full py-3 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-t border-zinc-100"
                >
                    Toon alle {reviews.length} beoordelingen
                    <ChevronDown className="w-4 h-4 inline ml-1" />
                </button>
            )}
        </div>
    );
}
