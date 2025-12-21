
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col">
        <div className="bg-brand-600 px-6 py-8 text-white text-center relative shrink-0">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner"><EyeOff className="w-8 h-8 text-white" /></div>
            <h3 className="text-xl sm:text-2xl font-black mb-1">היי {userName.split(' ')[0]}, הפרופיל מוכן!</h3>
            <p className="text-brand-100 font-medium text-sm">אבל כרגע... אף אחד לא יכול למצוא אותך.</p>
            <button onClick={onClose} className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors bg-white/10 p-2 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 sm:p-8 bg-white overflow-y-auto custom-scrollbar flex-1 space-y-6">
            <div className="flex gap-4 items-start">
                <div className="bg-brand-50 p-2.5 rounded-xl shrink-0"><ShieldCheck className="w-5 h-5 text-brand-600" /></div>
                <div><h4 className="font-bold text-slate-900 text-base mb-1">הפרופיל שלך "שקוף"</h4><p className="text-slate-600 text-sm leading-relaxed">המקצוע שלך מוצג לאחרים רק דרך הצעות שתפרסם. ללא הצעה פעילה, לא ניתן לפנות אליך.</p></div>
            </div>
            <div className="flex gap-4 items-start">
                <div className="bg-amber-50 p-2.5 rounded-xl shrink-0"><Zap className="w-5 h-5 text-amber-600" /></div>
                <div><h4 className="font-bold text-slate-900 text-base mb-1">הפעל את ה-Matchmaker</h4><p className="text-slate-600 text-sm leading-relaxed">פרסום ההצעה הראשונה יפעיל את אלגוריתם החיבורים שלנו ויציג אותך לאנשים רלוונטיים.</p></div>
            </div>
            <div className="pt-4 flex flex-col gap-3">
                <button onClick={onStartOffer} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"><Sparkles className="w-5 h-5" /> פרסום הצעה ראשונה <ArrowLeft className="w-4 h-4" /></button>
                <button onClick={onClose} className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors">אולי אחר כך, אני רק מסתכל</button>
            </div>
        </div>
      </div>
    </div>
  );
};
