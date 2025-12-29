"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    MessageCircle,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
    Send,
    User,
    Headphones,
    Circle,
    Search,
    Trash2,
    FileText,
    Paperclip,
    X
} from "lucide-react";

interface Attachment {
    url: string;
    type: 'image' | 'file';
    name: string;
    size?: number;
}

interface Message {
    id: string;
    sender: string;
    message: string;
    attachments?: Attachment[];
    createdAt: string;
}

interface Ticket {
    id: string;
    caseId: string;
    sessionId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    category: string;
    subject: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

const STATUS_CONFIG = {
    OPEN: { label: "Open", color: "bg-emerald-500", textColor: "text-emerald-600", bgLight: "bg-emerald-50" },
    IN_PROGRESS: { label: "In Behandeling", color: "bg-blue-500", textColor: "text-blue-600", bgLight: "bg-blue-50" },
    RESOLVED: { label: "Opgelost", color: "bg-violet-500", textColor: "text-violet-600", bgLight: "bg-violet-50" },
    CLOSED: { label: "Gesloten", color: "bg-zinc-400", textColor: "text-zinc-600", bgLight: "bg-zinc-100" },
};

const CATEGORY_LABELS: Record<string, string> = {
    REPAIR_QUESTION: "🔧 Reparatie",
    ORDER_QUESTION: "📦 Bestelling",
    PRICE_QUOTE: "💰 Offerte",
    GENERAL: "❓ Algemeen",
    DISPUTE: "⚠️ Geschil",
};

function formatRelativeTime(date: string) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Nu";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}u`;
    return `${diffDays}d`;
}

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [replyMessage, setReplyMessage] = useState("");
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
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const newSocket = io(`${socketUrl}/tickets`, {
            transports: ["websocket", "polling"],
        });

        newSocket.on("connect", () => {
            console.log("WebSocket connected");
            setIsConnected(true);
            newSocket.emit("join:admin");
        });

        newSocket.on("disconnect", () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
        });

        newSocket.on("ticket:new", (ticket: Ticket) => {
            console.log("New ticket received:", ticket);
            setTickets(prev => [ticket, ...prev]);
        });

        newSocket.on("ticket:message", (data: { ticketId: string; message: Message }) => {
            console.log("New message received:", data);
            console.log("Message attachments from WS:", data.message?.attachments);
            // Update ticket in list
            setTickets(prev => prev.map(t =>
                t.id === data.ticketId
                    ? { ...t, messages: [...t.messages, data.message], updatedAt: new Date().toISOString() }
                    : t
            ));
            // Update selected ticket if it's the one that got a new message
            setSelectedTicket(prev =>
                prev?.id === data.ticketId
                    ? { ...prev, messages: [...prev.messages, data.message] }
                    : prev
            );
        });

        newSocket.on("ticket:update", (data: { ticketId: string; status?: string }) => {
            console.log("Ticket updated:", data);
            if (data.status) {
                setTickets(prev => prev.map(t =>
                    t.id === data.ticketId ? { ...t, status: data.status as any } : t
                ));
                setSelectedTicket(prev =>
                    prev?.id === data.ticketId ? { ...prev, status: data.status as any } : prev
                );
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedTicket?.messages]);

    // Fetch tickets on mount
    useEffect(() => {
        fetchTickets();
    }, []);

    // Fetch selected ticket details when selection changes
    useEffect(() => {
        if (selectedTicketId) {
            fetchTicketDetails(selectedTicketId);
        }
    }, [selectedTicketId]);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch tickets");
            const data = await res.json();
            setTickets(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTicketDetails = async (id: string) => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedTicket(data);
            }
        } catch (err) {
            console.error("Failed to fetch ticket details:", err);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status }),
            });
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    // Handle file upload
    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newAttachments: Attachment[] = [];

        uploadAbortRef.current = new AbortController();
        const signal = uploadAbortRef.current.signal;

        for (const file of Array.from(files)) {
            if (signal.aborted) break;

            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "tickets");

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
                    method: "POST",
                    body: formData,
                    signal,
                });

                if (res.ok) {
                    const data = await res.json();
                    const attachment: Attachment = {
                        url: data.url,
                        type: file.type.startsWith("image/") ? "image" : "file",
                        name: file.name,
                        size: file.size,
                    };
                    newAttachments.push(attachment);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    break;
                }
                console.error("Failed to upload file:", err);
            }
        }

        if (!signal.aborted) {
            setAttachments(prev => [...prev, ...newAttachments]);
        }
        setIsUploading(false);
        uploadAbortRef.current = null;
    };

    const cancelUpload = () => {
        if (uploadAbortRef.current) {
            uploadAbortRef.current.abort();
            setIsUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const sendReply = async () => {
        if ((!replyMessage.trim() && attachments.length === 0) || !selectedTicket) return;

        const msgText = replyMessage;
        const msgAttachments = [...attachments];
        setReplyMessage("");
        setAttachments([]);
        setIsSending(true);

        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${selectedTicket.id}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    sender: "staff",
                    message: msgText || (msgAttachments.length > 0 ? "📎 Bestand(en) bijgevoegd" : ""),
                    attachments: msgAttachments,
                }),
            });

            if (res.ok) {
                // Update status to in progress if it was open
                if (selectedTicket.status === "OPEN") {
                    updateStatus(selectedTicket.id, "IN_PROGRESS");
                }
            } else {
                // Restore on failure
                setReplyMessage(msgText);
                setAttachments(msgAttachments);
            }
        } catch (err) {
            console.error("Failed to send reply:", err);
            setReplyMessage(msgText);
            setAttachments(msgAttachments);
        } finally {
            setIsSending(false);
        }
    };

    const deleteTicket = async (id: string) => {
        if (!confirm("Weet u zeker dat u dit ticket wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
            return;
        }
        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                // Remove from list and clear selection
                setTickets(prev => prev.filter(t => t.id !== id));
                if (selectedTicketId === id) {
                    setSelectedTicketId(null);
                    setSelectedTicket(null);
                }
            } else {
                alert("Kan ticket niet verwijderen. Alleen gesloten tickets kunnen worden verwijderd.");
            }
        } catch (err) {
            console.error("Failed to delete ticket:", err);
            alert("Er is een fout opgetreden bij het verwijderen.");
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesStatus = filterStatus === "all" || t.status === filterStatus;
        const matchesSearch = searchQuery === "" ||
            t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.subject.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const openCount = tickets.filter(t => t.status === "OPEN").length;

    return (
        <div className="h-screen flex flex-col bg-zinc-100">
            {/* Header */}
            <header className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white shadow-lg">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    <MessageCircle className="w-6 h-6" />
                                    Support Tickets
                                </h1>
                                <p className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Circle className={`w-2 h-2 ${isConnected ? "fill-emerald-500 text-emerald-500" : "fill-red-500 text-red-500"}`} />
                                    {isConnected ? "Live verbonden" : "Niet verbonden"}
                                    {openCount > 0 && <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">{openCount} open</span>}
                                </p>
                            </div>
                        </div>
                        <Button onClick={fetchTickets} variant="outline" size="sm" className="text-zinc-900 border-white/20 hover:bg-white/10">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Vernieuwen
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Ticket List Sidebar */}
                <div className="w-[380px] bg-white border-r border-zinc-200 flex flex-col">
                    {/* Search & Filters */}
                    <div className="p-4 border-b border-zinc-100 space-y-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Zoeken..."
                                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                            <button
                                onClick={() => setFilterStatus("all")}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                    }`}
                            >
                                Alle
                            </button>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => setFilterStatus(key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === key ? `${config.color} text-white` : `${config.bgLight} ${config.textColor} hover:opacity-80`
                                        }`}
                                >
                                    {config.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                            </div>
                        )}

                        {!isLoading && filteredTickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className={`w-full text-left p-4 border-b border-zinc-100 transition-colors hover:bg-zinc-50 ${selectedTicketId === ticket.id ? "bg-emerald-50 border-l-4 border-l-emerald-500" : ""
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${ticket.status === "OPEN" ? "bg-emerald-500" :
                                        ticket.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-zinc-400"
                                        }`}>
                                        {ticket.customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-zinc-900 truncate">{ticket.customerName}</span>
                                            <span className="text-xs text-zinc-500">{formatRelativeTime(ticket.updatedAt)}</span>
                                        </div>
                                        <p className="text-sm text-zinc-600 truncate mb-1">{ticket.subject}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[ticket.status].bgLight} ${STATUS_CONFIG[ticket.status].textColor}`}>
                                                {STATUS_CONFIG[ticket.status].label}
                                            </span>
                                            <span className="text-xs text-zinc-400">#{ticket.caseId}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}

                        {!isLoading && filteredTickets.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                                <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                                <p>Geen tickets gevonden</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-zinc-50">
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white border-b border-zinc-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${selectedTicket.status === "OPEN" ? "bg-emerald-500" :
                                            selectedTicket.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-zinc-400"
                                            }`}>
                                            {selectedTicket.customerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-zinc-900">{selectedTicket.customerName}</h2>
                                            <p className="text-sm text-zinc-500">
                                                {CATEGORY_LABELS[selectedTicket.category]} • #{selectedTicket.caseId}
                                                {selectedTicket.customerEmail && ` • ${selectedTicket.customerEmail}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Oplossen - only show for OPEN or IN_PROGRESS */}
                                        {(selectedTicket.status === "OPEN" || selectedTicket.status === "IN_PROGRESS") && (
                                            <Button
                                                size="sm"
                                                className="bg-violet-600 hover:bg-violet-700"
                                                onClick={() => updateStatus(selectedTicket.id, "RESOLVED")}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Oplossen
                                            </Button>
                                        )}
                                        {/* Sluiten - only show for OPEN, IN_PROGRESS, or RESOLVED (not CLOSED) */}
                                        {(selectedTicket.status === "OPEN" || selectedTicket.status === "IN_PROGRESS" || selectedTicket.status === "RESOLVED") && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateStatus(selectedTicket.id, "CLOSED")}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Sluiten
                                            </Button>
                                        )}
                                        {/* Heropenen - only show for CLOSED */}
                                        {selectedTicket.status === "CLOSED" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateStatus(selectedTicket.id, "OPEN")}
                                            >
                                                <RefreshCw className="w-4 h-4 mr-1" />
                                                Heropenen
                                            </Button>
                                        )}
                                        {/* Verwijderen - only for CLOSED tickets */}
                                        {selectedTicket.status === "CLOSED" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                onClick={() => deleteTicket(selectedTicket.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Verwijderen
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {selectedTicket.messages.map((msg, idx) => {
                                    // Debug: log attachment data
                                    if (msg.attachments) {
                                        console.log('Message attachments:', msg.attachments, 'Type:', typeof msg.attachments);
                                    }
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex items-end gap-2 ${msg.sender === "customer" ? "justify-start" : "justify-end"}`}
                                        >
                                            {msg.sender === "customer" && (
                                                <div className="w-8 h-8 rounded-full bg-zinc-300 flex items-center justify-center text-zinc-600">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[60%] px-4 py-3 rounded-2xl ${msg.sender === "customer"
                                                    ? "bg-white border border-zinc-200 rounded-bl-md"
                                                    : "bg-emerald-600 text-white rounded-br-md"
                                                    }`}
                                            >
                                                {/* Attachments */}
                                                {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                                    <div className="mb-2 space-y-2">
                                                        {(msg.attachments as any[]).map((att: any, attIdx: number) => {
                                                            // Check if it's an image by type or URL extension
                                                            const isImage = att.type === "image" ||
                                                                /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(att.url || '') ||
                                                                (att.mimeType && att.mimeType.startsWith('image/'));

                                                            return isImage ? (
                                                                <a key={attIdx} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                                                                    <img
                                                                        src={att.url}
                                                                        alt={att.name || 'Attachment'}
                                                                        className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 border border-zinc-200"
                                                                        onError={(e) => {
                                                                            console.error('Image failed to load:', att.url);
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    key={attIdx}
                                                                    href={att.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`flex items-center gap-2 p-2 rounded-lg ${msg.sender === "customer"
                                                                        ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                                                                        : "bg-white/10 hover:bg-white/20"
                                                                        }`}
                                                                >
                                                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                                                    <span className="text-xs truncate">{att.name || 'Download file'}</span>
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                <p className="text-sm leading-relaxed">{msg.message}</p>
                                                <p className={`text-xs mt-1 ${msg.sender === "customer" ? "text-zinc-400" : "text-emerald-200"}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {msg.sender !== "customer" && (
                                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                                                    <Headphones className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input */}
                            <div className="bg-white border-t border-zinc-200 p-4">
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                />

                                {/* Attachment previews */}
                                {attachments.length > 0 && (
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {attachments.map((att, idx) => (
                                            <div key={idx} className="relative group">
                                                {att.type === "image" ? (
                                                    <img
                                                        src={att.url}
                                                        alt={att.name}
                                                        className="w-16 h-16 object-cover rounded-lg border border-zinc-200"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-zinc-100 rounded-lg border border-zinc-200 flex flex-col items-center justify-center">
                                                        <FileText className="w-6 h-6 text-zinc-500" />
                                                        <span className="text-[8px] text-zinc-500 mt-1 truncate max-w-14">{att.name}</span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => removeAttachment(idx)}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {isUploading && (
                                            <div className="relative w-16 h-16 bg-zinc-100 rounded-lg border border-zinc-200 flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                                <button
                                                    onClick={cancelUpload}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                                                    title="Annuleer upload"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-12 h-12 bg-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center hover:bg-zinc-200 disabled:opacity-50 transition-all"
                                        title="Bestand bijvoegen"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Paperclip className="w-5 h-5" />
                                        )}
                                    </button>
                                    <input
                                        type="text"
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                                        placeholder="Typ uw antwoord..."
                                        className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    <Button
                                        onClick={sendReply}
                                        disabled={(!replyMessage.trim() && attachments.length === 0) || isSending}
                                        className="px-6 bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {isSending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-200 flex items-center justify-center">
                                    <MessageCircle className="w-10 h-10 text-zinc-400" />
                                </div>
                                <h3 className="text-lg font-medium text-zinc-900 mb-1">Geen ticket geselecteerd</h3>
                                <p className="text-zinc-500">Selecteer een ticket om het gesprek te bekijken</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
