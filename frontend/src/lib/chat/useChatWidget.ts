/**
 * @core-only
 * 
 * Chat Widget Hook - Business Logic Layer
 * 
 * UI-AGNOSTIC HOOK containing all chat widget logic:
 * - Socket.io connection management
 * - Ticket CRUD operations
 * - File upload handling
 * - View state machine (list/new/chat)
 * - Form state management
 * 
 * The UI component should only render data and forward user intent.
 * 
 * Skins must NOT import this directly. The chat widget wrapper calls
 * this hook and passes the view-model as props to the active skin.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
    Ticket,
    Message,
    Attachment,
    ChatView,
    NewTicketForm,
    ChatInputState,
    UseChatWidgetReturn,
    DEFAULT_CATEGORIES,
} from "./types";

// Session ID helper - persisted in localStorage
function getSessionId(): string {
    if (typeof window === "undefined") return "";
    let sessionId = localStorage.getItem("chat_session_id");
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("chat_session_id", sessionId);
    }
    return sessionId;
}

// Get stored customer info
function getStoredCustomerInfo(): { name: string; email: string } {
    if (typeof window === "undefined") return { name: "", email: "" };
    return {
        name: localStorage.getItem("chat_customer_name") || "",
        email: localStorage.getItem("chat_customer_email") || "",
    };
}

// Save customer info
function saveCustomerInfo(name: string, email: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("chat_customer_name", name);
    if (email) localStorage.setItem("chat_customer_email", email);
}

export function useChatWidget(): UseChatWidgetReturn {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith("/admin");
    const sessionId = getSessionId();

    // Widget state
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<ChatView>("list");
    const [isLoading, setIsLoading] = useState(false);

    // Socket state
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Tickets state
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

    // New ticket form state
    const storedInfo = getStoredCustomerInfo();
    const [form, setForm] = useState<NewTicketForm>({
        name: storedInfo.name,
        email: storedInfo.email,
        category: "",
        orderNumber: "",
        message: "",
    });

    // Chat input state
    const [input, setInput] = useState<ChatInputState>({
        newMessage: "",
        attachments: [],
        isSending: false,
        isUploading: false,
    });

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadAbortRef = useRef<AbortController | null>(null);

    // Derived state
    const activeTickets = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS");
    const closedTickets = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED");
    const hasActiveTickets = activeTickets.length > 0;

    const isFormValid = Boolean(
        form.name &&
        form.category &&
        form.message &&
        (form.category !== "REFUND" || form.orderNumber.trim())
    );

    const canSend = Boolean((input.newMessage.trim() || input.attachments.length > 0) && !input.isSending);

    // ============================================
    // SOCKET.IO CONNECTION MANAGEMENT
    // ============================================
    useEffect(() => {
        if (isAdminPage || !sessionId) return;

        const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const newSocket = io(`${socketUrl}/tickets`, {
            transports: ["websocket", "polling"],
        });

        newSocket.on("connect", () => {
            console.log("Chat widget connected");
            setIsConnected(true);
            newSocket.emit("join:session", { sessionId });
        });

        newSocket.on("disconnect", () => {
            console.log("Chat widget disconnected");
            setIsConnected(false);
        });

        newSocket.on("ticket:message", (data: { ticketId: string; message: Message }) => {
            console.log("Received message:", data);
            setActiveTicket(prev =>
                prev?.id === data.ticketId
                    ? { ...prev, messages: [...prev.messages, data.message] }
                    : prev
            );
            setTickets(prev => prev.map(t =>
                t.id === data.ticketId
                    ? { ...t, messages: [...t.messages, data.message], updatedAt: new Date().toISOString() }
                    : t
            ));
        });

        newSocket.on("ticket:update", (data: { ticketId: string; status?: string }) => {
            if (data.status) {
                setActiveTicket(prev =>
                    prev?.id === data.ticketId ? { ...prev, status: data.status! } : prev
                );
                setTickets(prev => prev.map(t =>
                    t.id === data.ticketId ? { ...t, status: data.status! } : t
                ));
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [sessionId, isAdminPage]);

    // Listen for custom event to open widget
    useEffect(() => {
        const handleOpenWidget = () => setIsOpen(true);
        window.addEventListener("openChatWidget", handleOpenWidget);
        return () => window.removeEventListener("openChatWidget", handleOpenWidget);
    }, []);

    // Load tickets when opening
    useEffect(() => {
        if (isOpen && sessionId) {
            loadTickets();
        }
    }, [isOpen, sessionId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeTicket?.messages]);

    // ============================================
    // TICKET OPERATIONS
    // ============================================
    const loadTickets = useCallback(async () => {
        if (!sessionId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/tickets/session/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
                // Auto-open the most recent active ticket
                const openTicket = data.find((t: Ticket) => t.status === "OPEN" || t.status === "IN_PROGRESS");
                if (openTicket && !activeTicket) {
                    setActiveTicket(openTicket);
                    setView("chat");
                }
            }
        } catch (err) {
            console.error("Failed to load tickets:", err);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, activeTicket]);

    const createTicket = useCallback(async () => {
        if (!isFormValid) return;

        setInput(prev => ({ ...prev, isSending: true }));
        try {
            // Build subject and message based on category
            let subject = DEFAULT_CATEGORIES.find(c => c.id === form.category)?.label || "Vraag";
            let finalMessage = form.message;

            if (form.category === "REFUND" && form.orderNumber) {
                subject = `Terugbetalingsverzoek - Order #${form.orderNumber}`;
                finalMessage = `**Bestelnummer:** ${form.orderNumber}\n\n${form.message}`;
            }

            const res = await fetch(`/api/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    customerName: form.name,
                    customerEmail: form.email || undefined,
                    category: form.category,
                    subject,
                    initialMessage: finalMessage,
                }),
            });

            if (res.ok) {
                const ticket = await res.json();
                // Save name and email for next time
                saveCustomerInfo(form.name, form.email);

                setActiveTicket(ticket);
                setView("chat");
                setTickets(prev => [ticket, ...prev]);
                setForm(prev => ({ ...prev, message: "", orderNumber: "" }));
            }
        } catch (err) {
            console.error("Failed to create ticket:", err);
        } finally {
            setInput(prev => ({ ...prev, isSending: false }));
        }
    }, [form, isFormValid, sessionId]);

    const sendMessage = useCallback(async () => {
        if (!canSend || !activeTicket) return;

        const msgText = input.newMessage;
        const msgAttachments = [...input.attachments];
        setInput(prev => ({ ...prev, newMessage: "", attachments: [], isSending: true }));

        try {
            const payload = {
                sender: "customer",
                message: msgText || (msgAttachments.length > 0 ? "📎 Bestand(en) bijgevoegd" : ""),
                attachments: msgAttachments,
            };
            console.log('Sending message payload:', JSON.stringify(payload, null, 2));

            const res = await fetch(`/api/tickets/${activeTicket.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                setInput(prev => ({ ...prev, newMessage: msgText, attachments: msgAttachments }));
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            setInput(prev => ({ ...prev, newMessage: msgText, attachments: msgAttachments }));
        } finally {
            setInput(prev => ({ ...prev, isSending: false }));
        }
    }, [input.newMessage, input.attachments, canSend, activeTicket]);

    const openTicket = useCallback((ticket: Ticket) => {
        setActiveTicket(ticket);
        setView("chat");
    }, []);

    // ============================================
    // FILE UPLOAD HANDLING
    // ============================================
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setInput(prev => ({ ...prev, isUploading: true }));
        const newAttachments: Attachment[] = [];

        // Create abort controller for this upload batch
        uploadAbortRef.current = new AbortController();
        const signal = uploadAbortRef.current.signal;

        for (const file of Array.from(files)) {
            // Check if cancelled
            if (signal.aborted) break;

            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "tickets");

            try {
                const res = await fetch(`/api/upload`, {
                    method: "POST",
                    body: formData,
                    signal,
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log('Upload response:', data);
                    const attachment: Attachment = {
                        url: data.url,
                        type: file.type.startsWith("image/") ? "image" : "file" as "image" | "file",
                        name: file.name,
                        size: file.size,
                    };
                    console.log('Created attachment:', attachment);
                    newAttachments.push(attachment);
                } else {
                    console.error('Upload failed with status:', res.status);
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    console.log("Upload cancelled by user");
                    break;
                }
                console.error("Failed to upload file:", err);
            }
        }

        if (!signal.aborted) {
            setInput(prev => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] }));
        }
        setInput(prev => ({ ...prev, isUploading: false }));
        uploadAbortRef.current = null;
    }, []);

    const cancelUpload = useCallback(() => {
        if (uploadAbortRef.current) {
            uploadAbortRef.current.abort();
            setInput(prev => ({ ...prev, isUploading: false }));
        }
    }, []);

    const removeAttachment = useCallback((index: number) => {
        setInput(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    }, []);

    // ============================================
    // FORM HELPERS
    // ============================================
    const setFormField = useCallback((field: keyof NewTicketForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const setNewMessage = useCallback((message: string) => {
        setInput(prev => ({ ...prev, newMessage: message }));
    }, []);

    const goBack = useCallback(() => {
        setView("list");
        setActiveTicket(null);
    }, []);

    // ============================================
    // RETURN HOOK VALUE
    // ============================================
    return {
        // Widget state
        isOpen,
        setIsOpen,
        view,
        setView,

        // Connection state
        isConnected,
        isLoading,

        // Tickets
        tickets,
        activeTicket,
        activeTickets,
        closedTickets,
        hasActiveTickets,

        // Ticket actions
        openTicket,
        createTicket,
        sendMessage,
        loadTickets,

        // New ticket form
        form,
        setFormField,
        isFormValid,

        // Chat input
        input,
        setNewMessage,
        handleFileUpload,
        removeAttachment,
        cancelUpload,
        canSend,

        // Categories
        categories: DEFAULT_CATEGORIES,

        // Refs
        fileInputRef,
        messagesEndRef,

        // Navigation
        goBack,
    };
}
