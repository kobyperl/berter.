
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

  // יצירת רשימת שיחות מבוססת על הודעות שמתקבלות מהשרת
  const conversationsMap = useMemo(() => {
    const map = new Map<string, Conversation>();
    if (!currentUser || currentUser === 'guest') return map;

    messages.forEach(msg => {
      const isSender = msg.senderId === currentUser;
      const partnerId = isSender ? msg.receiverId : msg.senderId;
      const partnerName = isSender ? msg.receiverName : msg.senderName;

      const existing = map.get(partnerId);
      
      // אם השיחה לא קיימת או שההודעה הנוכחית חדשה יותר מהקודמת
      if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
        map.set(partnerId, {
          partnerId,
          partnerName,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + (!isSender && !msg.isRead ? 1 : 0)
        });
      } else if (!isSender && !msg.isRead) {
          // רק לעדכן מונה אם זה לא האחרון
          if (existing) existing.unreadCount += 1;
      }
    });
    return map;
  }, [messages, currentUser]);

  const sortedConversations = useMemo(() => {
    // Adding explicit types to sort parameters to fix 'unknown' type inference error
    return Array.from(conversationsMap.values())
      .sort((a: Conversation, b: Conversation) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
  }, [conversationsMap]);

  const filteredConversations = useMemo(() => {
    return sortedConversations.filter(c => 
      c.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedConversations, searchTerm]);

  // הודעות בשיחה הפעילה
  const activeMessages = useMemo(() => {
    if (!activeConversationId || !currentUser) return [];
    return messages.filter(m => 
      (m.senderId === currentUser && m.receiverId === activeConversationId) ||
      (m.senderId === activeConversationId && m.receiverId === currentUser)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUser, activeConversationId]);

  // פתיחת שיחה לפי פרופיל שנבחר מחוץ למודל
  useEffect(() => {
    if (isOpen && recipientProfile) {
        setActiveConversationId(recipientProfile.id);
        setSearchTerm('');
    }
  }, [isOpen, recipientProfile]);

  // סימון הודעות כנקראו בתוך השיחה הפעילה
  useEffect(() => {
    if (isOpen && activeConversationId && activeMessages.length > 0) {
        activeMessages.forEach(msg => {
            if (msg.receiverId === currentUser && !msg.isRead) {
                onMarkAsRead(msg.id);
            }
        });
    }
  }, [isOpen, activeConversationId, activeMessages, currentUser, onMarkAsRead]);

  // גלילה אוטומטית לסוף
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

    let subject = "צ'אט ברטר";
    if (activeMessages.length === 0 && initialSubject) {
        subject = initialSubject;
    } else if (activeMessages.length > 0) {
        subject = activeMessages[activeMessages.length - 1].subject; 
    }

    onSendMessage(activeConversationId, receiverName, subject, newMessage);
    setNewMessage('');
  };

  if (!isOpen) return null;

  const activePartnerName = conversationsMap.get(activeConversationId!)?.partnerName || recipientProfile?.name || 'שיחה';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-5xl h-[90vh] sm:h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row z-50">
            {/* רשימת שיחות */}
            <div className={`w-full sm:w-1/3 border-l border-slate-200 bg-white flex flex-col ${activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 text-lg">הודעות</h2>
                    <button onClick={onClose} className="sm:hidden p-1 text-slate-400"><X /></button>
                </div>
                <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="חפש שיחה..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredConversations.length === 0 && !recipientProfile ? (
                        <div className="text-center p-8 text-slate-400 text-sm italic">אין הודעות עדיין</div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div key={conv.partnerId} onClick={() => setActiveConversationId(conv.partnerId)} className={`flex items-center gap-3 p-4 cursor-pointer border-b border-slate-50 transition-colors ${activeConversationId === conv.partnerId ? 'bg-brand-50 border-r-4 border-brand-500' : 'hover:bg-slate-50'}`}>
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">{conv.partnerName[0]}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-slate-900 truncate text-sm">{conv.partnerName}</h3>
                                        {conv.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">{conv.unreadCount}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{conv.lastMessage.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* תוכן השיחה */}
            <div className={`flex-1 flex flex-col bg-slate-100 ${!activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                {activeConversationId ? (
                    <>
                        <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveConversationId(null)} className="sm:hidden text-slate-500"><X /></button>
                                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">{activePartnerName[0]}</div>
                                <div><h3 className="font-bold text-slate-800 text-sm">{activePartnerName}</h3><span className="text-[10px] text-green-600 font-bold">פעיל/ה כעת</span></div>
                            </div>
                            <button onClick={onClose} className="hidden sm:block text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {activeMessages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.senderId === currentUser ? 'bg-brand-600 text-white rounded-tl-none' : 'bg-white text-slate-800 rounded-tr-none border border-slate-200'}`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                                        {new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="bg-white p-3 border-t border-slate-200 flex items-center gap-2">
                            <input 
                                type="text"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-full py-2.5 px-5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                                placeholder="הקלד הודעה..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button onClick={handleSend} disabled={!newMessage.trim()} className="bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-full transition-all active:scale-95 disabled:opacity-50 shadow-sm"><Send className="w-5 h-5" /></button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-white p-6 rounded-full mb-4 shadow-sm border border-slate-100"><User className="w-12 h-12" /></div>
                        <p className="font-bold text-slate-600">בחר שיחה מהרשימה כדי להתחיל להתכתב</p>
                    </div>
                )}
            </div>
      </div>
    </div>
  );
};
