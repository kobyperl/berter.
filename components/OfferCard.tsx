import React, { useState } from 'react';
import { MapPin, Calendar, MessageCircle, ChevronDown, ChevronUp, Star, Trash2, Clock, Repeat, EyeOff, Edit } from 'lucide-react';
import { BarterOffer, UserProfile } from '../types';

export interface OfferCardProps {
  offer: BarterOffer;
  onContact: (profile: UserProfile) => void;
  onUserClick: (profile: UserProfile) => void;
  onRate?: (offerId: string, rating: number) => void;
  onDelete?: (offerId: string) => void;
  onEdit?: (offer: BarterOffer) => void; // New Prop for editing
  currentUserId?: string;
  viewMode?: 'grid' | 'compact';
}

export const OfferCard: React.FC<OfferCardProps> = ({ 
    offer, 
    onContact, 
    onUserClick, 
    onRate, 
    onDelete,
    onEdit,
    currentUserId,
    viewMode = 'grid' 
}) => {
  const isOngoing = offer.durationType === 'ongoing';
  const isExpired = offer.status === 'expired';
  const isPending = offer.status === 'pending'; 
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const isOwner = currentUserId === offer.profileId;
  const ratingCount = offer.ratings?.length || 0;
  const ratingScore = offer.averageRating || 0;
  
  // Visual Logic: Good vs Bad Offer
  const isHighRated = ratingScore >= 4.0 && ratingCount > 0;
  const isLowRated = ratingScore < 2.5 && ratingCount >= 2;

  const handleRate = (e: React.MouseEvent, score: number) => {
      e.stopPropagation();
      if (isOwner) {
          alert("לא ניתן לדרג את ההצעות של עצמך.");
          return;
      }
      if (!currentUserId) {
          alert("עליך להתחבר כדי לדרג.");
          return;
      }
      if (onRate) onRate(offer.id, score);
  };

  // Render Star Component
  const renderStars = (isCompact = false) => {
      return (
          <div className="flex items-center flex-wrap gap-2" onMouseLeave={() => setHoverRating(0)}>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={(e) => handleRate(e, star)}
                        onMouseEnter={() => !isOwner && setHoverRating(star)}
                        className={`transition-colors ${isOwner ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                        disabled={isOwner}
                    >
                        <Star 
                            className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} ${
                                (hoverRating || Math.round(ratingScore)) >= star 
                                ? (isHighRated ? 'text-yellow-400 fill-yellow-400' : 'text-amber-400 fill-amber-400') 
                                : 'text-slate-300'
                            }`} 
                        />
                    </button>
                ))}
              </div>
              
              <span className={`font-medium ${isCompact ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}>
                  {isHighRated ? (
                      <span className="text-yellow-600 font-bold bg-yellow-50 px-1.5 py-0.5 rounded-md">
                          מומלץ בחום
                      </span>
                  ) : ratingCount > 0 ? (
                      <span className="text-slate-400">
                          דורג ע"י {ratingCount}
                      </span>
                  ) : (
                      <span className="text-slate-300">
                          טרם דורג
                      </span>
                  )}
              </span>
          </div>
      );
  };

  // Compact View Render
  if (viewMode === 'compact') {
      return (
        <div 
            className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col ${
                isExpanded ? 'ring-2 ring-brand-100' : ''
            } ${isHighRated ? 'border-yellow-200 shadow-yellow-50' : 'border-slate-200'} ${isLowRated ? 'opacity-90 grayscale-[0.3]' : ''} ${isExpired ? 'opacity-75 bg-slate-50' : ''} ${isPending ? 'border-orange-300 bg-orange-50/30' : ''}`}
        >
            {/* Clickable Header Area */}
            <div 
                className="p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col sm:flex-row gap-3">
                    
                    {/* Top Row / Main Info */}
                    <div className="flex items-start gap-3 w-full">
                        
                        {/* Avatar & Duration Icon */}
                        <div className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); onUserClick(offer.profile); }}>
                            <div className="relative">
                                <img 
                                    src={offer.profile.avatarUrl} 
                                    alt={offer.profile.name} 
                                    className={`w-12 h-12 rounded-full object-cover border-2 ${isHighRated ? 'border-yellow-400' : 'border-white'} shadow-sm`}
                                />
                                <span className={`absolute -bottom-1 -right-1 px-1.5 py-1 rounded-full font-bold border border-white shadow-sm flex items-center justify-center ${
                                    isOngoing 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'bg-orange-50 text-orange-700'
                                }`}>
                                    {isOngoing ? <Repeat className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                </span>
                            </div>
                        </div>

                        {/* Middle Content - Spreads on Desktop */}
                        <div className="flex-1 min-w-0">
                            {/* Title & Meta Row */}
                            <div className="flex flex-col mb-1.5 gap-1">
                                <div>
                                    <h4 className={`font-bold text-lg leading-snug flex items-center gap-2 ${isExpired ? 'text-slate-500' : 'text-slate-900'}`}>
                                        {offer.title}
                                        {isExpired && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">פג תוקף</span>}
                                        {isPending && (
                                            <div className="group relative">
                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <EyeOff className="w-3 h-3" />
                                                    ממתין
                                                </span>
                                            </div>
                                        )}
                                    </h4>

                                    {/* Stars Row - Below title, smaller */}
                                    <div className="mt-1 mb-1 opacity-90 scale-95 origin-top-right" onClick={e => e.stopPropagation()}>
                                        {renderStars(true)}
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                         <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                            <MapPin className="w-3 h-3" />
                                            {offer.location}
                                        </span>
                                        {offer.expirationDate && !isExpired && (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-medium">
                                                <Calendar className="w-3 h-3" />
                                                עד: {new Date(offer.expirationDate).toLocaleDateString('he-IL')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Services - Requester Top, Provider Bottom. Stacked Vertically */}
                            <div className="flex flex-col gap-1.5 w-full mt-1">
                                <div className="flex items-start gap-1.5 min-w-0">
                                    <span className={`text-xs font-bold whitespace-nowrap shrink-0 ${isExpired ? 'text-slate-400' : 'text-indigo-600'}`}>מבקש/ת:</span>
                                    <span className="text-xs text-slate-700 font-medium truncate sm:whitespace-normal sm:line-clamp-1">{offer.requestedService}</span>
                                </div>
                                <div className="flex items-start gap-1.5 min-w-0">
                                    <span className={`text-xs font-bold whitespace-nowrap shrink-0 ${isExpired ? 'text-slate-400' : 'text-emerald-600'}`}>נותן/ת:</span>
                                    <span className="text-xs text-slate-700 font-medium truncate sm:whitespace-normal sm:line-clamp-1">{offer.offeredService}</span>
                                </div>
                            </div>
                        </div>

                        {/* Chevron / Mobile Actions - Pushed to the far left (End) */}
                        <div className="flex flex-col items-end justify-between h-full pl-1">
                            {/* Mobile Actions */}
                            <div className="flex flex-col gap-2 sm:hidden">
                                {onEdit && isOwner && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(offer);
                                        }}
                                        className="text-slate-400 hover:text-blue-500"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                )}
                                {onDelete && isOwner && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(window.confirm('האם למחוק את ההצעה?')) onDelete(offer.id);
                                        }}
                                        className="text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Desktop Actions */}
                            <div className="hidden sm:flex flex-col gap-1">
                                {onEdit && isOwner && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(offer);
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full"
                                        title="ערוך הצעה"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                )}
                                {onDelete && isOwner && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(window.confirm('האם למחוק את ההצעה?')) onDelete(offer.id);
                                        }}
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                        title="מחק הצעה"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="text-slate-400 mt-auto">
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2">
                    <div className="h-px bg-slate-100 mb-3 w-full"></div>
                    
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed bg-slate-50 p-3 rounded-lg">
                        {offer.description}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                         <div className="flex gap-2 flex-wrap">
                            {offer.tags.map(tag => (
                                <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                    #{tag}
                                </span>
                            ))}
                         </div>
                         <div className="w-full sm:w-auto flex justify-end">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onContact(offer.profile);
                                }}
                                disabled={isExpired}
                                className={`text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isExpired ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                {isExpired ? 'מודעה לא פעילה' : 'שלח הודעה'}
                            </button>
                         </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // Default Grid View Render
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full relative ${
        isLowRated ? 'opacity-80' : ''
    } ${isExpired ? 'opacity-75 bg-slate-50' : ''} ${isPending ? 'border-orange-300 ring-1 ring-orange-100' : ''}`}>
      
      {/* Tags Container (Duration + Recommended) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col items-end gap-1.5">
          {/* Duration Badge */}
          <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm ${
              isOngoing 
                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                : 'bg-orange-50 text-orange-700 border border-orange-100'
          }`}>
              {isOngoing ? <Repeat className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isOngoing ? 'ברטר מתמשך' : 'פרויקט חד פעמי'}
          </div>

          {/* Expired Badge */}
          {isExpired && (
              <div className="bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  פג תוקף
              </div>
          )}

          {/* Pending Badge */}
          {isPending && (
              <div className="group relative">
                  <div className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-help">
                      <EyeOff className="w-3 h-3" />
                      ממתין לאישור
                  </div>
                   <div className="absolute top-full mt-1 left-0 bg-slate-800 text-white text-[10px] p-2 rounded w-40 z-20 hidden group-hover:block leading-tight">
                        המודעה גלויה רק לך. תפורסם לאחר אישור מנהל.
                   </div>
              </div>
          )}

          {/* Deadline Badge */}
          {offer.expirationDate && !isExpired && (
             <div className="bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  עד: {new Date(offer.expirationDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
             </div>
          )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3 mt-1">
            <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onUserClick(offer.profile)}
            >
                <img 
                    src={offer.profile.avatarUrl} 
                    alt={offer.profile.name} 
                    className={`w-10 h-10 rounded-full object-cover border group-hover:border-brand-500 transition-colors ${isHighRated ? 'border-yellow-400' : 'border-slate-100'}`}
                />
                <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{offer.profile.name}</h4>
                    <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
                        {offer.profile.expertise}
                    </span>
                </div>
            </div>
            <div className="flex gap-2">
                
                {onEdit && isOwner && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(offer);
                        }}
                        className="text-slate-400 hover:text-blue-500 transition-colors"
                        title="ערוך הצעה"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                )}

                {onDelete && isOwner && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm('האם למחוק את ההצעה?')) onDelete(offer.id);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="מחק ההצעה"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>

        {/* Rating Row */}
        <div className="mb-2">
            {renderStars()}
        </div>

        <h3 className={`text-lg font-bold mb-3 leading-tight min-h-[3.5rem] pr-1 ${isExpired ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
            {offer.title}
        </h3>

        <div className="space-y-2 mb-3">
            <div className={`p-2.5 rounded-lg border ${isExpired ? 'bg-slate-100 border-slate-200' : 'bg-emerald-50 border-emerald-100'}`}>
                <span className={`block text-xs font-bold mb-1 ${isExpired ? 'text-slate-500' : 'text-emerald-600'}`}>נותן/ת:</span>
                <p className="text-sm text-slate-700 font-medium">{offer.offeredService}</p>
            </div>
            <div className={`p-2.5 rounded-lg border ${isExpired ? 'bg-slate-100 border-slate-200' : 'bg-indigo-50 border-indigo-100'}`}>
                <span className={`block text-xs font-bold mb-1 ${isExpired ? 'text-slate-500' : 'text-indigo-600'}`}>מבקש/ת:</span>
                <p className="text-sm text-slate-700 font-medium">{offer.requestedService}</p>
            </div>
        </div>

        {/* Scrollable Description Area */}
        <div className="h-20 overflow-y-auto mb-2 custom-scrollbar">
            <p className="text-sm text-slate-500 leading-relaxed">
                {offer.description}
            </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-2 mt-auto">
            {offer.tags.map(tag => (
                <span key={tag} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    #{tag}
                </span>
            ))}
        </div>
      </div>

      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-4">
         {/* Metadata (Right Side in RTL) */}
         <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {offer.location}
            </div>
            <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(offer.createdAt).toLocaleDateString('he-IL')}
            </div>
         </div>

         {/* Button (Left Side in RTL) */}
         <button 
            onClick={() => onContact(offer.profile)}
            disabled={isExpired}
            className={`text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${isExpired ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
         >
            <MessageCircle className="w-4 h-4" />
            {isExpired ? 'לא רלוונטי' : 'שלח הודעה'}
         </button>
      </div>
    </div>
  );
};