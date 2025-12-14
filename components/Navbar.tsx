
import React, { useState } from 'react';
import { ArrowRightLeft, Menu, X, PlusCircle, MessageSquare, User as UserIcon, LogOut, Shield, FileText, Search, Megaphone, BarChart3, Home, Heart, Settings } from 'lucide-react';
import { UserProfile } from '../types';
import { AdminEmailButton } from './AdminEmailButton'; // Import

interface NavbarProps {
  currentUser: UserProfile | null;
  onOpenCreateModal: () => void;
  onOpenMessages: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  // Admin Actions
  onOpenAdminDashboard?: () => void;
  onOpenEmailCenter?: () => void; // New Prop
  
  unreadCount: number;
  adminPendingCount?: number; 
  onSearch: (query: string) => void;
  onOpenHowItWorks: () => void;
  activeFeed?: 'all' | 'for_you';
  onNavigate?: (feed: 'all' | 'for_you') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentUser,
  onOpenCreateModal, 
  onOpenMessages, 
  onOpenAuth,
  onOpenProfile,
  onOpenAdminDashboard,
  onOpenEmailCenter, // Destructure
  onLogout,
  onSearch,
  unreadCount,
  adminPendingCount = 0,
  onOpenHowItWorks,
  activeFeed = 'all',
  onNavigate
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-1">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => onNavigate && onNavigate('all')}>
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <ArrowRightLeft className="h-6 w-6 text-white" />
              </div>
              <span className="font-extrabold text-xl text-slate-800 tracking-tight hidden md:block">Barter.org.il</span>
              <span className="font-extrabold text-xl text-slate-800 tracking-tight md:hidden">Barter</span>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center mr-8 space-x-1 space-x-reverse">
                <button
                    onClick={() => onNavigate && onNavigate('all')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors ${
                        activeFeed === 'all' 
                        ? 'bg-slate-100 text-slate-900' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <Home className="w-4 h-4" />
                    <span className="leading-none">ראשי</span>
                </button>
                <button
                    onClick={() => onNavigate && onNavigate('for_you')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors ${
                        activeFeed === 'for_you' 
                        ? 'bg-brand-50 text-brand-700' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <Heart className="w-4 h-4" />
                    <span className="leading-none">במיוחד בשבילך</span>
                </button>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center mr-6 w-64">
               <div className="relative w-full">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-4 pr-10 py-1.5 border border-slate-300 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm font-normal transition duration-150 ease-in-out"
                    placeholder="חיפוש..."
                    onChange={(e) => onSearch(e.target.value)}
                  />
               </div>
            </div>

            {/* How it works Link */}
            <div className="hidden lg:flex mr-4">
              <button 
                onClick={onOpenHowItWorks}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                איך זה עובד?
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Messages Button */}
            <button 
              onClick={onOpenMessages}
              className="relative p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-full transition-colors"
              title={currentUser ? "הודעות" : "התחבר לצפייה בהודעות"}
            >
              <MessageSquare className="w-6 h-6" />
              {currentUser && unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <>
                {/* Admin Buttons - Unified & Email */}
                {currentUser.role === 'admin' && (
                  <div className="hidden lg:flex items-center border-l border-slate-200 pl-2 ml-2">
                        {onOpenEmailCenter && <AdminEmailButton onClick={onOpenEmailCenter} />}
                        
                        {onOpenAdminDashboard && (
                            <button 
                              onClick={onOpenAdminDashboard}
                              className="flex items-center gap-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm border border-slate-200 relative ml-2"
                              title="ניהול מערכת"
                            >
                              <Settings className="w-4 h-4" />
                              <span className="leading-none">ניהול</span>
                              {adminPendingCount > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 h-4 min-w-[1rem] flex items-center justify-center rounded-full border-2 border-white">
                                      {adminPendingCount}
                                  </span>
                              )}
                            </button>
                        )}
                  </div>
                )}

                {/* Desktop Profile Actions */}
                <div className="hidden sm:flex items-center gap-3 pl-2 border-r border-slate-200 mr-2">
                   <button 
                      onClick={onOpenProfile}
                      className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-lg transition-colors"
                   >
                      <img 
                        src={currentUser.avatarUrl} 
                        alt={currentUser.name} 
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover aspect-square"
                      />
                      <span className="text-sm font-bold text-slate-700 hidden lg:block">
                        {currentUser.name}
                      </span>
                   </button>
                   <button 
                    onClick={onLogout} 
                    className="text-slate-400 hover:text-red-500 p-1" 
                    title="התנתק"
                   >
                     <LogOut className="w-5 h-5" />
                   </button>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-4">
                <button 
                  onClick={onOpenAuth}
                  className="text-sm font-bold text-slate-600 hover:text-brand-600"
                >
                  התחברות / הרשמה
                </button>
              </div>
            )}

            {/* Post Offer */}
            <button 
              onClick={onOpenCreateModal}
              className="bg-brand-600 hover:bg-brand-700 text-white px-3 sm:px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
              title={currentUser ? "פרסם הצעה חדשה" : "הירשם לפרסום הצעה"}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="inline leading-none">פרסם הצעה</span>
            </button>

            {/* Mobile Menu Button */}
            <div className="flex items-center sm:hidden ml-1">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none"
              >
                {isMenuOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-200 absolute w-full left-0 shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="pt-2 pb-4 px-4 space-y-2">
                
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => { onNavigate && onNavigate('all'); setIsMenuOpen(false); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 ${activeFeed === 'all' ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-500'}`}
                    >
                        <Home className="w-4 h-4" />
                        ראשי
                    </button>
                    <button
                        onClick={() => { onNavigate && onNavigate('for_you'); setIsMenuOpen(false); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 ${activeFeed === 'for_you' ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-500'}`}
                    >
                        <Heart className="w-4 h-4" />
                        בשבילך
                    </button>
                </div>

                <div className="relative mb-4">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:bg-white focus:border-brand-500 transition duration-150 ease-in-out font-normal"
                    placeholder="חיפוש שירות..."
                    onChange={(e) => onSearch(e.target.value)}
                  />
                </div>

                {currentUser ? (
                    <div className="border-b border-slate-100 pb-3 mb-3">
                         <div 
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                            onClick={() => {
                                onOpenProfile();
                                setIsMenuOpen(false);
                            }}
                         >
                            <img src={currentUser.avatarUrl} alt="" className="w-10 h-10 rounded-full border border-slate-200 object-cover aspect-square" />
                            <div>
                                <div className="font-bold text-slate-800">{currentUser.name}</div>
                                <div className="text-xs text-brand-600 font-medium">הצג פרופיל אישי</div>
                            </div>
                         </div>
                         
                         {currentUser.role === 'admin' && (
                            <div className="mt-2 space-y-2">
                                {onOpenAdminDashboard && (
                                    <button 
                                      onClick={() => {
                                        onOpenAdminDashboard();
                                        setIsMenuOpen(false);
                                      }}
                                      className="w-full flex items-center justify-center gap-2 p-3 text-white bg-slate-900 rounded-xl text-sm font-bold shadow-sm relative"
                                    >
                                      <Settings className="w-4 h-4" />
                                      ניהול מערכת
                                      {adminPendingCount > 0 && (
                                          <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                              {adminPendingCount} עדכונים
                                          </span>
                                      )}
                                    </button>
                                )}
                                {onOpenEmailCenter && (
                                    <button
                                        onClick={() => {
                                            onOpenEmailCenter();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 p-3 text-slate-700 bg-emerald-100 rounded-xl text-sm font-bold"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        ניהול אימיילים
                                    </button>
                                )}
                            </div>
                         )}
                    </div>
                ) : (
                    <div className="border-b border-slate-100 pb-3 mb-3">
                        <button 
                            onClick={() => { onOpenAuth(); setIsMenuOpen(false); }}
                            className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-sm"
                        >
                            התחברות / הרשמה
                        </button>
                    </div>
                )}
                
                <button 
                    onClick={() => {
                        onOpenHowItWorks();
                        setIsMenuOpen(false);
                    }}
                    className="block w-full text-right px-3 py-2 rounded-md text-base font-bold text-slate-700 hover:bg-slate-50"
                >
                    איך זה עובד?
                </button>

                {currentUser && (
                    <button 
                        onClick={() => { onLogout(); setIsMenuOpen(false); }}
                        className="w-full text-right flex items-center gap-2 px-3 py-2 text-base font-bold text-red-600 hover:bg-red-50 rounded-md mt-4"
                    >
                        <LogOut className="w-4 h-4" />
                        התנתק מהמערכת
                    </button>
                )}
            </div>
        </div>
      )}
    </nav>
  );
};
