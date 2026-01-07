'use client';

/**
 * Base Skin - Privacy Page
 * PURE PRESENTATION ONLY
 */

import type { PrivacyPageVM, LegalSectionVM } from '@core/hooks/pages/usePrivacyPageVM';
import { Shield, Database, Eye, Lock, UserCheck, Globe, Clock, AlertTriangle, Mail, Settings } from 'lucide-react';

export interface PrivacyPageProps {
    vm: PrivacyPageVM;
}

function SectionIcon({ type, className }: { type: string; className?: string }) {
    switch (type) {
        case 'database': return <Database className={className} />;
        case 'eye': return <Eye className={className} />;
        case 'user-check': return <UserCheck className={className} />;
        case 'globe': return <Globe className={className} />;
        case 'lock': return <Lock className={className} />;
        case 'clock': return <Clock className={className} />;
        case 'settings': return <Settings className={className} />;
        case 'alert': return <AlertTriangle className={className} />;
        default: return <Shield className={className} />;
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
                        <span className="text-emerald-500 mt-1.5">•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function PrivacyPage({ vm }: PrivacyPageProps) {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-3">Privacybeleid</h1>
                <p className="text-zinc-600 max-w-xl mx-auto">
                    Wij respecteren uw privacy en beschermen uw persoonsgegevens conform de Algemene Verordening Gegevensbescherming (AVG/GDPR).
                </p>
                <p className="text-sm text-zinc-400 mt-4">Laatst bijgewerkt: 29 december 2024</p>
            </div>

            {/* Intro Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 mb-8">
                <h2 className="font-semibold text-zinc-900 mb-3">Samenvatting</h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                    {vm.storeName} verzamelt alleen de gegevens die nodig zijn om uw bestellingen en reparaties uit te voeren.
                    Wij delen uw gegevens nooit voor commerciële doeleinden en nemen passende maatregelen om uw gegevens te beschermen.
                    U heeft te allen tijde recht op inzage, correctie en verwijdering van uw gegevens.
                </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {vm.sections.map((section, index) => <LegalSection key={index} section={section} />)}
            </div>

            {/* Contact & Complaints */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-50 rounded-2xl p-6">
                    <Mail className="w-8 h-8 mb-4 text-zinc-400" />
                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">Vragen of verzoeken?</h3>
                    <p className="text-zinc-600 text-sm mb-4">Voor vragen over uw privacy of om uw rechten uit te oefenen, neem contact op:</p>
                    <a href={`mailto:${vm.storeEmail}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                        <Mail className="w-4 h-4" /> {vm.storeEmail}
                    </a>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-6">
                    <AlertTriangle className="w-8 h-8 mb-4 text-zinc-400" />
                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">Klachten?</h3>
                    <p className="text-zinc-600 text-sm mb-4">U heeft het recht een klacht in te dienen bij de Gegevensbeschermingsautoriteit:</p>
                    <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer"
                        className="text-emerald-600 text-sm font-medium hover:underline">www.gegevensbeschermingsautoriteit.be →</a>
                </div>
            </div>

            {/* Company Info */}
            <div className="mt-12 text-center text-sm text-zinc-400 border-t border-zinc-100 pt-8">
                <p className="font-medium text-zinc-600 mb-2">Verwerkingsverantwoordelijke:</p>
                <p>{vm.storeName}</p>
                <p>{vm.storeAddress.line1}, {vm.storeAddress.postalCode} {vm.storeAddress.city}</p>
                {vm.vatNumber && <p>BTW: {vm.vatNumber}</p>}
                <p>{vm.storeEmail}</p>
            </div>
        </div>
    );
}
