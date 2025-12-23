
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
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity animate-in fade-in duration-500" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="bg-brand-600 px-8 py-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-200 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
                <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 border border-white/30 shadow-inner">
                    <EyeOff className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">
                    היי {userName.split(' ')[0]}, הפרופיל מוכן!
                </h3>
                <p className="text-brand-100 text-lg font-medium">
                    אבל כרגע... אף אחד לא יכול למצוא אותך.
                </p>
            </div>
            
            <button onClick={onClose} className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors bg-white/10 p-2 rounded-full">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-8 sm:p-10 text-right space-y-6 bg-white">
            <div className="flex gap-5 items-start">
                <div className="bg-brand-50 p-3 rounded-2xl shrink-0 shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">הפרופיל שלך "שקוף" לקהילה</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        ב-Barter.org.il, המקצוע והכישורים שלך מוצגים לאחרים <strong>אך ורק דרך הצעות שאתה מפרסם</strong>. ללא הצעה פעילה, לא ניתן לפנות אליך בפרטי או להציע לך עסקאות.
                    </p>
                </div>
            </div>

            <div className="flex gap-5 items-start">
                <div className="bg-amber-50 p-3 rounded-2xl shrink-0 shadow-sm">
                    <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">הפעל את ה-Matchmaker</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        פרסום ההצעה הראשונה יפעיל את אלגוריתם החיבורים שלנו, שיציג אותך לאנשים שמחפשים בדיוק את מה שיש לך להציע.
                    </p>
                </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
                <button 
                    onClick={onStartOffer}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 px-8 rounded-2xl shadow-xl shadow-brand-200 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg group"
                >
                    <Sparkles className="w-6 h-6 group-hover:animate-spin" />
                    פרסום הצעה ראשונה עכשיו
                    <ArrowLeft className="w-5 h-5 mr-1" />
                </button>
                
                <button 
                    onClick={onClose}
                    className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors"
                >
                    אולי אחר כך, אני רק רוצה להסתכל
                </button>
            </div>
        </div>
        
        <div className="h-2 w-full bg-slate-100 flex">
            <div className="h-full bg-brand-500 w-2/3 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
        </div>
      </div>
    </div>
  );
};
