
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Search, User, Loader2, Mail, Info } from 'lucide-react';
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

  // יצירת מפת שיחות ייחודית לפי מזהה שותף
  const conversationsMap = useMemo(() => {
    const map: Record<string, Conversation> = {};
    if (!currentUser || currentUser === 'guest') return map;

    messages.forEach(msg => {
      const isSender = msg.senderId === currentUser;
      const partnerId = String(isSender ? msg.receiverId : msg.senderId).trim();
      
      // סינון מזהים לא תקינים
      if (!partnerId || partnerId === 'undefined' || partnerId === 'guest') return;

      const partnerName = isSender ? msg.receiverName : msg.senderName;
      const existing = map[partnerId];

      if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
          map[partnerId] = {
              partnerId,
              partnerName: partnerName || 'משתמש',
              lastMessage: msg,
              unreadCount: (existing?.unreadCount || 0) + (!isSender && !msg.isRead ? 1 : 0)
          };
      } else if (!isSender && !msg.isRead) {
          map[partnerId].unreadCount += 1;
      }
    });
    return map;
  }, [messages, currentUser]);

  const sortedConversations = useMemo<Conversation[]>(() => {
    // Explicitly cast Object.values(conversationsMap) to Conversation[] to fix 'unknown' type error on 'lastMessage' property access
    return (Object.values(conversationsMap) as Conversation[]).sort((a, b) => 
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
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

  // פתיחה אוטומטית של שיחה
  useEffect(() => {
    if (isOpen && recipientProfile?.id) {
        const safeId = String(recipientProfile.id).trim();
        if (safeId !== 'guest' && safeId !== 'undefined') {
            setActiveConversationId(safeId);
            setSearchTerm('');
        }
    }
  }, [isOpen, recipientProfile]);

  // סימון כנקרא
  useEffect(() => {
    if (isOpen && activeConversationId && activeMessages.length > 0) {
        activeMessages.forEach(msg => {
            if (msg.receiverId === currentUser && !msg.isRead) {
                onMarkAsRead(msg.id);
            }
        });
    }
  }, [isOpen, activeConversationId, activeMessages, currentUser, onMarkAsRead]);

  // גלילה
  useEffect(() => {
    if (isOpen && activeMessages.length > 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, isOpen]);

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversationId) return;

    let partnerName = 'משתמש';
    const conv = conversationsMap[activeConversationId];
    if (conv) partnerName = conv.partnerName;
    else if (recipientProfile && String(recipientProfile.id).trim() === activeConversationId) partnerName = recipientProfile.name;

    let subject = initialSubject || "צ'אט ברטר";
    if (activeMessages.length > 0) subject = activeMessages[activeMessages.length - 1].subject;

    onSendMessage(activeConversationId, partnerName, subject, newMessage);
    setNewMessage('');
  };

  if (!isOpen) return null;

  const activePartnerName = conversationsMap[activeConversationId!]?.partnerName || recipientProfile?.name || 'שיחה';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl h-[90vh] sm:h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row z-50 animate-in fade-in zoom-in-95 duration-200">
            {/* Sidebar */}
            <div className={`w-full sm:w-1/3 border-l border-slate-200 bg-white flex flex-col ${activeConversationId && activeMessages.length > 0 ? 'hidden sm:flex' : 'flex'}`}>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center"><h2 className="font-bold text-slate-800 text-lg">הודעות</h2><button onClick={onClose} className="sm:hidden p-1 text-slate-400 hover:text-slate-600"><X /></button></div>
                <div className="p-3 border-b border-slate-100"><div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-brand-500 shadow-inner" placeholder="חפש שיחה..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredConversations.length === 0 && !recipientProfile ? (
                        <div className="text-center p-12 text-slate-400 text-sm italic flex flex-col items-center gap-3"><Mail className="w-10 h-10 opacity-10" />אין הודעות עדיין</div>
                    ) : (
                        <>
                            {recipientProfile && recipientProfile.id && String(recipientProfile.id).trim() !== 'guest' && !conversationsMap[String(recipientProfile.id).trim()] && (
                                <div onClick={() => setActiveConversationId(String(recipientProfile.id).trim())} className={`flex items-center gap-3 p-4 cursor-pointer border-b border-brand-100 bg-brand-50 transition-colors border-r-4 border-brand-500`}>
                                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold shrink-0 shadow-sm">{recipientProfile.name[0]}</div>
                                    <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h3 className="font-bold text-slate-900 truncate text-sm">{recipientProfile.name}</h3><span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">חדש</span></div><p className="text-xs text-brand-600 truncate font-medium">התחל שיחה עכשיו...</p></div>
                                </div>
                            )}
                            {filteredConversations.map(conv => (
                                <div key={conv.partnerId} onClick={() => setActiveConversationId(conv.partnerId)} className={`flex items-center gap-3 p-4 cursor-pointer border-b border-slate-50 transition-colors ${activeConversationId === conv.partnerId ? 'bg-brand-50 border-r-4 border-brand-500 shadow-sm z-10' : 'hover:bg-slate-50'}`}>
                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0 shadow-inner">{conv.partnerName[0]}</div>
                                    <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h3 className="font-bold text-slate-900 truncate text-sm">{conv.partnerName}</h3>{conv.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-bounce">{conv.unreadCount}</span>}</div><p className="text-xs text-slate-500 truncate">{conv.lastMessage.content}</p></div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Chat Body */}
            <div className={`flex-1 flex flex-col bg-slate-100 ${!activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                {activeConversationId ? (
                    <>
                        <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center shrink-0 z-20 shadow-sm"><div className="flex items-center gap-3"><button onClick={() => setActiveConversationId(null)} className="sm:hidden text-slate-500 p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button><div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold shadow-inner">{activePartnerName[0]}</div><div><h3 className="font-bold text-slate-800 text-sm leading-tight">{activePartnerName}</h3><span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>מחובר/ת</span></div></div><button onClick={onClose} className="hidden sm:block text-slate-400 hover:text-slate-600 p-2"><X className="w-5 h-5" /></button></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50 shadow-inner">
                            {activeMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4"><div className="bg-white p-6 rounded-full shadow-sm border border-slate-100"><Mail className="w-12 h-12 text-brand-200" /></div><div><p className="font-bold text-slate-700 text-lg">זוהי תחילת ההתכתבות</p><p className="text-sm text-slate-400 max-w-[200px] mx-auto">כתוב הודעה כדי להציע ברטר או לשאול שאלה.</p></div></div>
                            ) : (
                                activeMessages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.senderId === currentUser ? 'bg-brand-600 text-white rounded-tl-none' : 'bg-white text-slate-800 rounded-tr-none border border-slate-200'}`}><p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p></div>
                                        <span className="text-[9px] text-slate-400 mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}{msg.senderId === currentUser && (msg.isRead ? ' • נקרא' : ' • נשלח')}</span>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="bg-white p-3 border-t border-slate-200 flex items-center gap-2"><input type="text" className="flex-1 bg-slate-50 border border-slate-200 rounded-full py-2.5 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-inner" placeholder="הקלד הודעה..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()}/><button onClick={handleSend} disabled={!newMessage.trim()} className="bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-full transition-all active:scale-90 disabled:opacity-50 shadow-md flex items-center justify-center shrink-0"><Send className="w-5 h-5" /></button></div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50 shadow-inner">
                        <div className="bg-white p-10 rounded-full mb-6 shadow-sm border border-slate-100"><User className="w-16 h-16 opacity-5" /></div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">תיבת ההודעות שלך</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto">בחר שיחה מהרשימה בצד כדי לצפות בהודעות או התחל שיחה חדשה ישירות מהצעות הברטר.</p>
                        <div className="mt-8 p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-3 max-w-sm text-right"><Info className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" /><p className="text-xs text-slate-500 leading-relaxed">הודעות בצ'אט נשלחות בזמן אמת. כאשר שותף לברטר יענה לך, תופיע התראה בראש האתר.</p></div>
                    </div>
                )}
            </div>
      </div>
    </div>
  );
};
