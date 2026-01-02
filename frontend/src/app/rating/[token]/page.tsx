"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Star, CheckCircle, ExternalLink } from "lucide-react";

// Backend has global prefix 'api' so we need to ensure /api is in the URL
const API_BASE = '';
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

interface FeedbackData {
    id: string;
    sourceType: string;
    customerName: string;
    rating: number | null;
    ratedAt: string | null;
    showGoogleReview: boolean;
    googleReviewUrl: string;
}

function RatingContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const token = params.token as string;
    const preselectedRating = searchParams.get("rating");

    const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRating, setSelectedRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await fetch(`${API_URL}/feedback/${token}`);
                if (!res.ok) throw new Error("Feedback niet gevonden");
                const data = await res.json();
                setFeedbackData(data);

                // Check if already rated
                if (data.ratedAt) {
                    setSubmitted(true);
                    setSelectedRating(data.rating || 0);
                }

                // Set preselected rating from email click
                if (preselectedRating) {
                    const rating = parseInt(preselectedRating);
                    if (rating >= 1 && rating <= 5) {
                        setSelectedRating(rating);
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Er is iets misgegaan";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchFeedback();
        }
    }, [token, preselectedRating]);

    const handleSubmit = async () => {
        if (selectedRating === 0 || submitting) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/feedback/${token}/rate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating: selectedRating,
                    comment: comment.trim() || undefined,
                }),
            });

            if (!res.ok) throw new Error("Verzenden mislukt");

            setSubmitted(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Er is iets misgegaan";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleReviewClick = async () => {
        // Track the click
        try {
            await fetch(`${API_URL}/feedback/${token}/rate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating: selectedRating || 5,
                    googleReviewClicked: true,
                }),
            });
        } catch {
            // Ignore errors for tracking
        }

        // Open Google Review
        if (feedbackData?.googleReviewUrl) {
            window.open(feedbackData.googleReviewUrl, "_blank");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
            </div>
        );
    }

    if (error || !feedbackData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
                    <h1 className="text-xl font-semibold text-gray-900 mb-4">
                        {error || "Feedback niet gevonden"}
                    </h1>
                    <p className="text-gray-500">
                        Deze beoordelingslink is niet meer geldig of al gebruikt.
                    </p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md w-full">
                    {/* Black Header */}
                    <div className="bg-black px-8 py-6 text-center">
                        <h1 className="text-xl font-semibold text-white">
                            Bedankt voor uw Feedback ✓
                        </h1>
                    </div>
                    {/* White Body */}
                    <div className="p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-8 h-8 ${star <= selectedRating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-200"
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-gray-600 mb-8">
                            Uw mening helpt ons om onze service te verbeteren.
                        </p>

                        {feedbackData.showGoogleReview && (
                            <button
                                onClick={handleGoogleReviewClick}
                                className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                <ExternalLink className="w-5 h-5" />
                                Laat een Google Review achter
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md w-full">
                {/* Black Header */}
                <div className="bg-black px-8 py-6 text-center">
                    <h1 className="text-xl font-semibold text-white">
                        Uw Feedback
                    </h1>
                </div>

                {/* White Body */}
                <div className="p-8">
                    <p className="text-gray-600 text-center mb-2">
                        Beste {feedbackData.customerName},
                    </p>
                    <p className="text-gray-600 text-center mb-8">
                        Hoe zou u uw ervaring beoordelen?
                    </p>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-3 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setSelectedRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-10 h-10 transition-colors ${star <= (hoveredRating || selectedRating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-200 hover:text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Rating Labels */}
                    <div className="flex justify-between text-gray-400 text-xs mb-8 px-2">
                        <span>Slecht</span>
                        <span>Uitstekend</span>
                    </div>

                    {/* Optional Comment */}
                    <div className="mb-6">
                        <label className="block text-xs text-gray-400 uppercase tracking-wide mb-2">
                            UW OPMERKINGEN (OPTIONEEL)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Vertel ons meer over uw experience..."
                            className="w-full border border-gray-200 rounded-lg p-4 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            rows={3}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={selectedRating === 0 || submitting}
                        className={`w-full py-3 rounded-lg font-medium transition-colors ${selectedRating === 0 || submitting
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-black text-white hover:bg-gray-800"
                            }`}
                    >
                        {submitting ? "Verzenden..." : "Beoordeling versturen"}
                    </button>

                    {/* Google Review CTA */}
                    {feedbackData.showGoogleReview && selectedRating >= 4 && (
                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-gray-500 text-sm mb-4">
                                Heel tevreden? Help andere klanten door een Google Review achter te laten!
                            </p>
                            <button
                                onClick={handleGoogleReviewClick}
                                className="inline-flex items-center gap-2 text-black hover:text-gray-600 font-medium"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Google Review plaatsen
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RatingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
            </div>
        }>
            <RatingContent />
        </Suspense>
    );
}
