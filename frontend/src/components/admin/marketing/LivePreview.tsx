/**
 * Live Preview Component
 * Real-time preview of the marketing email as it's being composed
 */

import { Eye } from "lucide-react";
import { type MarketingProduct } from "@/lib/admin/marketing";

export interface LivePreviewProps {
    subject: string;
    headline: string;
    bodyHtml: string;
    ctaText: string;
    ctaUrl: string;
    selectedProducts: MarketingProduct[];
    shopName?: string;
}

export function LivePreview({ subject, headline, bodyHtml, ctaText, ctaUrl, selectedProducts, shopName = 'Store' }: LivePreviewProps) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-600">Live Preview</span>
            </div>
            <div className="bg-zinc-50 p-4 overflow-y-auto max-h-[600px]">
                <div style={{ maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ background: '#000', padding: '24px 32px', textAlign: 'center' }}>
                        <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', margin: 0 }}>{shopName.toUpperCase()}</p>
                    </div>
                    <div style={{ background: '#000', padding: '16px 32px', borderTop: '1px solid #222' }}>
                        <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, textAlign: 'center', margin: 0 }}>{headline || 'Je headline hier...'}</p>
                    </div>
                    <div style={{ padding: '24px 32px' }}>
                        <p style={{ color: '#333', fontSize: '14px', lineHeight: 1.6, margin: '0 0 16px' }}>Beste [Klantnaam],</p>
                        <div style={{ color: '#333', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}
                            dangerouslySetInnerHTML={{ __html: bodyHtml || '<p style="color:#999">Inhoud van de email...</p>' }} />
                        {ctaText && ctaUrl && (
                            <div style={{ textAlign: 'center', margin: '24px 0' }}>
                                <span style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '12px 24px', borderRadius: '6px', fontWeight: 500, fontSize: '13px' }}>{ctaText}</span>
                            </div>
                        )}
                        {selectedProducts.length > 0 && (
                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                                <p style={{ color: '#888', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>AANBEVOLEN VOOR U</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {selectedProducts.slice(0, 3).map((p) => (
                                        <div key={p.id} style={{ flex: 1, minWidth: '80px', maxWidth: '120px', textAlign: 'center', border: '1px solid #eee', borderRadius: '6px', padding: '10px' }}>
                                            <p style={{ color: '#000', fontSize: '11px', margin: '0 0 2px', fontWeight: 500 }}>{p.name}</p>
                                            <p style={{ color: '#000', fontSize: '12px', margin: 0, fontWeight: 600 }}>€{Number(p.price).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <p style={{ color: '#999', fontSize: '10px', textAlign: 'center', margin: '24px 0 0' }}>
                            <span style={{ color: '#999' }}>Uitschrijven</span> van promotionele emails
                        </p>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg border border-zinc-200">
                    <p className="text-xs text-zinc-500">Onderwerp:</p>
                    <p className="text-sm font-medium text-zinc-800">{subject || '(geen onderwerp)'}</p>
                </div>
            </div>
        </div>
    );
}
