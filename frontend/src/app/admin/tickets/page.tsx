"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft, MessageCircle, Clock, CheckCircle, XCircle, Loader2, RefreshCw,
    Send, User, Headphones, Circle, Search, Trash2, FileText, Paperclip, X
} from "lucide-react";
import {
    useTicketsAdmin, TICKET_STATUS_CONFIG, CATEGORY_LABELS, formatRelativeTime, type Ticket, type Message, type Attachment
} from "@/lib/admin/tickets/useTicketsAdmin";

export default function AdminTicketsPage() {
    const {
        filteredTickets, selectedTicket, isConnected, isLoading,
        filterStatus, setFilterStatus, searchQuery, setSearchQuery,
        selectedTicketId, setSelectedTicketId,
        replyMessage, setReplyMessage, isSending, sendReply,
        attachments, isUploading, handleFileUpload, cancelUpload, removeAttachment, fileInputRef,
        refresh, updateStatus, deleteTicket, openCount, messagesEndRef,
    } = useTicketsAdmin();

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
                                    <MessageCircle className="w-6 h-6" />Support Tickets
                                </h1>
                                <p className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Circle className={`w-2 h-2 ${isConnected ? "fill-emerald-500 text-emerald-500" : "fill-red-500 text-red-500"}`} />
                                    {isConnected ? "Live verbonden" : "Niet verbonden"}
                                    {openCount > 0 && <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">{openCount} open</span>}
                                </p>
                            </div>
                        </div>
                        <Button onClick={refresh} variant="outline" size="sm" className="text-zinc-900 border-white/20 hover:bg-white/10">
                            <RefreshCw className="w-4 h-4 mr-2" />Vernieuwen
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Ticket List Sidebar */}
                <div className="w-[380px] bg-white border-r border-zinc-200 flex flex-col">
                    <div className="p-4 border-b border-zinc-100 space-y-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Zoeken..."
                                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                            <button onClick={() => setFilterStatus("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>Alle</button>
                            {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => (
                                <button key={key} onClick={() => setFilterStatus(key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === key ? `${config.color} text-white` : `${config.bgLight} ${config.textColor} hover:opacity-80`}`}>
                                    {config.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>}
                        {!isLoading && filteredTickets.map(ticket => (
                            <TicketListItem key={ticket.id} ticket={ticket} isSelected={selectedTicketId === ticket.id} onClick={() => setSelectedTicketId(ticket.id)} />
                        ))}
                        {!isLoading && filteredTickets.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                                <MessageCircle className="w-12 h-12 mb-3 opacity-50" /><p>Geen tickets gevonden</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-zinc-50">
                    {selectedTicket ? (
                        <>
                            <ChatHeader ticket={selectedTicket} onUpdateStatus={updateStatus} onDelete={deleteTicket} />
                            <MessagesArea messages={selectedTicket.messages} messagesEndRef={messagesEndRef} />
                            <ReplyInput
                                replyMessage={replyMessage} setReplyMessage={setReplyMessage}
                                attachments={attachments} isUploading={isUploading} isSending={isSending}
                                onSend={sendReply} onFileUpload={handleFileUpload}
                                onRemoveAttachment={removeAttachment} onCancelUpload={cancelUpload}
                                fileInputRef={fileInputRef}
                            />
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

function TicketListItem({ ticket, isSelected, onClick }: { ticket: Ticket; isSelected: boolean; onClick: () => void }) {
    const config = TICKET_STATUS_CONFIG[ticket.status];
    return (
        <button onClick={onClick} className={`w-full text-left p-4 border-b border-zinc-100 transition-colors hover:bg-zinc-50 ${isSelected ? "bg-emerald-50 border-l-4 border-l-emerald-500" : ""}`}>
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${ticket.status === "OPEN" ? "bg-emerald-500" : ticket.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-zinc-400"}`}>
                    {ticket.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-zinc-900 truncate">{ticket.customerName}</span>
                        <span className="text-xs text-zinc-500">{formatRelativeTime(ticket.updatedAt)}</span>
                    </div>
                    <p className="text-sm text-zinc-600 truncate mb-1">{ticket.subject}</p>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgLight} ${config.textColor}`}>{config.label}</span>
                        <span className="text-xs text-zinc-400">#{ticket.caseId}</span>
                    </div>
                </div>
            </div>
        </button>
    );
}

function ChatHeader({ ticket, onUpdateStatus, onDelete }: { ticket: Ticket; onUpdateStatus: (id: string, status: string) => void; onDelete: (id: string) => void }) {
    const config = TICKET_STATUS_CONFIG[ticket.status];
    return (
        <div className="bg-white border-b border-zinc-200 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${ticket.status === "OPEN" ? "bg-emerald-500" : ticket.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-zinc-400"}`}>
                        {ticket.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-bold text-zinc-900">{ticket.customerName}</h2>
                        <p className="text-sm text-zinc-500">{CATEGORY_LABELS[ticket.category]} • #{ticket.caseId}{ticket.customerEmail && ` • ${ticket.customerEmail}`}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {(ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") && (
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => onUpdateStatus(ticket.id, "RESOLVED")}>
                            <CheckCircle className="w-4 h-4 mr-1" />Oplossen
                        </Button>
                    )}
                    {(ticket.status !== "CLOSED") && (
                        <Button size="sm" variant="outline" onClick={() => onUpdateStatus(ticket.id, "CLOSED")}>
                            <XCircle className="w-4 h-4 mr-1" />Sluiten
                        </Button>
                    )}
                    {ticket.status === "CLOSED" && (
                        <>
                            <Button size="sm" variant="outline" onClick={() => onUpdateStatus(ticket.id, "OPEN")}>
                                <RefreshCw className="w-4 h-4 mr-1" />Heropenen
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onDelete(ticket.id)}>
                                <Trash2 className="w-4 h-4 mr-1" />Verwijderen
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function MessagesArea({ messages, messagesEndRef }: { messages: Message[]; messagesEndRef: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}

function MessageBubble({ message: msg }: { message: Message }) {
    const isCustomer = msg.sender === "customer";
    return (
        <div className={`flex items-end gap-2 ${isCustomer ? "justify-start" : "justify-end"}`}>
            {isCustomer && <div className="w-8 h-8 rounded-full bg-zinc-300 flex items-center justify-center text-zinc-600"><User className="w-4 h-4" /></div>}
            <div className={`max-w-[60%] px-4 py-3 rounded-2xl ${isCustomer ? "bg-white border border-zinc-200 rounded-bl-md" : "bg-emerald-600 text-white rounded-br-md"}`}>
                {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                        {msg.attachments.map((att: Attachment, idx: number) => {
                            const isImage = att.type === "image" || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(att.url || '');
                            return isImage ? (
                                <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img src={att.url} alt={att.name || 'Attachment'} className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 border border-zinc-200" />
                                </a>
                            ) : (
                                <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-lg ${isCustomer ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-700" : "bg-white/10 hover:bg-white/20"}`}>
                                    <FileText className="w-4 h-4 flex-shrink-0" /><span className="text-xs truncate">{att.name || 'Download file'}</span>
                                </a>
                            );
                        })}
                    </div>
                )}
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <p className={`text-xs mt-1 ${isCustomer ? "text-zinc-400" : "text-emerald-200"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
            {!isCustomer && <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white"><Headphones className="w-4 h-4" /></div>}
        </div>
    );
}

function ReplyInput({ replyMessage, setReplyMessage, attachments, isUploading, isSending, onSend, onFileUpload, onRemoveAttachment, onCancelUpload, fileInputRef }: {
    replyMessage: string; setReplyMessage: (s: string) => void;
    attachments: Attachment[]; isUploading: boolean; isSending: boolean;
    onSend: () => void; onFileUpload: (files: FileList | null) => void;
    onRemoveAttachment: (i: number) => void; onCancelUpload: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
    return (
        <div className="bg-white border-t border-zinc-200 p-4">
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => onFileUpload(e.target.files)} />
            {attachments.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="relative group">
                            {att.type === "image" ? (
                                <img src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded-lg border border-zinc-200" />
                            ) : (
                                <div className="w-16 h-16 bg-zinc-100 rounded-lg border border-zinc-200 flex flex-col items-center justify-center">
                                    <FileText className="w-6 h-6 text-zinc-500" /><span className="text-[8px] text-zinc-500 mt-1 truncate max-w-14">{att.name}</span>
                                </div>
                            )}
                            <button onClick={() => onRemoveAttachment(idx)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {isUploading && (
                        <div className="relative w-16 h-16 bg-zinc-100 rounded-lg border border-zinc-200 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                            <button onClick={onCancelUpload} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"><X className="w-3 h-3" /></button>
                        </div>
                    )}
                </div>
            )}
            <div className="flex gap-3">
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="w-12 h-12 bg-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center hover:bg-zinc-200 disabled:opacity-50 transition-all">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <input type="text" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()} placeholder="Typ uw antwoord..."
                    className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                <Button onClick={onSend} disabled={(!replyMessage.trim() && attachments.length === 0) || isSending} className="px-6 bg-emerald-600 hover:bg-emerald-700">
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
            </div>
        </div>
    );
}
