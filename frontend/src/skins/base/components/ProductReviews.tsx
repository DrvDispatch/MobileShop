"use client";

/**
 * Product Reviews Component - UI Layer
 * 
 * This component is now a THIN UI LAYER that:
 * - Consumes the useProductReviews hook for all business logic
 * - Renders the reviews list, stats, and review form
 * - Applies styling and layout
 * 
 * All state management, API calls, and form handling are in the hook.
 * This component only handles presentation.
 */

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
import { useProductReviews, type Review, type ReviewStats } from "@/lib/reviews";
import { useUIConfig, interpolate } from "@/lib/useUIConfig";
import type { ReviewLabels } from "@/lib/ui-config-types";

// ============================================
// UI-ONLY COMPONENTS
// ============================================

function StarRating({ rating, interactive, onChange }: {
    rating: number;
    interactive?: boolean;
    onChange?: (rating: number) => void;
}) {
    return (
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
}

function LoadingSkeleton() {
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

function StatsHeader({ stats, onWriteReview, labels }: {
    stats: ReviewStats | null;
    onWriteReview: () => void;
    labels: ReviewLabels;
}) {
    return (
        <div className="p-6 border-b border-zinc-100">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        {labels.title}
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
                                {stats.totalReviews} {stats.totalReviews === 1 ? labels.reviewSingular : labels.reviewPlural}
                            </span>
                        </div>
                    )}
                </div>
                <Button onClick={onWriteReview}>
                    <Star className="w-4 h-4 mr-2" />
                    {labels.submit}
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
    );
}

function ReviewCard({ review, dateLocale }: { review: Review; dateLocale: string }) {
    return (
        <div className="p-5">
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
                                Verified
                            </span>
                        )}
                        <span className="text-sm text-zinc-400">
                            {new Date(review.createdAt).toLocaleDateString(dateLocale)}
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
    );
}

function EmptyState({ labels }: { labels: ReviewLabels }) {
    return (
        <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-zinc-200 mb-3" />
            <p className="text-zinc-500">{labels.noReviews}</p>
            <p className="text-sm text-zinc-400 mt-1">{labels.beFirst}</p>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface ProductReviewsProps {
    productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const reviewsHook = useProductReviews(productId);
    const { uiConfig } = useUIConfig();
    const labels = uiConfig.labels.reviews;
    const dateLocale = uiConfig.formatting.dateLocale;

    if (reviewsHook.isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {/* Header with Stats */}
            <StatsHeader stats={reviewsHook.stats} onWriteReview={reviewsHook.toggleForm} labels={labels} />

            {/* Review Form */}
            {reviewsHook.showForm && (
                <div className="p-6 bg-zinc-50 border-b border-zinc-100">
                    {reviewsHook.submitStatus === "success" ? (
                        <div className="text-center py-4">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h3 className="font-semibold text-zinc-900">{labels.thankYou}</h3>
                            <p className="text-sm text-zinc-500 mt-1">
                                Your review will be reviewed and appear on the site shortly.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={reviewsHook.handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    {labels.yourRating}
                                </label>
                                <StarRating
                                    rating={reviewsHook.formData.rating}
                                    interactive
                                    onChange={reviewsHook.setFormRating}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">{labels.name}</label>
                                    <Input
                                        value={reviewsHook.formData.reviewerName}
                                        onChange={(e) => reviewsHook.setFormField("reviewerName", e.target.value)}
                                        required
                                        placeholder={labels.name}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">{labels.email}</label>
                                    <Input
                                        type="email"
                                        value={reviewsHook.formData.reviewerEmail}
                                        onChange={(e) => reviewsHook.setFormField("reviewerEmail", e.target.value)}
                                        required
                                        placeholder={labels.email}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">{labels.reviewTitle}</label>
                                <Input
                                    value={reviewsHook.formData.title}
                                    onChange={(e) => reviewsHook.setFormField("title", e.target.value)}
                                    placeholder={labels.reviewTitle}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">{labels.reviewBody}</label>
                                <textarea
                                    value={reviewsHook.formData.comment}
                                    onChange={(e) => reviewsHook.setFormField("comment", e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={labels.reviewBody}
                                />
                            </div>
                            {reviewsHook.submitStatus === "error" && (
                                <div className="flex items-center gap-2 text-red-600 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    Something went wrong. Please try again.
                                </div>
                            )}
                            <Button type="submit" disabled={reviewsHook.submitStatus === "submitting"}>
                                <Send className="w-4 h-4 mr-2" />
                                {labels.submit}
                            </Button>
                        </form>
                    )}
                </div>
            )}

            {/* Reviews List */}
            {reviewsHook.reviews.length === 0 ? (
                <EmptyState labels={labels} />
            ) : (
                <div className="divide-y divide-zinc-100">
                    {reviewsHook.displayedReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} dateLocale={dateLocale} />
                    ))}
                </div>
            )}

            {/* Show More Button */}
            {reviewsHook.hasMoreReviews && !reviewsHook.showAll && (
                <button
                    onClick={() => reviewsHook.setShowAll(true)}
                    className="w-full py-3 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-t border-zinc-100"
                >
                    {interpolate(labels.showAll, { count: String(reviewsHook.reviews.length) })}
                    <ChevronDown className="w-4 h-4 inline ml-1" />
                </button>
            )}
        </div>
    );
}
