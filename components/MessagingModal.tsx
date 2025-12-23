
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Search, User } from 'lucide-react';
import { Message, UserProfile } from '../types';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string; // The authUid
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

  // --- SECURITY LAYER: Strict Filtering ---
  // We ensure that only messages where the currentUser is the sender OR receiver are processed.
  // This is a fail-safe against any data pollution in the parent state.
  const myStrictMessages = useMemo(() => {
    if (!currentUser || currentUser === 'guest') return [];
    return messages.filter(m => m.senderId === currentUser || m.receiverId === currentUser);
  }, [messages, currentUser]);

  // --- derived state: Group messages into conversations ---
  const conversationsMap = useMemo(() => {
    const map = new Map<string, Conversation>();
    myStrictMessages.forEach(msg => {
      const isSender = msg.senderId === currentUser;
      const partnerId = isSender ? msg.receiverId : msg.senderId;
      const partnerName = isSender ? msg.receiverName : msg.senderName;

      const existing = map.get(partnerId);
      
      if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
        map.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + (!isSender && !msg.isRead ? 1 : 0)
        });
      } else if (!isSender && !msg.isRead) {
          if (existing) {
              existing.unreadCount += 1;
          }
      }
    });
    return map;
  }, [myStrictMessages, currentUser]);

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
    if (!activeConversationId || !currentUser) return [];
    return myStrictMessages.filter(m => 
      (m.senderId === currentUser && m.receiverId === activeConversationId) ||
      (m.senderId === activeConversationId && m.receiverId === currentUser)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [myStrictMessages, currentUser, activeConversationId]);

  // --- Effects ---
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

  useEffect(() => {
    if (isOpen && activeConversationId && activeMessages.length > 0) {
        activeMessages.forEach(msg => {
            if (msg.receiverId === currentUser && !msg.isRead) {
                onMarkAsRead(msg.id);
            }
        });
    }
  }, [isOpen, activeConversationId, activeMessages, currentUser, onMarkAsRead]);

  useEffect(() => {
    if (isOpen && activeMessages.length > 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, isOpen]);

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversationId) return;

    let receiverName = '';
    const conv = conversationsMap.get(activeConversationId);
    if (conv) {
        receiverName = conv.partnerName;
    } else if (recipientProfile && recipientProfile.id === activeConversationId) {
        receiverName = recipientProfile.name;
    }

    let subject = "Chat";
    if (activeMessages.length === 0 && initialSubject) {
        subject = initialSubject;
    } else if (activeMessages.length > 0) {
        subject = activeMessages[activeMessages.length - 1].subject; 
    }

    onSendMessage(activeConversationId, receiverName, subject, newMessage);
    setNewMessage('');
  };

  if (!isOpen) return null;

  const activePartnerName = conversationsMap.get(activeConversationId!)?.partnerName || recipientProfile?.name || 'צ\'אט';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" aria-labelledby="messaging-modal" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row z-50">
            <div className={`w-full sm:w-1/3 border-l border-slate-200 bg-white flex flex-col ${activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-slate-800 text-lg">הודעות</h2>
                    <button onClick={onClose} className="sm:hidden p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
                </div>
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
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredConversations.length === 0 && !recipientProfile ? (
                        <div className="text-center p-8 text-slate-500"><p>אין שיחות פעילות</p></div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div key={conv.partnerId} onClick={() => setActiveConversationId(conv.partnerId)} className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${activeConversationId === conv.partnerId ? 'bg-brand-50 border-r-4 border-r-brand-500' : ''}`}>
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">{conv.partnerName[0]}</div>
                                    {conv.unreadCount > 0 && <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{conv.unreadCount}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-slate-900 truncate">{conv.partnerName}</h3>
                                    </div>
                                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{conv.lastMessage.senderId === currentUser ? 'אני: ' : ''}{conv.lastMessage.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className={`flex-1 flex flex-col bg-slate-100 relative ${!activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                {activeConversationId ? (
                    <>
                        <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center shadow-sm z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveConversationId(null)} className="sm:hidden p-1 text-slate-600 hover:bg-slate-200 rounded-full"><X className="w-6 h-6" /></button>
                                <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold">{activePartnerName[0]}</div>
                                <div><h3 className="font-bold text-slate-900">{activePartnerName}</h3><span className="text-xs text-slate-500">מחובר</span></div>
                            </div>
                            <button onClick={onClose} className="hidden sm:flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {activeMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center bg-white p-6 rounded-xl mx-auto max-w-sm mt-10 shadow-sm">
                                    <div className="bg-brand-100 p-4 rounded-full mb-3"><Send className="w-8 h-8 text-brand-600" /></div>
                                    <p className="font-medium">התחל שיחה עם {activePartnerName}</p>
                                </div>
                            ) : (
                                activeMessages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm text-sm ${msg.senderId === currentUser ? 'bg-brand-500 text-white rounded-tl-2xl rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none rounded-tr-2xl border border-slate-100'}`}>
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="bg-white p-3 flex items-center gap-2 border-t border-slate-200 shrink-0">
                            <input 
                                type="text"
                                className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 rounded-full py-3 px-5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-slate-400"
                                placeholder="הקלד הודעה..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button onClick={handleSend} disabled={!newMessage.trim()} className="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-full shadow-sm disabled:opacity-50 transition-all active:scale-95"><Send className="w-5 h-5" /></button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-100 border-b-8 border-brand-600 relative">
                        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full shadow-sm"><X className="w-6 h-6" /></button>
                        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6"><User className="w-12 h-12 text-slate-400" /></div>
                        <h2 className="text-2xl font-light text-slate-600 mb-2">Barter Web</h2>
                        <p className="text-sm">בחר שיחה מהרשימה כדי להתחיל להתכתב</p>
                    </div>
                )}
            </div>
      </div>
    </div>
  );
};
