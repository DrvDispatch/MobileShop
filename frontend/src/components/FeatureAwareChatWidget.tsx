'use client';

import { useFeatures } from '@/contexts/FeatureContext';
import { ChatWidget } from './chat-widget';

/**
 * Feature-aware ChatWidget wrapper
 * 
 * Rule: Widget must not mount at all when disabled - not hidden via CSS
 * 
 * Only renders if:
 * - ticketsEnabled is true
 * - liveChatWidget is true
 */
export function FeatureAwareChatWidget() {
    const { ticketsEnabled, liveChatWidget } = useFeatures();

    // Parent gate: tickets must be enabled
    if (!ticketsEnabled) return null;

    // Sub-feature: live chat widget must be enabled
    if (!liveChatWidget) return null;

    return <ChatWidget />;
}
