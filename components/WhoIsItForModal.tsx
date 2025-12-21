
import React from 'react';
import { X, Users, ArrowLeft, Briefcase, Baby, Music, GraduationCap } from 'lucide-react';

interface WhoIsItForModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const WhoIsItForModal: React.FC<WhoIsItForModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all w-full max-w-3xl relative z-10 max-h-[92vh] flex flex-col">
            <div className="bg-brand-600 px-6 py-6 text-white relative shrink-0">
                <button onClick={onClose} className="absolute top-4 left-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"><X className="w-6 h-6" /></button>
                <div className="flex justify-center mb-4"><div className="bg-white/20 p-4 rounded-full"><Users className="w-10 h-10 text-white" /></div></div>
                <h3 className="text-2xl font-black text-center">למי הקהילה מתאימה?</h3>
            </div>
            
            <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
                <p className="text-lg text-slate-600 font-medium text-center mb-8 leading-relaxed max-w-2xl mx-auto">
                    הפלטפורמה נוענה לכל מי שיש לו ידע, מקצוע או כישרון, ורוצה לקבל ערך חדש תמורתם.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600" /> דיגיטל ועסקים</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">בונים אתרים, מעצבים, יועצים ורואי חשבון שרוצים לחסוך הוצאות תפעול.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Baby className="w-5 h-5 text-pink-500" /> בריאות ומשפחה</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">מאמנים, מטפלים, יועצות שינה ומדריכות הורים שרוצים שירותים עסקיים.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-amber-500" /> יוצרי תוכן והוראה</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">מורים פרטיים, מרצים ומנחי סדנאות המעוניינים להחליף ידע בשירותים.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Music className="w-5 h-5 text-purple-500" /> כישרונות ותחביבים</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">יש לכם כישרון מיוחד? למשל: רופאה שמלמדת פסנתר תמורת שיעורי סינית.</p>
                    </div>
                </div>

                <div className="bg-brand-50 rounded-xl p-4 border border-brand-100 text-center mb-8">
                    <p className="text-brand-800 font-bold text-sm">"הכסף הכי טוב הוא הכישרון שכבר יש לכם בידיים"</p>
                </div>

                <div className="mt-4 text-center">
                    <button onClick={() => { onClose(); onOpenAuth(); }} className="bg-slate-900 text-white font-bold py-4 px-10 rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto w-full sm:w-auto">הרשמה והצטרפות עכשיו <ArrowLeft className="w-5 h-5 mr-1" /></button>
                </div>
            </div>
        </div>
    </div>
  );
};
