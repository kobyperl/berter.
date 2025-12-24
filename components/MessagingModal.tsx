
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Search, User } from 'lucide-react';
import { Message, UserProfile } from '../types';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string; // authUid
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
  
  const processingReadIds = useRef<Set<string>>(new Set());

  // --- Group messages into personal conversations only ---
  const conversationsMap = useMemo(() => {
    const map = new Map<string, Conversation>();
    
    // סינון הודעות ששייכות למשתמש הנוכחי בלבד (גם אם הוא מנהל)
    // זה מוודא שאף משתמש לא רואה רשימת שיחות של אחרים
    const personalMessages = messages.filter(m => m && (m.senderId === currentUser || m.receiverId === currentUser));

    personalMessages.forEach(msg => {
      const isMeSender = msg.senderId === currentUser;
      const partnerId = isMeSender ? msg.receiverId : msg.senderId;
      
      if (!partnerId) return;

      const partnerName = isMeSender ? (msg.receiverName || 'משתמש') : (msg.senderName || 'משתמש');
      const existing = map.get(partnerId);
      
      const shouldCountAsUnread = !isMeSender && !msg.isRead && partnerId !== activeConversationId;

      const msgTime = new Date(msg.timestamp).getTime();
      const existingTime = existing ? new Date(existing.lastMessage.timestamp).getTime() : 0;

      if (!existing || msgTime > existingTime) {
        map.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + (shouldCountAsUnread ? 1 : 0)
        });
      } else if (shouldCountAsUnread) {
          if (existing) {
              existing.unreadCount += 1;
          }
      }
    });
    return map;
  }, [messages, currentUser, activeConversationId]);

  const conversations = useMemo(() => {
    // Explicitly casting the sort callback parameters to 'Conversation' to avoid 'unknown' type errors
    return Array.from(conversationsMap.values())
      .sort((a: Conversation, b: Conversation) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
  }, [conversationsMap]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => 
      (c.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.lastMessage.content || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    // וידוא שהודעות בתוך הצ'אט הפעיל הן אכן שלנו ושל השותף הנבחר
    return messages.filter(m => m && (
      (m.senderId === currentUser && m.receiverId === activeConversationId) ||
      (m.senderId === activeConversationId && m.receiverId === currentUser)
    )).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUser, activeConversationId]);

  useEffect(() => {
    if (isOpen) {
        if (recipientProfile) {
            setActiveConversationId(recipientProfile.id);
        }
        setSearchTerm('');
    }
  }, [isOpen, recipientProfile]);

  useEffect(() => {
    if (isOpen && activeConversationId) {
        const unreadForActive = activeMessages.filter(m => 
            m.receiverId === currentUser && 
            !m.isRead && 
            !processingReadIds.current.has(m.id)
        );

        if (unreadForActive.length > 0) {
            unreadForActive.forEach(msg => {
                processingReadIds.current.add(msg.id);
                onMarkAsRead(msg.id);
            });
        }
    }
  }, [isOpen, activeConversationId, activeMessages, currentUser, onMarkAsRead]);

  useEffect(() => {
      if (!isOpen) processingReadIds.current.clear();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeConversationId) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages.length, isOpen, activeConversationId]);

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversationId) return;

    let receiverName = '';
    const conv = conversationsMap.get(activeConversationId);
    if (conv) receiverName = conv.partnerName;
    else if (recipientProfile && recipientProfile.id === activeConversationId) receiverName = recipientProfile.name;

    let subject = "צ'אט";
    if (activeMessages.length === 0 && initialSubject) {
        subject = initialSubject;
    } else if (activeMessages.length > 0) {
        subject = activeMessages[activeMessages.length - 1].subject || "המשך שיחה"; 
    }

    onSendMessage(activeConversationId, receiverName || 'משתמש', subject, newMessage);
    setNewMessage('');
  };

  if (!isOpen) return null;

  const activePartnerName = conversationsMap.get(activeConversationId!)?.partnerName || recipientProfile?.name || 'צ\'אט';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row z-50 text-right" dir="rtl">
            <div className={`w-full sm:w-1/3 border-l border-slate-200 bg-white flex flex-col ${activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-slate-800 text-lg">תיבת הודעות</h2>
                    <button onClick={onClose} className="sm:hidden p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-3 border-b border-slate-100 shrink-0">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pr-10 pl-4 text-sm focus:border-brand-500 focus:bg-white outline-none transition-all"
                            placeholder="חפש שיחה..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredConversations.length === 0 && !recipientProfile ? (
                        <div className="text-center p-8 text-slate-400 text-sm italic">אין לך שיחות פעילות כרגע</div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div 
                                key={conv.partnerId}
                                onClick={() => setActiveConversationId(conv.partnerId)}
                                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${activeConversationId === conv.partnerId ? 'bg-brand-50 border-r-4 border-r-brand-500' : ''}`}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">{conv.partnerName[0]}</div>
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-slate-900 truncate text-sm">{conv.partnerName}</h3>
                                    </div>
                                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                        {conv.lastMessage.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className={`flex-1 flex flex-col bg-slate-100 relative ${!activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                {activeConversationId ? (
                    <>
                        <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center shadow-sm z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveConversationId(null)} className="sm:hidden p-1 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                                <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold">{activePartnerName[0]}</div>
                                <div><h3 className="font-bold text-slate-900 text-sm">{activePartnerName}</h3></div>
                            </div>
                            <button onClick={onClose} className="hidden sm:block text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {activeMessages.map((msg) => {
                                const isMe = msg.senderId === currentUser;
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm text-sm ${isMe ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'}`}>
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            <div className={`text-[9px] mt-1 ${isMe ? 'text-brand-100 text-right' : 'text-slate-400 text-left'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="bg-white p-3 flex items-center gap-2 border-t border-slate-200 shrink-0">
                            <input 
                                type="text"
                                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-full py-2.5 px-5 outline-none focus:border-brand-500 focus:bg-white transition-all text-sm"
                                placeholder="הקלד הודעה..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button onClick={handleSend} disabled={!newMessage.trim()} className="bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-full shadow-sm disabled:opacity-50 transition-all active:scale-95"><Send className="w-5 h-5 mirror-rtl" /></button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 p-6 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><User className="w-10 h-10 text-slate-300" /></div>
                        <h2 className="text-xl font-bold text-slate-600 mb-1">Barter.org.il</h2>
                        <p className="text-sm">בחר שיחה מהרשימה כדי להתחיל להתכתב</p>
                    </div>
                )}
            </div>
      </div>
    </div>
  );
};
