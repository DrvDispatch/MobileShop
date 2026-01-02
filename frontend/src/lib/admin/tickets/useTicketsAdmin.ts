/**
 * Tickets Admin Hook (Extended)
 * 
 * Complete business logic for admin tickets page.
 * Handles WebSocket real-time updates, file uploads, chat messaging.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { adminFetch } from '@/lib/admin';

// Types
export interface Attachment {
    url: string;
    type: 'image' | 'file';
    name: string;
    size?: number;
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
    sessionId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    category: string;
    subject: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

// Status configs
export const TICKET_STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string; bgLight: string }> = {
    OPEN: { label: 'Open', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
    IN_PROGRESS: { label: 'In Behandeling', color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    RESOLVED: { label: 'Opgelost', color: 'bg-violet-500', textColor: 'text-violet-600', bgLight: 'bg-violet-50' },
    CLOSED: { label: 'Gesloten', color: 'bg-zinc-400', textColor: 'text-zinc-600', bgLight: 'bg-zinc-100' },
};

export const CATEGORY_LABELS: Record<string, string> = {
    REPAIR_QUESTION: '🔧 Reparatie',
    ORDER_QUESTION: '📦 Bestelling',
    PRICE_QUOTE: '💰 Offerte',
    GENERAL: '❓ Algemeen',
    DISPUTE: '⚠️ Geschil',
};

export function formatRelativeTime(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Nu';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}u`;
    return `${diffDays}d`;
}

export interface UseTicketsAdminReturn {
    // Data
    tickets: Ticket[];
    filteredTickets: Ticket[];
    selectedTicket: Ticket | null;

    // Connection
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;

    // Filters
    filterStatus: string;
    searchQuery: string;
    setFilterStatus: (s: string) => void;
    setSearchQuery: (q: string) => void;

    // Selection
    selectedTicketId: string | null;
    setSelectedTicketId: (id: string | null) => void;

    // Messaging
    replyMessage: string;
    setReplyMessage: (msg: string) => void;
    isSending: boolean;
    sendReply: () => Promise<void>;

    // Attachments
    attachments: Attachment[];
    setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
    isUploading: boolean;
    handleFileUpload: (files: FileList | null) => Promise<void>;
    cancelUpload: () => void;
    removeAttachment: (index: number) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;

    // Actions
    refresh: () => Promise<void>;
    updateStatus: (id: string, status: string) => Promise<void>;
    deleteTicket: (id: string) => Promise<void>;

    // Counts
    openCount: number;

    // Refs
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function useTicketsAdmin(): UseTicketsAdminReturn {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // File upload state
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadAbortRef = useRef<AbortController | null>(null);

    // Initialize WebSocket connection
    useEffect(() => {
        // For WebSocket, connect directly to backend (Next.js doesn't proxy WebSockets)
        // Pass current domain as query param for tenant resolution
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const currentDomain = typeof window !== 'undefined' ? window.location.host : 'localhost';

        console.log('[WebSocket] Connecting to:', backendUrl + '/tickets', 'with domain:', currentDomain);

        const newSocket = io(`${backendUrl}/tickets`, {
            transports: ['websocket', 'polling'],
            query: {
                domain: currentDomain,  // Pass domain for tenant resolution
            },
            // Enable reconnection
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        newSocket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error.message);
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('join:admin');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('ticket:new', (ticket: Ticket) => {
            setTickets(prev => [ticket, ...prev]);
        });

        newSocket.on('ticket:message', (data: { ticketId: string; message: Message }) => {
            setTickets(prev => prev.map(t =>
                t.id === data.ticketId
                    ? { ...t, messages: [...t.messages, data.message], updatedAt: new Date().toISOString() }
                    : t
            ));
            setSelectedTicket(prev =>
                prev?.id === data.ticketId
                    ? { ...prev, messages: [...prev.messages, data.message] }
                    : prev
            );
        });

        newSocket.on('ticket:update', (data: { ticketId: string; status?: string }) => {
            if (data.status) {
                setTickets(prev => prev.map(t =>
                    t.id === data.ticketId ? { ...t, status: data.status as Ticket['status'] } : t
                ));
                setSelectedTicket(prev =>
                    prev?.id === data.ticketId ? { ...prev, status: data.status as Ticket['status'] } : prev
                );
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Scroll to bottom when NEW messages are added (not on every render)
    const prevMessageCountRef = useRef<number>(0);
    useEffect(() => {
        const currentCount = selectedTicket?.messages?.length || 0;
        // Only scroll if a new message was added (count increased)
        if (currentCount > prevMessageCountRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessageCountRef.current = currentCount;
    }, [selectedTicket?.messages?.length]);

    // Fetch tickets on mount
    useEffect(() => {
        fetchTickets();
    }, []);

    // AUTO-POLLING: Poll every 5 seconds as fallback when WebSocket is not connected
    // This ensures real-time updates even without active WebSocket
    useEffect(() => {
        // Only poll if WebSocket is not connected
        if (isConnected) {
            return; // WebSocket is working, no need to poll
        }

        const pollInterval = setInterval(async () => {
            // Inline fetch to avoid circular dependency
            try {
                const token = localStorage.getItem('adminAccessToken');
                const res = await fetch('/api/tickets', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setTickets(data);
                }
            } catch (err) {
                console.error('Polling failed:', err);
            }

            // Also refresh selected ticket details
            if (selectedTicketId) {
                fetchTicketDetails(selectedTicketId);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(pollInterval);
    }, [selectedTicketId, isConnected]);

    // Fetch selected ticket details when selection changes
    useEffect(() => {
        if (selectedTicketId) {
            fetchTicketDetails(selectedTicketId);
        } else {
            setSelectedTicket(null);
        }
    }, [selectedTicketId]);

    const fetchTickets = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminAccessToken');
            const res = await fetch('/api/tickets', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch tickets');
            const data = await res.json();
            setTickets(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch tickets';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTicketDetails = async (id: string) => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const res = await fetch(`/api/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedTicket(data);
            }
        } catch (err) {
            console.error('Failed to fetch ticket details:', err);
        }
    };

    const updateStatus = useCallback(async (id: string, status: string) => {
        // OPTIMISTIC UPDATE: Update UI immediately for instant feedback
        setTickets(prev => prev.map(t =>
            t.id === id ? { ...t, status: status as Ticket['status'] } : t
        ));
        setSelectedTicket(prev =>
            prev?.id === id ? { ...prev, status: status as Ticket['status'] } : prev
        );

        try {
            const token = localStorage.getItem('adminAccessToken');
            const res = await fetch(`/api/tickets/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });

            // If request failed, revert the optimistic update by refetching
            if (!res.ok) {
                console.error('Status update failed, reverting...');
                fetchTickets();
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            // Revert on error
            fetchTickets();
        }
    }, [fetchTickets]);

    // Handle file upload
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newAttachments: Attachment[] = [];

        uploadAbortRef.current = new AbortController();
        const signal = uploadAbortRef.current.signal;

        for (const file of Array.from(files)) {
            if (signal.aborted) break;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'tickets');

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                    signal,
                });

                if (res.ok) {
                    const data = await res.json();
                    newAttachments.push({
                        url: data.url,
                        type: file.type.startsWith('image/') ? 'image' : 'file',
                        name: file.name,
                        size: file.size,
                    });
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') break;
                console.error('Failed to upload file:', err);
            }
        }

        if (!signal.aborted) {
            setAttachments(prev => [...prev, ...newAttachments]);
        }
        setIsUploading(false);
        uploadAbortRef.current = null;
    }, []);

    const cancelUpload = useCallback(() => {
        if (uploadAbortRef.current) {
            uploadAbortRef.current.abort();
            setIsUploading(false);
        }
    }, []);

    const removeAttachment = useCallback((index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    const sendReply = useCallback(async () => {
        if ((!replyMessage.trim() && attachments.length === 0) || !selectedTicket) return;

        const msgText = replyMessage;
        const msgAttachments = [...attachments];
        setReplyMessage('');
        setAttachments([]);
        setIsSending(true);

        try {
            const token = localStorage.getItem('adminAccessToken');
            const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    sender: 'staff',
                    message: msgText || (msgAttachments.length > 0 ? '📎 Bestand(en) bijgevoegd' : ''),
                    attachments: msgAttachments,
                }),
            });

            if (res.ok) {
                if (selectedTicket.status === 'OPEN') {
                    updateStatus(selectedTicket.id, 'IN_PROGRESS');
                }
            } else {
                setReplyMessage(msgText);
                setAttachments(msgAttachments);
            }
        } catch (err) {
            console.error('Failed to send reply:', err);
            setReplyMessage(msgText);
            setAttachments(msgAttachments);
        } finally {
            setIsSending(false);
        }
    }, [replyMessage, attachments, selectedTicket, updateStatus]);

    const deleteTicket = useCallback(async (id: string) => {
        if (!confirm('Weet u zeker dat u dit ticket wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;

        try {
            const token = localStorage.getItem('adminAccessToken');
            const res = await fetch(`/api/tickets/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setTickets(prev => prev.filter(t => t.id !== id));
                if (selectedTicketId === id) {
                    setSelectedTicketId(null);
                    setSelectedTicket(null);
                }
            } else {
                alert('Kan ticket niet verwijderen. Alleen gesloten tickets kunnen worden verwijderd.');
            }
        } catch (err) {
            console.error('Failed to delete ticket:', err);
            alert('Er is een fout opgetreden bij het verwijderen.');
        }
    }, [selectedTicketId]);

    // Filtered tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
            const matchesSearch = searchQuery === '' ||
                t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.subject.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [tickets, filterStatus, searchQuery]);

    const openCount = useMemo(() => tickets.filter(t => t.status === 'OPEN').length, [tickets]);

    return {
        tickets,
        filteredTickets,
        selectedTicket,
        isConnected,
        isLoading,
        error,
        filterStatus,
        searchQuery,
        setFilterStatus,
        setSearchQuery,
        selectedTicketId,
        setSelectedTicketId,
        replyMessage,
        setReplyMessage,
        isSending,
        sendReply,
        attachments,
        setAttachments,
        isUploading,
        handleFileUpload,
        cancelUpload,
        removeAttachment,
        fileInputRef,
        refresh: fetchTickets,
        updateStatus,
        deleteTicket,
        openCount,
        messagesEndRef,
    };
}
