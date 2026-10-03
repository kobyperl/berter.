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

// Utility to compress image
const compressImage = (file: File): Promise => {
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

export const MessagingModal: React.FC = ({ 
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
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const processingReadIds = useRef>(new Set());

  // --- Group messages into personal conversations ---
  const conversationsMap = useMemo(() => {
    const map = new Map();
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
      } else if (shouldCountAsUnread && existing) {
          existing.unreadCount += 1;
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
        if (recipientProfile) setActiveConversationId(recipientProfile.id);
        setSearchTerm('');
        setReplyingTo(null);
        setEditingMessageId(null);
    }
  }, [isOpen, recipientProfile]);

  useEffect(() => {
    if (isOpen && activeConversationId) {
        const unreadForActive = activeMessages.filter(m => 
            m.receiverId === currentUser && !m.isRead && !processingReadIds.current.has(m.id)
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
  }, [activeMessages.length, isOpen, activeConversationId, replyingTo]);

  // פונקציית העזר לשליחת אימייל התראה לצד השני
  const sendChatEmailAlert = async (recipientId: string) => {
      try {
          const recipientUser = users.find(u => u.id === recipientId);
          const senderUser = users.find(u => u.id === currentUser);
          
          if (!recipientUser?.email) return;

          await fetch('/api/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  type: 'chat_alert',
                  to: recipientUser.email,
                  data: {
                      userName: recipientUser.name || 'משתמש',
                      senderName: senderUser?.name || 'משתמש מהאתר'
                  }
              })
          });
      } catch (err) {
          console.error("Failed to send chat alert email:", err);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent) => {
      const file = e.target.files?.[0];
      if (!file || !activeConversationId) return;

      setIsUploading(true);
      try {
          let fileUrl = '';
          const isImage = file.type.startsWith('image/');
          
          if (isImage) {
              fileUrl = await compressImage(file);
          } else {
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

          await sendChatEmailAlert(activeConversationId);

      } catch (err) {
          alert('שגיאה בהעלאת הקובץ');
      } finally {
          setIsUploading(false);
          if (e.target) e.target.value = '';
      }
  };

  const handleSend = async () => {
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

    const textToSend = newMessage;
    setNewMessage('');
    setReplyingTo(null);

    onSendMessage(
        activeConversationId, 
        receiverName || 'משתמש', 
        subject, 
        textToSend, 
        undefined, 
        replyingTo ? { id: replyingTo.id, content: replyingTo.content, senderName: replyingTo.senderName } : undefined
    );

    await sendChatEmailAlert(activeConversationId);
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
{/* Sidebar List */}

תיבת הודעות
setSearchTerm(e.target.value)}
/>

{filteredConversations.length === 0 && !recipientProfile ? (

אין לך שיחות פעילות כרגע

) : (
filteredConversations.map(conv => {
const convProfile = users.find(u => u.id === conv.partnerId);

    return (
setActiveConversationId(conv.partnerId)}
className={flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${activeConversationId === conv.partnerId ? 'bg-brand-50 border-r-4 border-r-brand-500' : ''}}
>

{
if (convProfile) {
e.stopPropagation();
onUserClick(convProfile);
}
}}
title="לחץ לצפייה בפרופיל"
>
{conv.avatarUrl ? (

) : (

{conv.partnerName[0]}

)}
{conv.unreadCount > 0 && (

{conv.unreadCount}

)}

{conv.partnerName}
0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
{conv.lastMessage.isDeleted ? 'הודעה נמחקה' : conv.lastMessage.content}

    );
})
)}

{/* Chat Area */}

{activeConversationId ? (
<>

setActiveConversationId(null)} className="sm:hidden p-1 text-slate-400 hover:text-slate-600">

activePartnerProfile && onUserClick(activePartnerProfile)}
>
{activePartnerAvatar ? (

) : (

{activePartnerName[0]}

)}

{activePartnerName}
{activeMessages.map((msg) => {
const isMe = msg.senderId === currentUser;
const isDeleted = msg.isDeleted;
const canEdit = isMe && !isDeleted && (Date.now() - new Date(msg.timestamp).getTime() < 15 * 60 * 1000);

return (
{msg.replyTo && !isDeleted && (

{msg.replyTo.senderName}
{msg.replyTo.content}

)}

{msg.attachmentUrl && !isDeleted && (

{msg.attachmentType === 'image' ? (

) : (

קובץ מצורף

)}
{msg.attachmentExpiry && (

יימחק אוטומטית ב: {new Date(msg.attachmentExpiry).toLocaleDateString('he-IL')}

)}

)}

{isDeleted ? '🚫 הודעה זו נמחקה' : msg.content}

{new Date(msg.timestamp).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}
{msg.lastEdited && !isDeleted && (נערך)}

{!isDeleted && (

setReplyingTo(msg)} title="הגב" className="hover:scale-110 transition-transform">
{isMe && (
<>
{canEdit &&  startEdit(msg)} title="ערוך" className="hover:scale-110 transition-transform">}
{ if(window.confirm('למחוק הודעה זו?')) onDeleteMessage(msg.id); }} title="מחק" className="hover:scale-110 transition-transform">

)}

)}

);
})}

{/* Input Area */}

{replyingTo && (

משיב ל-{replyingTo.senderName}:
{replyingTo.content}

setReplyingTo(null)} className="text-slate-400 hover:text-slate-600">

)}

{editingMessageId && (

עורך הודעה...

{ setEditingMessageId(null); setNewMessage(''); }} className="text-yellow-600 hover:text-yellow-800">

)}

fileInputRef.current?.click()}
disabled={isUploading || !!editingMessageId}
className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-full transition-colors disabled:opacity-50"
title="צרף קובץ (יימחק תוך שבוע)"

{isUploading ?  : }
setNewMessage(e.target.value)}
onKeyPress={(e) => e.key === 'Enter' && handleSend()}
/>

{editingMessageId ?  : }
) : (

Barter.org.il
בחר שיחה מהרשימה כדי להתחיל להתכתב

)}

);
};

const Check = ({ className }: { className?: string }) => (

SVG

);
