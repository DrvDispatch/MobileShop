/**
 * Tickets Admin Hook
 * 
 * Business logic for admin tickets/support page.
 * Handles ticket listing, filtering, and replies.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface TicketMessage {
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
    attachments?: string[];
}

export interface Ticket {
    id: string;
    ticketNumber: string;
    subject: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    customerName: string;
    customerEmail: string;
    createdAt: string;
    updatedAt: string;
    messages: TicketMessage[];
}

// Status configs
export const TICKET_STATUS_CONFIGS: Record<string, { label: string; color: string; bg: string }> = {
    OPEN: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100' },
    IN_PROGRESS: { label: 'In behandeling', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    RESOLVED: { label: 'Opgelost', color: 'text-green-600', bg: 'bg-green-100' },
    CLOSED: { label: 'Gesloten', color: 'text-zinc-600', bg: 'bg-zinc-100' },
};

export const TICKET_PRIORITY_CONFIGS: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Laag', color: 'text-zinc-500' },
    MEDIUM: { label: 'Normaal', color: 'text-blue-500' },
    HIGH: { label: 'Hoog', color: 'text-orange-500' },
    URGENT: { label: 'Urgent', color: 'text-red-500' },
};

export interface UseTicketsReturn {
    // Data
    tickets: Ticket[];
    filteredTickets: Ticket[];
    selectedTicket: Ticket | null;

    // Loading
    isLoading: boolean;
    isSending: boolean;

    // Filters
    searchQuery: string;
    statusFilter: string;
    setSearchQuery: (q: string) => void;
    setStatusFilter: (s: string) => void;

    // Actions
    refresh: () => Promise<void>;
    selectTicket: (ticket: Ticket | null) => void;
    sendReply: (ticketId: string, content: string, attachments?: string[]) => Promise<boolean>;
    updateTicketStatus: (id: string, status: string) => Promise<boolean>;
    closeTicket: (id: string) => Promise<boolean>;
}

export function useTickets(): UseTicketsReturn {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch tickets
    const fetchTickets = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminFetch<Ticket[]>('/api/tickets');
            setTickets(data);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Filtered tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const matchesSearch = !searchQuery ||
                t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.customerName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !statusFilter || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tickets, searchQuery, statusFilter]);

    // Select ticket
    const selectTicket = useCallback((ticket: Ticket | null) => {
        setSelectedTicket(ticket);
    }, []);

    // Send reply
    const sendReply = useCallback(async (ticketId: string, content: string, attachments?: string[]): Promise<boolean> => {
        setIsSending(true);
        try {
            await adminFetch(`/api/tickets/${ticketId}/reply`, {
                method: 'POST',
                body: JSON.stringify({ content, attachments }),
            });
            await fetchTickets();
            return true;
        } catch (err) {
            console.error('Failed to send reply:', err);
            return false;
        } finally {
            setIsSending(false);
        }
    }, [fetchTickets]);

    // Update ticket status
    const updateTicketStatus = useCallback(async (id: string, status: string): Promise<boolean> => {
        try {
            await adminFetch(`/api/tickets/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            await fetchTickets();
            return true;
        } catch (err) {
            console.error('Failed to update ticket:', err);
            return false;
        }
    }, [fetchTickets]);

    // Close ticket
    const closeTicket = useCallback(async (id: string): Promise<boolean> => {
        return updateTicketStatus(id, 'CLOSED');
    }, [updateTicketStatus]);

    return {
        tickets,
        filteredTickets,
        selectedTicket,
        isLoading,
        isSending,
        searchQuery,
        statusFilter,
        setSearchQuery,
        setStatusFilter,
        refresh: fetchTickets,
        selectTicket,
        sendReply,
        updateTicketStatus,
        closeTicket,
    };
}
