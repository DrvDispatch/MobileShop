/**
 * Preview Modal Component
 * Full-screen preview of the marketing email
 */

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { type MarketingProduct } from "@/lib/admin/marketing";

export interface PreviewModalProps {
    subject: string;
    headline: string;
    bodyHtml: string;
    ctaText: string;
    ctaUrl: string;
    selectedProducts: MarketingProduct[];
    onClose: () => void;
}

export function PreviewModal({ subject, headline, bodyHtml, ctaText, ctaUrl, selectedProducts, onClose }: PreviewModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
            <div className="bg-zinc-100 rounded-xl w-full max-w-2xl m-4">
                <div className="p-4 bg-white rounded-t-xl border-b border-zinc-200 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">Email Preview</h3>
                        <p className="text-sm text-zinc-500">Zo ziet de email eruit voor ontvangers</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4">
                    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ background: '#000000', padding: '32px 40px', textAlign: 'center' }}>
                                    <h1 style={{ color: 'white', margin: 0, fontSize: '22px', fontWeight: 600 }}>{headline || 'Headline'} ✓</h1>
                                </div>
                                <div style={{ padding: '32px 40px' }}>
                                    <p style={{ color: '#333', fontSize: '15px', lineHeight: 1.6, margin: '0 0 20px' }}>Beste [Klantnaam],</p>
                                    <div style={{ color: '#333', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}
                                        dangerouslySetInnerHTML={{ __html: bodyHtml || '<p>Inhoud van de email...</p>' }} />
                                    {ctaText && ctaUrl && (
                                        <div style={{ textAlign: 'center', margin: '32px 0' }}>
                                            <a href={ctaUrl} style={{ display: 'inline-block', background: '#000', color: '#fff', textDecoration: 'none', padding: '14px 28px', borderRadius: '6px', fontWeight: 500, fontSize: '14px' }}>{ctaText}</a>
                                        </div>
                                    )}
                                    {selectedProducts.length > 0 && (
                                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
                                            <p style={{ color: '#888', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px' }}>AANBEVOLEN VOOR U</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                                {selectedProducts.slice(0, 3).map((p) => (
                                                    <div key={p.id} style={{ flex: 1, minWidth: '140px', maxWidth: '180px', textAlign: 'center', border: '1px solid #eee', borderRadius: '8px', padding: '16px' }}>
                                                        <p style={{ color: '#000', fontSize: '13px', margin: '0 0 4px', fontWeight: 500 }}>{p.name}</p>
                                                        <p style={{ color: '#000', fontSize: '15px', margin: 0, fontWeight: 600 }}>€{Number(p.price).toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <p style={{ color: '#999', fontSize: '11px', textAlign: 'center', margin: '32px 0 0' }}>
                                        <a href="#" style={{ color: '#999' }}>Uitschrijven</a> van promotionele emails
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white rounded-b-xl border-t border-zinc-200 flex justify-between">
                    <p className="text-sm text-zinc-500">Onderwerp: <strong>{subject || '(geen onderwerp)'}</strong></p>
                    <Button onClick={onClose}>Sluiten</Button>
                </div>
            </div>
        </div>
    );
}
