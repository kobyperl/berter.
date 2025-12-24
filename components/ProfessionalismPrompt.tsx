
import React from 'react';
import { X, Award, Camera, FileCheck, ArrowLeft, UserCircle, Briefcase, Sparkles } from 'lucide-react';

interface ProfessionalismPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile: () => void;
}

export const ProfessionalismPrompt: React.FC<ProfessionalismPromptProps> = ({ isOpen, onClose, onEditProfile }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-500" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        <div className="bg-brand-600 px-6 py-5 text-white text-center relative shrink-0">
            <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black mb-0.5">ההצעה שלך באוויר!</h3>
                <p className="text-brand-100 text-xs font-medium">בוא נהפוך את הפרופיל שלך למגנט להצעות.</p>
            </div>
            <button onClick={onClose} className="absolute top-4 left-4 text-white/40 hover:text-white p-1.5 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 sm:p-6 text-right space-y-4 bg-white overflow-y-auto custom-scrollbar">
            <div className="text-center"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold border border-brand-100 uppercase tracking-wide"><Sparkles className="w-3 h-3 fill-current" /> איכות מושכת איכות</div></div>

            <div className="space-y-4">
                <div className="flex gap-3.5 items-start">
                    <div className="bg-brand-50 p-2.5 rounded-xl shrink-0 border border-brand-100 shadow-sm"><UserCircle className="w-5 h-5 text-brand-600" /></div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm mb-0.5">הרושם הראשוני קובע</h4>
                        <p className="text-slate-600 text-[11px] leading-relaxed">ככל שהפרופיל שלך משדר יותר סמכות, כך תקבל פניות לברטרים בשווי גבוה יותר.</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-slate-800 font-bold text-[12px]">מה כדאי להוסיף עכשיו?</p>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2.5 text-[11px] text-slate-600 font-medium"><Camera className="w-3.5 h-3.5 text-brand-500 shrink-0" /><span>תמונת פרופיל ברורה ומקצועית</span></li>
                        <li className="flex items-center gap-2.5 text-[11px] text-slate-600 font-medium"><FileCheck className="w-3.5 h-3.5 text-brand-500 shrink-0" /><span>תעודות הסמכה או המלצות</span></li>
                        <li className="flex items-center gap-2.5 text-[11px] text-slate-600 font-medium"><Briefcase className="w-3.5 h-3.5 text-brand-500 shrink-0" /><span>לינק לתיק עבודות או לאתר</span></li>
                    </ul>
                </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
                <button onClick={onEditProfile} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm group transition-transform active:scale-95">לעריכת הפרופיל שלך עכשיו <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /></button>
                <button onClick={onClose} className="w-full py-1 text-slate-400 hover:text-slate-600 text-[10px] font-bold">אולי אחר כך, כרגע אני רק מסתכל</button>
            </div>
        </div>
        <div className="h-1.5 w-full bg-slate-100 shrink-0"><div className="h-full bg-brand-500 w-3/4"></div></div>
      </div>
    </div>
  );
};
