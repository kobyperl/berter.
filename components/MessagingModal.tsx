
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Search, User } from 'lucide-react';
import { Message, UserProfile } from '../types';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  messages: Message[];
  onSendMessage: (receiverId: string, receiverName: string, subject: string, content: string) => void;
  onMarkAsRead: (messageId: string) => void;
  recipientProfile?: UserProfile | null;
  initialSubject?: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: Message;
  unreadCount: number;
}

export const MessagingModal: React.FC<MessagingModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  messages, 
  onSendMessage,
  onMarkAsRead,
  recipientProfile,
  initialSubject
}) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- derived state: Group messages into conversations ---
  const conversationsMap = useMemo(() => {
    const map = new Map<string, Conversation>();
    messages.forEach(msg => {
      const isSender = msg.senderId === currentUser;
      const partnerId = isSender ? msg.receiverId : msg.senderId;
      const partnerName = isSender ? msg.receiverName : msg.senderName;

      const existing = map.get(partnerId);
      
      // Check if this message is newer than what we have
      if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
        map.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + (!isSender && !msg.isRead ? 1 : 0)
        });
      } else if (!isSender && !msg.isRead) {
          // Just update unread count if we found an older message but haven't processed this unread one
          if (existing) {
              existing.unreadCount += 1;
          }
      }
    });
    return map;
  }, [messages, currentUser]);

  const conversations = useMemo(() => {
    return Array.from(conversationsMap.values())
      .sort((a: Conversation, b: Conversation) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
  }, [conversationsMap]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => 
      c.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return messages.filter(m => 
      (m.senderId === currentUser && m.receiverId === activeConversationId) ||
      (m.senderId === activeConversationId && m.receiverId === currentUser)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUser, activeConversationId]);

  // --- Effects ---

  // 1. Initial Setup: Set active conversation when modal opens
  useEffect(() => {
    if (isOpen) {
        if (recipientProfile) {
            setActiveConversationId(recipientProfile.id);
        } else {
            setActiveConversationId(null);
        }
        setSearchTerm('');
    }
  }, [isOpen, recipientProfile]);

  // 2. Mark as read when viewing a conversation
  useEffect(() => {
    if (isOpen && activeConversationId && activeMessages.length > 0) {
        activeMessages.forEach(msg => {
            if (msg.receiverId === currentUser && !msg.isRead) {
                onMarkAsRead(msg.id);
            }
        });
    }
  }, [isOpen, activeConversationId, activeMessages, currentUser, onMarkAsRead]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, isOpen, activeConversationId]);

  // --- Helpers ---
  
  const formatListDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    if (isToday) {
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
  };

  const formatBubbleDate = (dateStr: string) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString('he-IL', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
      });
  };

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversationId) return;

    // Determine receiver name
    let receiverName = '';
    const conv = conversationsMap.get(activeConversationId);
    if (conv) {
        receiverName = conv.partnerName;
    } else if (recipientProfile && recipientProfile.id === activeConversationId) {
        receiverName = recipientProfile.name;
    }

    // Determine Subject
    let subject = "Chat";
    if (activeMessages.length === 0 && initialSubject) {
        subject = initialSubject;
    } else if (activeMessages.length > 0) {
        subject = activeMessages[activeMessages.length - 1].subject; 
    }

    onSendMessage(activeConversationId, receiverName, subject, newMessage);
    setNewMessage('');
  };

  // --- Render ---
  
  if (!isOpen) return null;

  const activePartnerName = conversationsMap.get(activeConversationId!)?.partnerName || recipientProfile?.name || 'Chat';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" aria-labelledby="messaging-modal" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row z-50">
            
            {/* LEFT SIDEBAR: Conversations List */}
            <div className={`w-full sm:w-1/3 border-l border-slate-200 bg-white flex flex-col ${activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-slate-800 text-lg">הודעות</h2>
                    <button 
                        onClick={onClose} 
                        className="sm:hidden p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
                
                {/* Search */}
                <div className="p-3 border-b border-slate-100 shrink-0">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-full py-2.5 pr-10 pl-4 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm"
                            placeholder="חפש שיחה..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredConversations.length === 0 && !recipientProfile ? (
                        <div className="text-center p-8 text-slate-500">
                            <p>אין שיחות פעילות</p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div 
                                key={conv.partnerId}
                                onClick={() => setActiveConversationId(conv.partnerId)}
                                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${activeConversationId === conv.partnerId ? 'bg-brand-50 border-r-4 border-r-brand-500' : ''}`}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                                        {conv.partnerName[0]}
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-slate-900 truncate">{conv.partnerName}</h3>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-1">
                                            {formatListDate(conv.lastMessage.timestamp)}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                        {conv.lastMessage.senderId === currentUser ? 'אני: ' : ''}{conv.lastMessage.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT SIDE: Chat Window */}
            <div className={`flex-1 flex flex-col bg-[#efeae2] relative ${!activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                
                {activeConversationId ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center shadow-sm z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setActiveConversationId(null)}
                                    className="sm:hidden p-1 text-slate-600 hover:bg-slate-200 rounded-full"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold">
                                    {activePartnerName[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{activePartnerName}</h3>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        מחובר
                                    </span>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={onClose} 
                                    className="hidden sm:flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 rounded-full transition-colors"
                                    title="סגור חלונית"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', opacity: 0.95 }}>
                            {activeMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center bg-white/80 p-6 rounded-xl mx-auto max-w-sm mt-10 shadow-sm backdrop-blur-sm">
                                    <div className="bg-brand-100 p-4 rounded-full mb-3">
                                        <Send className="w-8 h-8 text-brand-600" />
                                    </div>
                                    <p className="font-medium">התחל שיחה עם {activePartnerName}</p>
                                    {initialSubject && (
                                        <div className="mt-2 text-sm bg-slate-100 p-2 rounded text-slate-600">
                                            נושא: {initialSubject}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                activeMessages.map((msg, idx) => {
                                    const isMe = msg.senderId === currentUser;
                                    
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            {idx === 0 && msg.subject !== "Chat" && (
                                                 <div className="w-full text-center my-2">
                                                     <span className="bg-slate-200/80 backdrop-blur-sm text-slate-600 text-[10px] px-2 py-1 rounded-full shadow-sm border border-slate-300">
                                                        נושא: {msg.subject}
                                                     </span>
                                                 </div>
                                            )}

                                            <div 
                                                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative text-sm ${
                                                    isMe 
                                                    ? 'bg-[#dcf8c6] text-slate-900 rounded-tl-2xl rounded-tr-none' 
                                                    : 'bg-white text-slate-900 rounded-tl-none rounded-tr-2xl'
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'justify-end text-slate-500' : 'text-slate-400'}`}>
                                                    {formatBubbleDate(msg.timestamp)}
                                                    {isMe && (
                                                        <span>{msg.isRead ? <span className="text-blue-500">✓✓</span> : <span>✓</span>}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-slate-50 p-3 flex items-center gap-2 border-t border-slate-200 shrink-0">
                            <input 
                                type="text"
                                className="flex-1 bg-white border border-slate-300 text-slate-900 rounded-full py-3 px-5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-slate-400 shadow-sm"
                                placeholder="הקלד הודעה..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                autoFocus
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!newMessage.trim()}
                                className="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    /* Empty State for Right Side */
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-100 border-b-8 border-brand-600 relative">
                        <button 
                            onClick={onClose} 
                            className="absolute top-4 left-4 p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full shadow-sm transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                            <User className="w-12 h-12 text-slate-400" />
                        </div>
                        <h2 className="text-2xl font-light text-slate-600 mb-2">Barter Web</h2>
                        <p className="text-sm">בחר שיחה מהרשימה כדי להתחיל להתכתב</p>
                    </div>
                )}
            </div>
      </div>
    </div>
  );
};
