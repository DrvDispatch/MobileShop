"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { MessageCircle, X, Send, Loader2, ChevronRight, User, Headphones, Check, CheckCheck, Paperclip, Image as ImageIcon, FileText, Smile } from "lucide-react";
import { useTenantOptional } from "@/lib/TenantProvider";

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
    subject: string;
    status: string;
    messages: Message[];
    updatedAt: string;
}

const CATEGORIES = [
    { id: "REPAIR_QUESTION", label: "Reparatie vraag", icon: "🔧", color: "from-orange-500 to-amber-500" },
    { id: "ORDER_QUESTION", label: "Bestelling vraag", icon: "📦", color: "from-blue-500 to-cyan-500" },
    { id: "PRICE_QUOTE", label: "Prijs offerte", icon: "💰", color: "from-emerald-500 to-green-500" },
    { id: "GENERAL", label: "Algemene vraag", icon: "❓", color: "from-violet-500 to-purple-500" },
    { id: "DISPUTE", label: "Geschil", icon: "⚠️", color: "from-red-500 to-rose-500" },
    { id: "REFUND", label: "Terugbetaling", icon: "💸", color: "from-orange-500 to-red-500" },
];

function getSessionId(): string {
    if (typeof window === "undefined") return "";
    let sessionId = localStorage.getItem("chat_session_id");
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("chat_session_id", sessionId);
    }
    return sessionId;
}

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
}

// Format message with basic markdown support (bold, line breaks)
function formatMessage(text: string): React.ReactNode {
    // Split by newlines first to preserve line breaks
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
        // Parse **bold** patterns
        const parts: React.ReactNode[] = [];
        let remaining = line;
        let keyIdx = 0;

        while (remaining.length > 0) {
            const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
            if (boldMatch && boldMatch.index !== undefined) {
                // Add text before the bold
                if (boldMatch.index > 0) {
                    parts.push(<span key={`${lineIdx}-${keyIdx++}`}>{remaining.slice(0, boldMatch.index)}</span>);
                }
                // Add the bold text
                parts.push(<strong key={`${lineIdx}-${keyIdx++}`} className="font-semibold">{boldMatch[1]}</strong>);
                remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
            } else {
                // No more bold patterns, add the rest
                parts.push(<span key={`${lineIdx}-${keyIdx++}`}>{remaining}</span>);
                break;
            }
        }

        // Add line break after each line except the last
        return (
            <span key={lineIdx}>
                {parts}
                {lineIdx < lines.length - 1 && <br />}
            </span>
        );
    });
}

export function ChatWidget() {
    const pathname = usePathname();
    const tenant = useTenantOptional();
    const shopName = tenant?.branding.shopName || 'Klantenservice';
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<"list" | "new" | "chat">("list");
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // New ticket form - prefill from localStorage
    const [name, setName] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("chat_customer_name") || "";
        }
        return "";
    });
    const [email, setEmail] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("chat_customer_email") || "";
        }
        return "";
    });
    const [category, setCategory] = useState("");
    const [orderNumber, setOrderNumber] = useState(""); // For refund requests
    const [message, setMessage] = useState("");

    // Chat input
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sessionId = getSessionId();

    const isAdminPage = pathname?.startsWith("/admin");

    // Upload abort controller
    const uploadAbortRef = useRef<AbortController | null>(null);

    // Handle file upload
    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
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
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.log("Upload cancelled by user");
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

    // Initialize WebSocket
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
            // Update active ticket
            setActiveTicket(prev =>
                prev?.id === data.ticketId
                    ? { ...prev, messages: [...prev.messages, data.message] }
                    : prev
            );
            // Update ticket in list
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

    const loadTickets = async () => {
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
    };

    const createTicket = async () => {
        if (!name || !category || !message) return;
        // Require order number for refund requests
        if (category === "REFUND" && !orderNumber.trim()) {
            alert("Vul een bestelnummer in voor terugbetalingsverzoeken");
            return;
        }

        setIsSending(true);
        try {
            // Build subject and message based on category
            let subject = CATEGORIES.find(c => c.id === category)?.label || "Vraag";
            let finalMessage = message;

            if (category === "REFUND" && orderNumber) {
                subject = `Terugbetalingsverzoek - Order #${orderNumber}`;
                finalMessage = `**Bestelnummer:** ${orderNumber}\n\n${message}`;
            }

            const res = await fetch(`/api/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    customerName: name,
                    customerEmail: email || undefined,
                    category,
                    subject,
                    initialMessage: finalMessage,
                }),
            });

            if (res.ok) {
                const ticket = await res.json();
                // Save name and email for next time
                localStorage.setItem("chat_customer_name", name);
                if (email) localStorage.setItem("chat_customer_email", email);

                setActiveTicket(ticket);
                setView("chat");
                setTickets(prev => [ticket, ...prev]);
                setMessage("");
                setOrderNumber("");
            }
        } catch (err) {
            console.error("Failed to create ticket:", err);
        } finally {
            setIsSending(false);
        }
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && attachments.length === 0) || !activeTicket) return;

        const msgText = newMessage;
        const msgAttachments = [...attachments];
        setNewMessage("");
        setAttachments([]);
        setIsSending(true);

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
                setNewMessage(msgText);
                setAttachments(msgAttachments);
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            setNewMessage(msgText);
            setAttachments(msgAttachments);
        } finally {
            setIsSending(false);
        }
    };

    const openTicket = (ticket: Ticket) => {
        setActiveTicket(ticket);
        setView("chat");
    };

    if (isAdminPage) return null;

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50 ${isOpen
                    ? "bg-zinc-800 scale-90"
                    : "bg-gradient-to-br from-emerald-500 to-green-600 hover:scale-110 hover:shadow-emerald-500/30"
                    }`}
                style={{ boxShadow: isOpen ? undefined : "0 10px 40px rgba(16, 185, 129, 0.4)" }}
            >
                {isOpen ? (
                    <X className="w-7 h-7 text-white" />
                ) : (
                    <>
                        <MessageCircle className="w-7 h-7 text-white" />
                        {tickets.some(t => t.status === "OPEN" || t.status === "IN_PROGRESS") && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </>
                )}
            </button>

            {/* Chat Window - Responsive for all devices */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[80vh] h-[500px] sm:h-[520px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200/50 flex flex-col overflow-hidden z-50"
                    style={{
                        animation: "slideUp 0.3s ease-out",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{shopName}</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-zinc-500"}`} />
                                        {view === "chat" && activeTicket
                                            ? `#${activeTicket.caseId}`
                                            : isConnected ? "Online" : "Verbinden..."}
                                    </div>
                                </div>
                            </div>
                            {view !== "list" && (
                                <button
                                    onClick={() => { setView("list"); setActiveTicket(null); }}
                                    className="text-zinc-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                                >
                                    ← Terug
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-50 to-white">
                        {/* Loading */}
                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        )}

                        {/* Ticket List View */}
                        {!isLoading && view === "list" && (
                            <div className="p-5 space-y-4">
                                <button
                                    onClick={() => setView("new")}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Start Nieuw Gesprek
                                </button>

                                {(() => {
                                    const activeTickets = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS");
                                    const closedTickets = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED");

                                    return (
                                        <>
                                            {activeTickets.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                        Actieve gesprekken
                                                    </p>
                                                    {activeTickets.map(ticket => {
                                                        const lastMsg = ticket.messages[ticket.messages.length - 1];
                                                        const isRefund = ticket.subject.toLowerCase().includes('terugbetaling') || ticket.subject.toLowerCase().includes('refund');
                                                        // Extract order number from subject if it's a refund ticket
                                                        const orderMatch = ticket.subject.match(/#([A-Z0-9-]+)/);
                                                        const orderNumber = orderMatch ? orderMatch[1] : null;

                                                        return (
                                                            <button
                                                                key={ticket.id}
                                                                onClick={() => openTicket(ticket)}
                                                                className={`w-full text-left p-4 bg-white rounded-2xl border-2 hover:shadow-lg transition-all flex items-center gap-3 ${isRefund
                                                                    ? "border-orange-200 hover:border-orange-400"
                                                                    : "border-emerald-200 hover:border-emerald-400"
                                                                    }`}
                                                            >
                                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isRefund
                                                                    ? "bg-orange-500 text-white"
                                                                    : ticket.status === "OPEN"
                                                                        ? "bg-emerald-500 text-white"
                                                                        : "bg-blue-500 text-white"
                                                                    }`}>
                                                                    {isRefund ? (
                                                                        <span className="text-xl">💸</span>
                                                                    ) : (
                                                                        <MessageCircle className="w-6 h-6" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <span className={`font-bold block truncate ${isRefund ? "text-orange-700" : "text-zinc-900"}`}>
                                                                                {isRefund ? "Terugbetaling" : ticket.subject}
                                                                            </span>
                                                                            {isRefund && orderNumber && (
                                                                                <span className="text-xs font-mono bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                                                    #{orderNumber}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className={`text-xs font-medium flex-shrink-0 ${isRefund ? "text-orange-600" : "text-emerald-600"}`}>
                                                                            {ticket.status === "IN_PROGRESS" ? "Beantwoord!" : "Open"}
                                                                        </span>
                                                                    </div>
                                                                    {lastMsg && (
                                                                        <p className="text-sm text-zinc-500 truncate mt-1">
                                                                            {lastMsg.sender === "customer" ? "U: " : "🤖 "}
                                                                            {lastMsg.message.replace(/\*\*/g, '').slice(0, 35)}...
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-zinc-400 mt-1">#{ticket.caseId}</p>
                                                                </div>
                                                                <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isRefund ? "text-orange-400" : "text-emerald-400"}`} />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {closedTickets.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                                                        📁 Afgeronde gesprekken
                                                    </p>
                                                    {closedTickets.map(ticket => (
                                                        <button
                                                            key={ticket.id}
                                                            onClick={() => openTicket(ticket)}
                                                            className="w-full text-left p-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-300 transition-all flex items-center gap-3 opacity-75 hover:opacity-100"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
                                                                <Check className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-sm font-medium text-zinc-700">{ticket.subject}</span>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-xs text-zinc-400">#{ticket.caseId}</span>
                                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">
                                                                        {ticket.status === "RESOLVED" ? "Opgelost" : "Gesloten"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-zinc-300" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* WhatsApp */}
                                <div className="pt-4 border-t border-zinc-100">
                                    <a
                                        href="https://wa.me/32465638106"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-zinc-900">WhatsApp</span>
                                            <p className="text-xs text-zinc-500">Direct chatten via WhatsApp</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* New Ticket Form */}
                        {!isLoading && view === "new" && (
                            <div className="p-5 space-y-5">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-2">Uw naam *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Jan Janssen"
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-2">Email (optioneel)</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="jan@example.be"
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-2">Onderwerp *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCategory(cat.id)}
                                                className={`p-3 rounded-xl border text-left transition-all ${category === cat.id
                                                    ? `border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500`
                                                    : "border-zinc-200 hover:border-zinc-300 bg-white"
                                                    }`}
                                            >
                                                <span className="text-lg">{cat.icon}</span>
                                                <p className="text-xs font-medium text-zinc-700 mt-1">{cat.label}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Number - Only for refund requests */}
                                {category === "REFUND" && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                        <label className="block text-xs font-medium text-orange-800 mb-2">
                                            Bestelnummer *
                                        </label>
                                        <input
                                            type="text"
                                            value={orderNumber}
                                            onChange={(e) => setOrderNumber(e.target.value)}
                                            placeholder="bijv. ORD-20241228-ABCD"
                                            className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none transition-all"
                                        />
                                        <p className="text-xs text-orange-600 mt-2">
                                            Je vindt je bestelnummer in de bevestigingsmail of op je factuur.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-2">
                                        {category === "REFUND" ? "Reden voor terugbetaling *" : "Uw vraag *"}
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={3}
                                        placeholder={category === "REFUND"
                                            ? "Beschrijf waarom u een terugbetaling wenst..."
                                            : "Beschrijf uw vraag..."}
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-all resize-none"
                                    />
                                </div>

                                <button
                                    onClick={createTicket}
                                    disabled={!name || !category || !message || (category === "REFUND" && !orderNumber) || isSending}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            {category === "REFUND" ? "Verzoek indienen" : "Verstuur"}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Chat View */}
                        {!isLoading && view === "chat" && activeTicket && (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                                    {activeTicket.messages.map((msg, idx) => (
                                        <div
                                            key={msg.id}
                                            className={`flex items-end gap-2 ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}
                                        >
                                            {msg.sender !== "customer" && (
                                                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                                    <Headphones className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${msg.sender === "customer"
                                                    ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-br-md"
                                                    : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-md shadow-sm"
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
                                                                <a key={attIdx} href={att.url} target="_blank" rel="noopener noreferrer">
                                                                    <img
                                                                        src={att.url}
                                                                        alt={att.name || 'Attachment'}
                                                                        className="max-w-full rounded-lg border border-white/20 cursor-pointer hover:opacity-90"
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
                                                                        ? "bg-white/10 hover:bg-white/20"
                                                                        : "bg-zinc-50 hover:bg-zinc-100"
                                                                        }`}
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                    <span className="text-xs truncate">{att.name || 'Download file'}</span>
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                <p className="text-sm leading-relaxed">{formatMessage(msg.message)}</p>
                                                <div className={`flex items-center gap-1 mt-1 ${msg.sender === "customer" ? "justify-end" : ""}`}>
                                                    <span className={`text-[10px] ${msg.sender === "customer" ? "text-emerald-100" : "text-zinc-400"}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                    {msg.sender === "customer" && (
                                                        <CheckCheck className="w-3 h-3 text-emerald-100" />
                                                    )}
                                                </div>
                                            </div>
                                            {msg.sender === "customer" && (
                                                <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-3.5 h-3.5 text-zinc-600" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    {view === "chat" && activeTicket && (
                        <div className="p-4 bg-white border-t border-zinc-100">
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
                                                ×
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
                                                ×
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
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
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                                    placeholder="Typ een bericht..."
                                    className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                                    className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl flex items-center justify-center hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
}
