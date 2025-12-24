
import React from 'react';
import { X, Sparkles, EyeOff, ArrowLeft, Zap, ShieldCheck } from 'lucide-react';

interface PostRegisterPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOffer: () => void;
  userName: string;
}

export const PostRegisterPrompt: React.FC<PostRegisterPromptProps> = ({ isOpen, onClose, onStartOffer, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-500" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-[400px] rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20 max-h-[90vh]">
        
        {/* Teal Header Section - Compact */}
        <div className="bg-[#14b8a6] px-6 py-6 text-white text-center relative shrink-0">
            <button onClick={onClose} className="absolute top-4 left-4 text-white/70 hover:text-white p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
            </button>
            
            <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/10">
                    <EyeOff className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black mb-1 tracking-tight">היי {userName.split(' ')[0]}, הפרופיל מוכן!</h3>
                <p className="text-white/90 text-xs font-medium">אבל כרגע... אף אחד לא יכול למצוא אותך.</p>
            </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-5 text-right space-y-5 bg-white flex-1 overflow-y-auto custom-scrollbar">
            
            {/* Item 1 - Icon on Left */}
            <div className="flex gap-4 items-start flex-row">
                <div className="bg-teal-50 p-2.5 rounded-xl shrink-0 border border-teal-100 shadow-sm order-1">
                    <ShieldCheck className="w-5 h-5 text-[#14b8a6]" />
                </div>
                <div className="flex-1 order-2">
                    <h4 className="font-bold text-slate-900 text-base mb-0.5">הפרופיל שלך "שקוף" לקהילה</h4>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium">הכישורים שלך מוצגים לאחרים רק דרך הצעות. ללא הצעה פעילה, לא ניתן לפנות אליך.</p>
                </div>
            </div>

            {/* Item 2 - Icon on Left */}
            <div className="flex gap-4 items-start flex-row">
                <div className="bg-amber-50 p-2.5 rounded-xl shrink-0 border border-amber-100 shadow-sm order-1">
                    <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 order-2">
                    <h4 className="font-bold text-slate-900 text-base mb-0.5">הפעל את ה-Matchmaker</h4>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium">פרסום ההצעה הראשונה יפעיל את אלגוריתם החיבורים שיציג אותך לאנשים הנכונים.</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-3">
                <button 
                    onClick={onStartOffer} 
                    className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 text-base transition-all active:scale-95 group"
                >
                    <ArrowLeft className="w-4 h-4 text-white/80" />
                    <span>פרסום הצעה ראשונה עכשיו</span>
                    <Sparkles className="w-4 h-4 text-white group-hover:animate-pulse" />
                </button>
                
                <button 
                    onClick={onClose} 
                    className="w-full text-slate-400 hover:text-slate-600 text-[11px] font-bold transition-colors mb-1"
                >
                    אולי אחר כך, אני רק רוצה להסתכל
                </button>
            </div>
        </div>

        {/* Progress bar at the very bottom */}
        <div className="h-1.5 w-full bg-slate-100 shrink-0 flex">
            <div className="h-full bg-slate-100 w-1/3"></div>
            <div className="h-full bg-[#14b8a6] flex-1 rounded-l-full"></div>
        </div>
      </div>
    </div>
  );
};
