
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Search, User, Paperclip, Reply, Edit2, Trash2, FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { Message, UserProfile } from '../types';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string; // authUid
  messages: Message[];
  onSendMessage: (receiverId: string, receiverName: string, subject: string, content: string, attachment?: {url: string, type: 'image'|'file', expiry: string}, replyTo?: {id: string, content: string, senderName: string}) => void;
  onMarkAsRead: (messageId: string) => void;
  recipientProfile?: UserProfile | null;
  initialSubject?: string;
  users: UserProfile[]; // Needed for avatars
  onUserClick: (profile: UserProfile) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: Message;
  unreadCount: number;
  avatarUrl?: string;
}

// Utility to compress image (same as in other components)
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; 
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.6));
          } else { reject(new Error("Canvas context error")); }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
};

export const MessagingModal: React.FC<MessagingModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  messages, 
  onSendMessage, 
  onMarkAsRead,
  recipientProfile,
  initialSubject,
  users,
  onUserClick,
  onEditMessage,
  onDeleteMessage
}) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // New State for Advanced Features
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const processingReadIds = useRef<Set<string>>(new Set());

  // --- Group messages into personal conversations ---
  const conversationsMap = useMemo(() => {
    const map = new Map<string, Conversation>();
    
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

      // Try to find avatar from users list
      const partnerProfile = users.find(u => u.id === partnerId);
      const avatarUrl = partnerProfile?.avatarUrl;

      if (!existing || msgTime > existingTime) {
        map.set(partnerId, {
          partnerId,
          partnerName: partnerProfile?.name || partnerName,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + (shouldCountAsUnread ? 1 : 0),
          avatarUrl
        });
      } else if (shouldCountAsUnread) {
          if (existing) {
              existing.unreadCount += 1;
          }
      }
    });
    return map;
  }, [messages, currentUser, activeConversationId, users]);

  const conversations = useMemo(() => {
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
        setReplyingTo(null);
        setEditingMessageId(null);
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
  }, [activeMessages.length, isOpen, activeConversationId, replyingTo]); // Scroll when replying changes too

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeConversationId) return;

      setIsUploading(true);
      try {
          // If image, compress. If file, simulated upload (in real app, upload to storage)
          let fileUrl = '';
          const isImage = file.type.startsWith('image/');
          
          if (isImage) {
              fileUrl = await compressImage(file);
          } else {
              // Simulating file URL for demo (in prod use Storage)
              fileUrl = '#file-placeholder'; 
          }

          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7);

          const conv = conversationsMap.get(activeConversationId);
          let receiverName = conv?.partnerName || (recipientProfile?.id === activeConversationId ? recipientProfile.name : 'משתמש');
          
          let subject = activeMessages.length > 0 ? (activeMessages[activeMessages.length - 1].subject || "המשך שיחה") : (initialSubject || "צ'אט");

          onSendMessage(
              activeConversationId, 
              receiverName, 
              subject, 
              isImage ? '📷 תמונה מצורפת' : '📎 קובץ מצורף',
              { 
                  url: fileUrl, 
                  type: isImage ? 'image' : 'file', 
                  expiry: expiryDate.toISOString() 
              }
          );

      } catch (err) {
          alert('שגיאה בהעלאת הקובץ');
      } finally {
          setIsUploading(false);
          e.target.value = '';
      }
  };

  const handleSend = () => {
    if ((!newMessage.trim() && !editingMessageId) || !activeConversationId) return;

    if (editingMessageId) {
        onEditMessage(editingMessageId, newMessage);
        setEditingMessageId(null);
        setNewMessage('');
        return;
    }

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

    onSendMessage(
        activeConversationId, 
        receiverName || 'משתמש', 
        subject, 
        newMessage, 
        undefined, 
        replyingTo ? { id: replyingTo.id, content: replyingTo.content, senderName: replyingTo.senderName } : undefined
    );
    setNewMessage('');
    setReplyingTo(null);
  };

  const startEdit = (msg: Message) => {
      setEditingMessageId(msg.id);
      setNewMessage(msg.content);
      setReplyingTo(null);
  };

  if (!isOpen) return null;

  const activePartnerProfile = users.find(u => u.id === activeConversationId);
  const activePartnerName = conversationsMap.get(activeConversationId!)?.partnerName || recipientProfile?.name || activePartnerProfile?.name || 'צ\'אט';
  const activePartnerAvatar = activePartnerProfile?.avatarUrl || conversationsMap.get(activeConversationId!)?.avatarUrl;

  return (
    // Fixed layout for mobile: full screen height (100dvh), remove padding on mobile
    <div className="fixed inset-0 z-[80] flex items-center justify-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-5xl h-[100dvh] sm:h-[85vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row z-50 text-right font-sans" dir="rtl">
            {/* Sidebar List */}
            <div className={`w-full sm:w-1/3 border-l border-slate-200 bg-white flex flex-col h-full ${activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-slate-800 text-lg">תיבת הודעות</h2>
                    <button onClick={onClose} className="sm:hidden p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-3 border-b border-slate-100 shrink-0">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full bg-white border border-slate-200 rounded-full py-2 pr-10 pl-4 text-sm focus:border-brand-500 focus:bg-white outline-none transition-all text-slate-900"
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
                        filteredConversations.map(conv => {
                            const convProfile = users.find(u => u.id === conv.partnerId);
                            
                            return (
                                <div 
                                    key={conv.partnerId}
                                    onClick={() => setActiveConversationId(conv.partnerId)}
                                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${activeConversationId === conv.partnerId ? 'bg-brand-50 border-r-4 border-r-brand-500' : ''}`}
                                >
                                    <div 
                                        className="relative shrink-0 cursor-pointer group"
                                        onClick={(e) => {
                                            if (convProfile) {
                                                e.stopPropagation();
                                                onUserClick(convProfile);
                                            }
                                        }}
                                        title="לחץ לצפייה בפרופיל"
                                    >
                                        {conv.avatarUrl ? (
                                            <img src={conv.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-slate-200 group-hover:border-brand-500 transition-colors" alt="" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-slate-300">{conv.partnerName[0]}</div>
                                        )}
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
                                            {conv.lastMessage.isDeleted ? 'הודעה נמחקה' : conv.lastMessage.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area - Fix flex layout for mobile scrolling */}
            <div className={`w-full sm:flex-1 flex flex-col bg-slate-100 h-full relative ${!activeConversationId ? 'hidden sm:flex' : 'flex'}`}>
                {activeConversationId ? (
                    <>
                        {/* Header - Fixed Height, shrink-0 */}
                        <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center shadow-sm z-20 shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveConversationId(null)} className="sm:hidden p-1 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                                <div 
                                    className="relative cursor-pointer group"
                                    onClick={() => activePartnerProfile && onUserClick(activePartnerProfile)}
                                >
                                    {activePartnerAvatar ? (
                                        <img src={activePartnerAvatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:border-brand-500" alt="" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold">{activePartnerName[0]}</div>
                                    )}
                                </div>
                                <div><h3 className="font-bold text-slate-900 text-sm">{activePartnerName}</h3></div>
                            </div>
                            <button onClick={onClose} className="hidden sm:block text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Messages - Flex-1, scrollable, min-h-0 is crucial for nested flex scrolling */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-100/50 min-h-0 overscroll-contain">
                            {activeMessages.map((msg) => {
                                const isMe = msg.senderId === currentUser;
                                const isDeleted = msg.isDeleted;
                                const canEdit = isMe && !isDeleted && (Date.now() - new Date(msg.timestamp).getTime() < 15 * 60 * 1000); 
                                
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm text-sm relative transition-all ${isMe ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'} ${isDeleted ? 'opacity-60 bg-slate-200 text-slate-500 italic' : ''}`}>
                                            
                                            {msg.replyTo && !isDeleted && (
                                                <div className={`mb-2 p-2 rounded-lg text-xs border-r-2 ${isMe ? 'bg-brand-600 border-brand-300 text-brand-100' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                                                    <span className="font-bold block mb-0.5">{msg.replyTo.senderName}</span>
                                                    <span className="line-clamp-1">{msg.replyTo.content}</span>
                                                </div>
                                            )}

                                            {msg.attachmentUrl && !isDeleted && (
                                                <div className="mb-2">
                                                    {msg.attachmentType === 'image' ? (
                                                        <img src={msg.attachmentUrl} alt="Attachment" className="max-w-full rounded-lg border border-black/10 max-h-48 object-cover" />
                                                    ) : (
                                                        <div className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                                                            <FileText className="w-5 h-5" />
                                                            <span>קובץ מצורף</span>
                                                        </div>
                                                    )}
                                                    {msg.attachmentExpiry && (
                                                        <div className={`text-[9px] mt-1 flex items-center gap-1 ${isMe ? 'text-brand-200' : 'text-slate-400'}`}>
                                                            <Loader2 className="w-3 h-3" />
                                                            יימחק אוטומטית ב: {new Date(msg.attachmentExpiry).toLocaleDateString('he-IL')}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <p className="whitespace-pre-wrap leading-relaxed">
                                                {isDeleted ? '🚫 הודעה זו נמחקה' : msg.content}
                                            </p>
                                            
                                            <div className="flex items-center justify-between gap-3 mt-1">
                                                <div className={`text-[9px] flex items-center gap-1 ${isMe ? 'text-brand-100' : 'text-slate-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}
                                                    {msg.lastEdited && !isDeleted && <span>(נערך)</span>}
                                                </div>
                                                
                                                {!isDeleted && (
                                                    <div className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity items-center ${isMe ? 'text-white' : 'text-slate-500'}`}>
                                                        <button onClick={() => setReplyingTo(msg)} title="הגב" className="hover:scale-110 transition-transform"><Reply className="w-3 h-3" /></button>
                                                        {isMe && (
                                                            <>
                                                                {canEdit && <button onClick={() => startEdit(msg)} title="ערוך" className="hover:scale-110 transition-transform"><Edit2 className="w-3 h-3" /></button>}
                                                                <button onClick={() => { if(window.confirm('למחוק הודעה זו?')) onDeleteMessage(msg.id); }} title="מחק" className="hover:scale-110 transition-transform"><Trash2 className="w-3 h-3" /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area - Fixed at bottom, shrink-0 */}
                        <div className="bg-white p-3 border-t border-slate-200 shrink-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
                            {replyingTo && (
                                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg mb-2 border-r-4 border-brand-500 animate-in slide-in-from-bottom-2">
                                    <div className="text-xs text-slate-600">
                                        <span className="font-bold block text-brand-700">משיב ל-{replyingTo.senderName}:</span>
                                        <span className="line-clamp-1">{replyingTo.content}</span>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                </div>
                            )}
                            
                            {editingMessageId && (
                                <div className="flex justify-between items-center bg-yellow-50 p-2 rounded-lg mb-2 border-r-4 border-yellow-500 animate-in slide-in-from-bottom-2">
                                    <div className="text-xs text-yellow-800 font-bold">עורך הודעה...</div>
                                    <button onClick={() => { setEditingMessageId(null); setNewMessage(''); }} className="text-yellow-600 hover:text-yellow-800"><X className="w-4 h-4" /></button>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    disabled={isUploading || !!editingMessageId} 
                                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-full transition-colors disabled:opacity-50"
                                    title="צרף קובץ (יימחק תוך שבוע)"
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                
                                <input 
                                    type="text"
                                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-full py-2.5 px-5 outline-none focus:border-brand-500 focus:bg-white transition-all text-sm"
                                    placeholder={editingMessageId ? "ערוך את ההודעה..." : "הקלד הודעה..."}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button 
                                    onClick={handleSend} 
                                    disabled={!newMessage.trim()} 
                                    className={`p-2.5 rounded-full shadow-sm transition-all active:scale-95 text-white ${editingMessageId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-brand-600 hover:bg-brand-700 disabled:opacity-50'}`}
                                >
                                    {editingMessageId ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5 mirror-rtl" />}
                                </button>
                            </div>
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

// Simple Check Icon for edit confirm
const Check = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>
);
