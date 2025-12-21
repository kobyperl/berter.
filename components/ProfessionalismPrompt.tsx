
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col">
        <div className="bg-brand-600 px-6 py-8 text-white text-center relative shrink-0">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner"><Award className="w-8 h-8 text-white" /></div>
            <h3 className="text-xl sm:text-2xl font-black mb-1">ההצעה שלך באוויר!</h3>
            <p className="text-brand-100 font-medium text-sm">בוא נהפוך את הפרופיל שלך למגנט להצעות.</p>
            <button onClick={onClose} className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors bg-white/10 p-2 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 sm:p-8 bg-white overflow-y-auto custom-scrollbar flex-1 space-y-6">
            <div className="text-center"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold border border-brand-100 uppercase tracking-wider"><Sparkles className="w-3 h-3" /> איכות מושכת איכות</div></div>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-5">
                <p className="text-slate-800 font-bold text-sm text-center">מה כדאי להוסיף עכשיו?</p>
                <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-xs text-slate-600 font-bold"><Camera className="w-5 h-5 text-brand-500 shrink-0" /> תמונת פרופיל ברורה</li>
                    <li className="flex items-center gap-3 text-xs text-slate-600 font-bold"><FileCheck className="w-5 h-5 text-brand-500 shrink-0" /> תעודות הסמכה מקצועיות</li>
                    <li className="flex items-center gap-3 text-xs text-slate-600 font-bold"><Briefcase className="w-5 h-5 text-brand-500 shrink-0" /> לינק לתיק עבודות / אתר</li>
                </ul>
            </div>
            <div className="pt-2 flex flex-col gap-3">
                <button onClick={onEditProfile} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-lg">שדרוג הפרופיל עכשיו <ArrowLeft className="w-5 h-5" /></button>
                <button onClick={onClose} className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors">אולי אחר כך, תודה</button>
            </div>
        </div>
      </div>
    </div>
  );
};
