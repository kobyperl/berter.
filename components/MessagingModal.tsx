
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Search, User, ChevronRight } from 'lucide-react';
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
  isOpen, onClose, currentUser, messages, onSendMessage, onMarkAsRead, recipientProfile, initialSubject
}) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationsMap = useMemo(() => {
    const map = new Map<string, Conversation>();
    messages.forEach(msg => {
      const isSender = msg.senderId === currentUser;
      const partnerId = isSender ? msg.receiverId : msg.senderId;
      const partnerName = isSender ? msg.receiverName : msg.senderName;
      const existing = map.get(partnerId);
      if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
        map.set(partnerId, { partnerId, partnerName, lastMessage: msg, unreadCount: (existing?.unreadCount || 0) + (!isSender && !msg.isRead ? 1 : 0) });
      } else if (!isSender && !msg.isRead) { if (existing) existing.unreadCount += 1; }
    });
    return map;
  }, [messages, currentUser]);

  // Added explicit types for sort callback parameters to resolve 'unknown' type error.
  const conversations = useMemo(() => Array.from(conversationsMap.values()).sort((a: Conversation, b: Conversation) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()), [conversationsMap]);
  const filteredConversations = useMemo(() => conversations.filter(c => c.partnerName.toLowerCase().includes(searchTerm.toLowerCase())), [conversations, searchTerm]);
  const activeMessages = useMemo(() => activeConversationId ? messages.filter(m => (m.senderId === currentUser && m.receiverId === activeConversationId) || (m.senderId === activeConversationId && m.receiverId === currentUser)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [], [messages, currentUser, activeConversationId]);

  useEffect(() => { if (isOpen) { setActiveConversationId(recipientProfile?.id || null); setSearchTerm(''); } }, [isOpen, recipientProfile]);
  useEffect(() => { if (isOpen && activeConversationId && activeMessages.length > 0) activeMessages.forEach(msg => { if (msg.receiverId === currentUser && !msg.isRead) onMarkAsRead(msg.id); }); }, [isOpen, activeConversationId, activeMessages, currentUser, onMarkAsRead]);
  useEffect(() => { if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeMessages, isOpen]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversationId) return;
    const partner = conversationsMap.get(activeConversationId) || (recipientProfile?.id === activeConversationId ? recipientProfile : null);
    
    const receiverName = partner 
      ? ('partnerName' in partner ? partner.partnerName : (partner as UserProfile).name) 
      : 'Chat';

    let subject = "Chat";
    if (activeMessages.length === 0 && initialSubject) subject = initialSubject;
    else if (activeMessages.length > 0) subject = activeMessages[activeMessages.length - 1].subject;
    onSendMessage(activeConversationId, receiverName, subject, newMessage);
    setNewMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl h-[92vh] sm:h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row z-50">
            <div className={`w-full sm:w-1/3 border-l border-slate-200 bg-white flex flex-col ${activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h2 className="font-extrabold text-slate-800 text-lg">שיחות</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
                </div>
                <div className="p-3 border-b border-slate-100 shrink-0">
                    <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" className="w-full bg-white border border-slate-200 text-slate-900 rounded-full py-2 pr-9 text-sm focus:bg-white transition-all outline-none" placeholder="חפש שיחה..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    {filteredConversations.length === 0 && !recipientProfile ? <div className="text-center p-8 text-slate-400 text-sm">אין שיחות פעילות</div> : filteredConversations.map(conv => (
                        <div key={conv.partnerId} onClick={() => setActiveConversationId(conv.partnerId)} className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${activeConversationId === conv.partnerId ? 'bg-brand-50 border-r-4 border-r-brand-500' : ''}`}>
                            <div className="relative shrink-0"><div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">{conv.partnerName[0]}</div>{conv.unreadCount > 0 && <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{conv.unreadCount}</div>}</div>
                            <div className="flex-1 min-w-0"><div className="flex justify-between items-baseline mb-1"><h3 className="font-bold text-slate-900 truncate text-sm">{conv.partnerName}</h3></div><p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{conv.lastMessage.content}</p></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={`flex-1 flex flex-col bg-white border-r border-slate-200 relative ${!activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                {activeConversationId ? (
                    <>
                        <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center shrink-0 z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveConversationId(null)} className="sm:hidden p-1 text-slate-400"><ChevronRight className="w-6 h-6" /></button>
                                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">{conversationsMap.get(activeConversationId)?.partnerName?.[0] || recipientProfile?.name?.[0]}</div>
                                <div><h3 className="font-bold text-slate-900 text-sm">{conversationsMap.get(activeConversationId)?.partnerName || recipientProfile?.name}</h3><span className="text-[10px] text-green-600 font-bold uppercase">מחובר</span></div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white">
                            {activeMessages.map((msg, idx) => {
                                const isMe = msg.senderId === currentUser;
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm text-sm ${isMe ? 'bg-brand-600 text-white rounded-tl-2xl rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none rounded-tr-2xl border border-slate-200'}`}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            <div className={`text-[9px] mt-1 flex items-center gap-1 ${isMe ? 'justify-end text-brand-100' : 'text-slate-400'}`}>{new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} {isMe && (msg.isRead ? "✓✓" : "✓")}</div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="bg-white p-3 flex items-center gap-2 border-t border-slate-200 shrink-0">
                            <input type="text" className="flex-1 bg-white border border-slate-300 text-slate-900 rounded-full py-2.5 px-5 focus:bg-white outline-none focus:border-brand-500 transition-all text-sm" placeholder="הקלד הודעה..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
                            <button onClick={handleSend} disabled={!newMessage.trim()} className="bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-full shadow-md disabled:opacity-50 transition-all"><Send className="w-5 h-5" /></button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100"><User className="w-10 h-10" /></div><h2 className="text-xl font-bold text-slate-600 mb-1">ההודעות שלי</h2><p className="text-sm">בחר שיחה מהרשימה כדי להתחיל להתכתב</p></div>
                )}
            </div>
      </div>
    </div>
  );
};