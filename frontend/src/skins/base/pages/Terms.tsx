'use client';

/**
 * Base Skin - Terms Page
 * PURE PRESENTATION ONLY
 */

import type { TermsPageVM, LegalSectionVM } from '@core/hooks/pages/useTermsPageVM';
import { FileText, AlertCircle, Clock, Shield, CreditCard, Truck, RefreshCw, Scale, Mail } from 'lucide-react';

export interface TermsPageProps {
    vm: TermsPageVM;
}

function SectionIcon({ type, className }: { type: string; className?: string }) {
    switch (type) {
        case 'file-text': return <FileText className={className} />;
        case 'credit-card': return <CreditCard className={className} />;
        case 'truck': return <Truck className={className} />;
        case 'refresh': return <RefreshCw className={className} />;
        case 'shield': return <Shield className={className} />;
        case 'clock': return <Clock className={className} />;
        case 'alert': return <AlertCircle className={className} />;
        case 'scale': return <Scale className={className} />;
        default: return <FileText className={className} />;
    }
}

function LegalSection({ section }: { section: LegalSectionVM }) {
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 hover:border-zinc-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-600">
                    <SectionIcon type={section.iconType} className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">{section.title}</h2>
            </div>
            <ul className="space-y-3">
                {section.content.map((item, i) => (
                    <li key={i} className="text-zinc-600 text-sm leading-relaxed flex items-start gap-2">
                        <span className="text-zinc-400 mt-1.5">•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function TermsPage({ vm }: TermsPageProps) {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-8 h-8 text-zinc-600" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-3">Algemene Voorwaarden</h1>
                <p className="text-zinc-600 max-w-xl mx-auto">
                    Lees onze algemene voorwaarden zorgvuldig door voordat u een aankoop doet of gebruik maakt van onze diensten.
                </p>
                <p className="text-sm text-zinc-400 mt-4">Laatst bijgewerkt: 29 december 2024</p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
                {vm.sections.map((section, index) => <LegalSection key={index} section={section} />)}
            </div>

            {/* Contact Section */}
            <div className="mt-12 bg-zinc-50 rounded-2xl p-8 text-center">
                <Mail className="w-8 h-8 mx-auto mb-4 text-zinc-400" />
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Vragen over onze voorwaarden?</h3>
                <p className="text-zinc-600 text-sm mb-4">Neem gerust contact met ons op voor verdere verduidelijking.</p>
                <a href={`mailto:${vm.storeEmail}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors">
                    <Mail className="w-4 h-4" /> {vm.storeEmail}
                </a>
            </div>

            {/* Company Info */}
            <div className="mt-8 text-center text-sm text-zinc-400">
                <p>{vm.storeName}</p>
                <p>{vm.storeAddress.line1}, {vm.storeAddress.postalCode} {vm.storeAddress.city}</p>
                {vm.vatNumber && <p>BTW: {vm.vatNumber}</p>}
            </div>
        </div>
    );
}
