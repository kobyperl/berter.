
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity animate-in fade-in duration-500" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        <div className="bg-brand-600 px-6 py-5 text-white text-center relative shrink-0">
            <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                    <EyeOff className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black mb-0.5">היי {userName.split(' ')[0]}, הפרופיל מוכן!</h3>
                <p className="text-brand-100 text-xs font-medium">אבל כרגע... אף אחד לא יכול למצוא אותך.</p>
            </div>
            <button onClick={onClose} className="absolute top-4 left-4 text-white/60 hover:text-white p-1.5 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 sm:p-6 text-right space-y-4 bg-white overflow-y-auto custom-scrollbar">
            <div className="flex gap-3.5 items-start">
                <div className="bg-brand-50 p-2.5 rounded-xl shrink-0 shadow-sm"><ShieldCheck className="w-5 h-5 text-brand-600" /></div>
                <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-0.5">הפרופיל שלך "שקוף" לקהילה</h4>
                    <p className="text-slate-600 text-[11px] leading-relaxed">הכישורים שלך מוצגים לאחרים רק דרך הצעות. ללא הצעה פעילה, לא ניתן לפנות אליך.</p>
                </div>
            </div>

            <div className="flex gap-3.5 items-start">
                <div className="bg-amber-50 p-2.5 rounded-xl shrink-0 shadow-sm"><Zap className="w-5 h-5 text-amber-600" /></div>
                <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-0.5">הפעל את ה-Matchmaker</h4>
                    <p className="text-slate-600 text-[11px] leading-relaxed">פרסום ההצעה הראשונה יפעיל את אלגוריתם החיבורים שיציג אותך לאנשים הנכונים.</p>
                </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
                <button onClick={onStartOffer} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm transition-transform active:scale-95 group"><Sparkles className="w-4 h-4 group-hover:animate-spin" /> פרסום הצעה ראשונה עכשיו <ArrowLeft className="w-4 h-4 mr-1" /></button>
                <button onClick={onClose} className="w-full py-1 text-slate-400 hover:text-slate-600 text-[10px] font-bold">אולי אחר כך, אני רק רוצה להסתכל</button>
            </div>
        </div>
        <div className="h-1.5 w-full bg-slate-100 shrink-0"><div className="h-full bg-brand-500 w-2/3"></div></div>
      </div>
    </div>
  );
};
