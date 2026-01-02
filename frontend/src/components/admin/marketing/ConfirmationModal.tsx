/**
 * Confirmation Modal Component
 * Final confirmation before sending marketing emails
 */

import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { type MarketingProduct } from "@/lib/admin/marketing";

export interface ConfirmationModalProps {
    segments: { segment: string; label: string; count: number }[];
    selectedSegment: string;
    specificEmail: string;
    subject: string;
    headline: string;
    bodyHtml: string;
    ctaText: string;
    ctaUrl: string;
    selectedProducts: MarketingProduct[];
    isSending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    shopName?: string;
}

export function ConfirmationModal({ segments, selectedSegment, specificEmail, subject, headline, bodyHtml, ctaText, ctaUrl, selectedProducts, isSending, onConfirm, onCancel, shopName = 'Store' }: ConfirmationModalProps) {
    const segmentInfo = segments.find(s => s.segment === selectedSegment);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden m-4">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white">
                    <h2 className="text-lg font-semibold">Bevestig Verzending</h2>
                    <p className="text-sm text-white/80">Controleer de email voordat je verstuurt</p>
                </div>
                <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-zinc-500">Naar:</span>
                        <span className="font-medium text-zinc-800">{specificEmail || segmentInfo?.label || selectedSegment}</span>
                        {!specificEmail && <span className="text-zinc-500">({segmentInfo?.count || 0} ontvangers)</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm mt-1">
                        <span className="text-zinc-500">Onderwerp:</span>
                        <span className="font-medium text-zinc-800">{subject}</span>
                    </div>
                </div>
                <div className="overflow-y-auto max-h-[50vh] bg-zinc-100 p-4">
                    <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial, sans-serif', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <div style={{ background: '#000', padding: '20px', textAlign: 'center' }}>
                            <p style={{ color: '#fff', fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px', margin: 0 }}>{shopName.toUpperCase()}</p>
                        </div>
                        <div style={{ background: '#000', padding: '12px 20px', borderTop: '1px solid #222' }}>
                            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, textAlign: 'center', margin: 0 }}>{headline}</p>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ color: '#333', fontSize: '13px', lineHeight: 1.5, margin: '0 0 12px' }}>Beste [Klantnaam],</p>
                            <div style={{ color: '#333', fontSize: '13px', lineHeight: 1.5, margin: '0 0 16px' }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                            {ctaText && ctaUrl && (
                                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                    <span style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontWeight: 500, fontSize: '12px' }}>{ctaText}</span>
                                </div>
                            )}
                            {selectedProducts.length > 0 && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                                    <p style={{ color: '#888', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>AANBEVOLEN VOOR U</p>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {selectedProducts.slice(0, 3).map((p) => (
                                            <div key={p.id} style={{ flex: 1, textAlign: 'center', border: '1px solid #eee', borderRadius: '4px', padding: '8px' }}>
                                                <p style={{ color: '#000', fontSize: '10px', margin: 0, fontWeight: 500 }}>{p.name}</p>
                                                <p style={{ color: '#000', fontSize: '11px', margin: '2px 0 0', fontWeight: 600 }}>€{Number(p.price).toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-zinc-200 flex justify-between items-center gap-4">
                    <Button variant="outline" onClick={onCancel} disabled={isSending}>Annuleren</Button>
                    <Button onClick={onConfirm} disabled={isSending}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                        {isSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Versturen...</> : <><Send className="w-4 h-4 mr-2" />Bevestigen & Versturen</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
