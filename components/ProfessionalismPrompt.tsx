
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-500" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="bg-brand-600 px-8 py-10 text-white text-center relative overflow-hidden">
            {/* Abstract Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-200 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10">
                <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 border border-white/30 shadow-inner">
                    <Award className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">
                    ההצעה שלך באוויר!
                </h3>
                <p className="text-brand-100 text-lg font-medium">
                    בוא נהפוך את הפרופיל שלך למגנט להצעות.
                </p>
            </div>
            
            <button onClick={onClose} className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors bg-white/10 p-2 rounded-full">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-8 sm:p-10 text-right space-y-8 bg-white">
            <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100">
                    <Sparkles className="w-3 h-3 fill-current" />
                    איכות מושכת איכות
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex gap-5 items-start">
                    <div className="bg-brand-50 p-3 rounded-2xl shrink-0 border border-brand-100 shadow-sm">
                        <UserCircle className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg mb-1">הרושם הראשוני קובע</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            ככל שהפרופיל שלך משדר יותר סמכות ומקצועיות, כך תקבל פניות לברטרים בשווי גבוה יותר. 
                        </p>
                    </div>
                </div>

                {/* Updated Checklist Section: Icons on the right, text next to them */}
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                    <p className="text-slate-800 font-bold text-base">מה כדאי להוסיף עכשיו?</p>
                    <ul className="space-y-5">
                        <li className="flex items-center gap-4 text-sm text-slate-600 font-medium">
                            <Camera className="w-6 h-6 text-brand-500 shrink-0" />
                            <span>תמונת פרופיל ברורה ומקצועית</span>
                        </li>
                        <li className="flex items-center gap-4 text-sm text-slate-600 font-medium">
                            <FileCheck className="w-6 h-6 text-brand-500 shrink-0" />
                            <span>תעודות הסמכה בתחום העיסוק</span>
                        </li>
                        <li className="flex items-center gap-4 text-sm text-slate-600 font-medium">
                            <Briefcase className="w-6 h-6 text-brand-500 shrink-0" />
                            <span>לינק לתיק עבודות או לאתר שלך</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="pt-2 flex flex-col gap-4">
                <button 
                    onClick={onEditProfile}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 px-8 rounded-2xl shadow-xl shadow-brand-200 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg group"
                >
                    לעריכת הפרופיל שלך עכשיו
                    <ArrowLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <button 
                    onClick={onClose}
                    className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors"
                >
                    אולי אחר כך, כרגע אני רק מסתכל
                </button>
            </div>
        </div>
        
        {/* Decorative Footer Progress */}
        <div className="h-1.5 w-full bg-slate-100 flex">
            <div className="h-full bg-brand-500 w-3/4"></div>
        </div>
      </div>
    </div>
  );
};
