/**
 * Segment Selector Component
 * Displays selectable customer segments for marketing emails
 */

import { Loader2, ChevronRight } from "lucide-react";

export interface SegmentSelectorProps {
    segments: { segment: string; label: string; count: number }[];
    selectedSegment: string;
    isLoading: boolean;
    onSelect: (s: string) => void;
    onViewUsers: (s: string, label: string) => void;
    getSegmentIcon: (s: string) => React.ReactNode;
}

export function SegmentSelector({ segments, selectedSegment, isLoading, onSelect, onViewUsers, getSegmentIcon }: SegmentSelectorProps) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <h3 className="font-semibold text-zinc-900 mb-4">Doelgroep</h3>
            {isLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
            ) : (
                <div className="space-y-2">
                    {segments.map((seg) => (
                        <div key={seg.segment} onClick={() => onSelect(seg.segment)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-zinc-50 ${selectedSegment === seg.segment ? "border-purple-500 bg-purple-50" : "border-zinc-200"}`}>
                            <button onClick={(e) => { e.stopPropagation(); onSelect(seg.segment); }}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedSegment === seg.segment ? "border-purple-500 bg-purple-500" : "border-zinc-300"}`}>
                                {selectedSegment === seg.segment && <div className="w-2 h-2 rounded-full bg-white" />}
                            </button>
                            <div className={selectedSegment === seg.segment ? "text-purple-600" : "text-zinc-400"}>
                                {getSegmentIcon(seg.segment)}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-zinc-900">{seg.label}</p>
                                <p className="text-sm text-zinc-500">{seg.count} {seg.count === 1 ? "gebruiker" : "gebruikers"}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onViewUsers(seg.segment, seg.label); }}
                                className="p-1 hover:bg-zinc-200 rounded" title="Bekijk gebruikers">
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
