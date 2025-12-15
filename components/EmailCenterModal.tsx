
"use client";

import React, { useState } from 'react';
import { X, Send, Clock, CheckCircle, Mail, AlertCircle, LayoutTemplate, Smartphone, Monitor, ChevronLeft, Settings, Menu } from 'lucide-react';
import { WelcomeEmailPreview, ChatMessageAlertPreview, SmartMatchAlertPreview } from './EmailTemplates';

interface EmailCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EmailType = 'welcome' | 'chat_alert' | 'smart_match';
type ViewMode = 'desktop' | 'mobile';

export const EmailCenterModal: React.FC<EmailCenterModalProps> = ({ isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState<EmailType>('welcome');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isSending, setIsSending] = useState(false);
  
  // Mobile Navigation State:
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!isOpen) return null;

  const handleSelectType = (type: EmailType) => {
      setSelectedType(type);
      setIsSidebarOpen(false); // Close sidebar on selection (mobile)
  };

  const handleSendTest = async () => {
      // 1. Debugging Logs & Alerts as requested
      console.log("Button Clicked!");
      alert("Sending... (Click OK to proceed with fetch)");

      setIsSending(true);

      try {
          // 2. Real Fetch Request
          const response = await fetch('/api/emails/send', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  type: selectedType,
                  // Hardcoded admin email for testing purposes
                  to: 'yaikov.p.0548562029@gmail.com', 
                  data: {
                      userName: 'Admin Tester',
                      senderName: 'System Debugger'
                  }
              })
          });

          // 3. Handle Response
          if (response.ok) {
              const result = await response.json();
              console.log("Server Success:", result);
              alert(`מייל בדיקה נשלח בהצלחה!\nID: ${result.id}`);
          } else {
              const errorData = await response.json().catch(() => ({}));
              console.error("Server Error:", response.status, errorData);
              alert(`שגיאה בשליחה: ${response.status} ${response.statusText}`);
          }

      } catch (error: any) {
          console.error("Network/Fetch Error:", error);
          alert(`שגיאת רשת: ${error.message}`);
      } finally {
          setIsSending(false);
      }
  };

  const renderPreview = () => {
      switch (selectedType) {
          case 'welcome': return <WelcomeEmailPreview />;
          case 'chat_alert': return <ChatMessageAlertPreview />;
          case 'smart_match': return <SmartMatchAlertPreview />;
          default: return null;
      }
  };

  const getTitle = () => {
      switch (selectedType) {
          case 'welcome': return 'מייל קבלת פנים (Welcome)';
          case 'chat_alert': return 'התראה על הודעה חדשה';
          case 'smart_match': return 'התאמה אישית (Smart Match)';
      }
  };

  const getDescription = () => {
      switch (selectedType) {
          case 'welcome': return 'נשלח אוטומטית לכל משתמש שנרשם למערכת.';
          case 'chat_alert': return 'נשלח כאשר משתמש מקבל הודעה בצ\'אט ואינו מחובר כרגע.';
          case 'smart_match': return 'נשלח תקופתית (או בטריגר) כאשר זוהתה הצעה רלוונטית למשתמש.';
      }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-100 flex flex-col h-[100dvh] w-screen overflow-hidden font-sans" dir="rtl">
        
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 shrink-0 flex justify-between items-center shadow-md z-30">
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg sm:text-xl font-bold tracking-wide">מרכז שליטה לאימיילים</h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-light flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        מחובר לשרת הדיוור (Resend API)
                    </p>
                </div>
            </div>
            <button 
                type="button"
                onClick={onClose} 
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors flex items-center gap-2 px-3 sm:px-4"
            >
                <span className="hidden sm:inline">סגור חלונית</span>
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Main Workspace Layout */}
        <div className="flex flex-1 overflow-hidden relative">
            
            {/* Sidebar (Navigation) */}
            <div className={`
                absolute inset-0 z-20 bg-white sm:relative sm:inset-auto sm:w-80 sm:flex flex-col border-l border-slate-200 shadow-lg transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'}
            `}>
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        <LayoutTemplate className="w-5 h-5 text-brand-600" />
                        תבניות מערכת
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">בחר את סוג המייל לעריכה ולצפייה</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    <EmailNavItem 
                        isActive={selectedType === 'welcome'} 
                        onClick={() => handleSelectType('welcome')}
                        icon={<CheckCircle className="w-5 h-5" />}
                        title="מייל הרשמה"
                        subtitle="Welcome Flow"
                    />
                    <EmailNavItem 
                        isActive={selectedType === 'chat_alert'} 
                        onClick={() => handleSelectType('chat_alert')}
                        icon={<Mail className="w-5 h-5" />}
                        title="התראה על הודעה"
                        subtitle="Chat Notification"
                        badge="קריטי"
                    />
                    <EmailNavItem 
                        isActive={selectedType === 'smart_match'} 
                        onClick={() => handleSelectType('smart_match')}
                        icon={<AlertCircle className="w-5 h-5" />}
                        title="התאמה חכמה"
                        subtitle="AI Matching"
                    />
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-center text-slate-400">
                    Barter.org.il Email System v2.0
                </div>
            </div>

            {/* Main Content Area (Preview) */}
            <div className="flex-1 flex flex-col relative bg-slate-100 h-full w-full">
                
                {/* Toolbar */}
                <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex justify-between items-center shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        {/* Mobile Toggle Button */}
                        <button 
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            className="sm:hidden p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-full"
                            title="חזרה לרשימת התבניות"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div>
                            <h2 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 line-clamp-1">
                                {getTitle()}
                            </h2>
                            <span className="text-xs text-slate-500 hidden sm:inline-block">{getDescription()}</span>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200 shrink-0">
                        <button 
                            type="button"
                            onClick={() => setViewMode('desktop')}
                            className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${viewMode === 'desktop' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="תצוגת מחשב"
                        >
                            <Monitor className="w-4 h-4" />
                            <span className="hidden sm:inline">דסקטופ</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setViewMode('mobile')}
                            className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${viewMode === 'mobile' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="תצוגת נייד"
                        >
                            <Smartphone className="w-4 h-4" />
                            <span className="hidden sm:inline">מובייל</span>
                        </button>
                    </div>
                </div>

                {/* Preview Canvas */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
                    <div 
                        className={`transition-all duration-300 ease-in-out shadow-2xl bg-white ${
                            viewMode === 'mobile' ? 'w-full max-w-[375px] min-h-[600px] rounded-3xl border-[6px] border-slate-800' : 'w-full max-w-[800px] min-h-[500px] rounded-lg border border-slate-200'
                        }`}
                    >
                        {viewMode === 'mobile' && (
                            <div className="h-6 bg-slate-800 w-full rounded-t-[18px] flex justify-center items-center shrink-0">
                                <div className="w-16 h-1 bg-slate-600 rounded-full"></div>
                            </div>
                        )}
                        
                        <div className="w-full h-full overflow-hidden bg-white rounded-lg flex flex-col">
                            {/* Header inside preview for realism */}
                            <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3 shrink-0">
                                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs">B</div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-slate-800">Barter Team</div>
                                    <div className="text-[10px] text-slate-400">to me</div>
                                </div>
                                <div className="text-[10px] text-slate-400">12:30 PM</div>
                            </div>
                            
                            {/* Actual Email Template */}
                            <div className="p-4 flex-1 overflow-y-auto">
                                {renderPreview()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Control Panel Footer */}
                <div className="bg-white border-t border-slate-200 p-4 sm:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto w-full">
                        
                        <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 p-2 rounded-full text-slate-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 uppercase">תזמון</span>
                                    <span className="font-medium text-slate-800 text-sm">
                                        {selectedType === 'chat_alert' ? 'מיידי' : 'אוטומטי'}
                                    </span>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-full text-green-600">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 uppercase">סטטוס</span>
                                    <span className="font-bold text-green-600 flex items-center gap-1 text-sm">
                                        פעיל
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SEND BUTTON - DEBUGGING ADDED */}
                        <button 
                            type="button"
                            onClick={handleSendTest}
                            disabled={isSending}
                            className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 min-w-[200px]"
                        >
                            <Send className="w-4 h-4" />
                            {isSending ? 'שולח...' : 'שלח בדיקה לאדמין'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

const EmailNavItem = ({ isActive, onClick, icon, title, subtitle, badge }: any) => (
    <button 
        type="button"
        onClick={onClick}
        className={`w-full text-right p-3 rounded-xl border transition-all flex items-center gap-4 group active:scale-98 ${
            isActive 
            ? 'bg-brand-50 border-brand-500 shadow-sm ring-1 ring-brand-200' 
            : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-slate-50'
        }`}
    >
        <div className={`p-2.5 rounded-full transition-colors ${
            isActive ? 'bg-brand-200 text-brand-800' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-brand-600'
        }`}>
            {icon}
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-center">
                <span className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{title}</span>
                {badge && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{badge}</span>}
            </div>
            <span className="text-xs text-slate-400 font-medium font-mono">{subtitle}</span>
        </div>
        {isActive && <ChevronLeft className="w-4 h-4 text-brand-500" />}
    </button>
);
