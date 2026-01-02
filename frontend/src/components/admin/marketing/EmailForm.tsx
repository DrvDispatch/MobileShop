/**
 * Email Form Component
 * Form for composing marketing emails with subject, headline, body, and CTA
 */

import { Button } from "@/components/ui/button";
import { Send, CheckCircle, AlertTriangle } from "lucide-react";

export interface EmailFormProps {
    subject: string; setSubject: (s: string) => void;
    headline: string; setHeadline: (h: string) => void;
    bodyHtml: string; setBodyHtml: (b: string) => void;
    ctaText: string; setCtaText: (t: string) => void;
    ctaUrl: string; setCtaUrl: (u: string) => void;
    sendResult: { success: boolean; sent: number; failed: number } | null;
    isSending: boolean;
    isValid: boolean;
    onSend: () => void;
}

export function EmailForm({ subject, setSubject, headline, setHeadline, bodyHtml, setBodyHtml, ctaText, setCtaText, ctaUrl, setCtaUrl, sendResult, isSending, isValid, onSend }: EmailFormProps) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Onderwerp *</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                    placeholder="Bv: Speciale aanbieding deze week! 📱"
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Headline *</label>
                <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Bv: Tot 30% korting op alle iPhones!"
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Inhoud * (HTML ondersteund)</label>
                <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder="Schrijf hier de inhoud van uw email..."
                    className="w-full px-4 py-3 border border-zinc-200 rounded-lg h-32" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">CTA Knop Tekst</label>
                    <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)}
                        placeholder="Bv: Bekijk Aanbiedingen"
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">CTA URL</label>
                    <input type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg" />
                </div>
            </div>

            {sendResult && (
                <div className={`p-4 rounded-lg ${sendResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <div className="flex items-center gap-2">
                        {sendResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                        <p className={sendResult.success ? "text-green-700" : "text-red-700"}>
                            {sendResult.sent} emails verstuurd{sendResult.failed > 0 && `, ${sendResult.failed} mislukt`}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4 border-t border-zinc-200">
                <Button onClick={onSend} disabled={isSending || !isValid}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                    <Send className="w-4 h-4 mr-2" /> Versturen
                </Button>
            </div>
        </div>
    );
}
