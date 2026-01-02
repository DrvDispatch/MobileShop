/**
 * Chat Widget Types
 * 
 * Type definitions for the chat widget system.
 * Shared between the hook and UI component.
 */

export interface Attachment {
    url: string;
    type: 'image' | 'file';
    name: string;
    size?: number;
    mimeType?: string;
}

export interface Message {
    id: string;
    sender: string;
    message: string;
    attachments?: Attachment[];
    createdAt: string;
}

export interface Ticket {
    id: string;
    caseId: string;
    subject: string;
    status: string;
    messages: Message[];
    updatedAt: string;
}

export type ChatView = "list" | "new" | "chat";

export interface Category {
    id: string;
    label: string;
    icon: string;
    color: string;
}

// Default categories - can be overridden by tenant config
export const DEFAULT_CATEGORIES: Category[] = [
    { id: "REPAIR_QUESTION", label: "Reparatie vraag", icon: "🔧", color: "from-orange-500 to-amber-500" },
    { id: "ORDER_QUESTION", label: "Bestelling vraag", icon: "📦", color: "from-blue-500 to-cyan-500" },
    { id: "PRICE_QUOTE", label: "Prijs offerte", icon: "💰", color: "from-emerald-500 to-green-500" },
    { id: "GENERAL", label: "Algemene vraag", icon: "❓", color: "from-violet-500 to-purple-500" },
    { id: "DISPUTE", label: "Geschil", icon: "⚠️", color: "from-red-500 to-rose-500" },
    { id: "REFUND", label: "Terugbetaling", icon: "💸", color: "from-orange-500 to-red-500" },
];

export interface NewTicketForm {
    name: string;
    email: string;
    category: string;
    orderNumber: string;
    message: string;
}

export interface ChatInputState {
    newMessage: string;
    attachments: Attachment[];
    isSending: boolean;
    isUploading: boolean;
}

export interface UseChatWidgetReturn {
    // Widget state
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    view: ChatView;
    setView: (view: ChatView) => void;

    // Connection state
    isConnected: boolean;
    isLoading: boolean;

    // Tickets
    tickets: Ticket[];
    activeTicket: Ticket | null;
    activeTickets: Ticket[];
    closedTickets: Ticket[];
    hasActiveTickets: boolean;

    // Ticket actions
    openTicket: (ticket: Ticket) => void;
    createTicket: () => Promise<void>;
    sendMessage: () => Promise<void>;
    loadTickets: () => Promise<void>;

    // New ticket form
    form: NewTicketForm;
    setFormField: (field: keyof NewTicketForm, value: string) => void;
    isFormValid: boolean;

    // Chat input
    input: ChatInputState;
    setNewMessage: (message: string) => void;
    handleFileUpload: (files: FileList | null) => Promise<void>;
    removeAttachment: (index: number) => void;
    cancelUpload: () => void;
    canSend: boolean;

    // Categories
    categories: Category[];

    // Refs
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;

    // Navigation
    goBack: () => void;
}
