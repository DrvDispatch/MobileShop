/**
 * Chat Widget Module
 * 
 * Exports the hook and types for the chat widget.
 */

export { useChatWidget } from './useChatWidget';
export type {
    Attachment,
    Message,
    Ticket,
    ChatView,
    Category,
    NewTicketForm,
    ChatInputState,
    UseChatWidgetReturn,
} from './types';
export { DEFAULT_CATEGORIES } from './types';

// UI utility functions
export function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
}

// Format message with basic markdown support (bold, line breaks)
export function formatMessageText(text: string): string {
    // For simple text extraction without JSX - useful for previews
    return text.replace(/\*\*/g, '');
}
