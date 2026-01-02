/**
 * Templates Modal Component
 * Modal for selecting pre-made email templates
 */

import { X } from "lucide-react";
import { type EmailTemplate } from "@/lib/admin/marketing";

export interface TemplatesModalProps {
    templates: EmailTemplate[];
    onSelect: (t: EmailTemplate) => void;
    onClose: () => void;
}

export function TemplatesModal({ templates, onSelect, onClose }: TemplatesModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden m-4">
                <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                    <h3 className="font-semibold">Email Templates</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto max-h-96 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {templates.map((template) => (
                            <button key={template.id} onClick={() => onSelect(template)}
                                className="text-left p-4 border border-zinc-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors">
                                <p className="font-semibold text-zinc-900">{template.name}</p>
                                <p className="text-sm text-zinc-500 mt-1">{template.description}</p>
                                <p className="text-xs text-purple-600 mt-2 truncate">{template.subject}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
