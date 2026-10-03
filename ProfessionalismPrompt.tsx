
import React from 'react';
import { X, Award, Camera, ArrowLeft, UserCircle, Sparkles, ShieldCheck, Link } from 'lucide-react';

interface ProfessionalismPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  userName: string;
}

export const ProfessionalismPrompt: React.FC<ProfessionalismPromptProps> = ({ isOpen, onClose, onEditProfile, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-500" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-[420px] rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20 max-h-[90vh]">
        
        {/* Teal Header Section - Compact */}
        <div className="bg-[#14b8a6] px-6 py-6 text-white text-center relative shrink-0">
            <button onClick={onClose} className="absolute top-4 left-4 text-white/70 hover:text-white p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
            </button>
            
            <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/10">
                    <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black mb-1 tracking-tight">היי {userName.split(' ')[0]}, ההצעה שלך באוויר!</h3>
                <p className="text-white/90 text-xs font-medium">בוא נהפוך את הפרופיל שלך למגנט להצעות.</p>
            </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-5 text-right space-y-5 bg-white flex-1 overflow-y-auto custom-scrollbar">
            
            {/* Quality Badge */}
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-[#14b8a6] text-[10px] font-bold border border-brand-100 shadow-sm">
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>איכות מושכת איכות</span>
                </div>
            </div>

            {/* Main Info - Icon on Left */}
            <div className="flex gap-4 items-start flex-row">
                <div className="bg-teal-50 p-2.5 rounded-xl shrink-0 border border-teal-100 shadow-sm order-1">
                    <UserCircle className="w-5 h-5 text-[#14b8a6]" />
                </div>
                <div className="flex-1 order-2">
                    <h4 className="font-bold text-slate-900 text-base mb-0.5">הרושם הראשוני קובע</h4>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium">ככל שהפרופיל שלך משדר יותר סמכות, כך תקבל פניות לברטרים בשווי גבוה יותר.</p>
                </div>
            </div>

            {/* Checklist Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-slate-800 font-bold text-xs">מה כדאי להוסיף עכשיו?</p>
                <ul className="space-y-2">
                    <li className="flex items-center gap-3 flex-row text-slate-600">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm order-1"><Camera className="w-3.5 h-3.5 text-[#14b8a6]" /></div>
                        <span className="text-xs font-medium order-2 flex-1">תמונת פרופיל ברורה ומקצועית</span>
                    </li>
                    <li className="flex items-center gap-3 flex-row text-slate-600">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm order-1"><ShieldCheck className="w-3.5 h-3.5 text-[#14b8a6]" /></div>
                        <span className="text-xs font-medium order-2 flex-1">תעודות הסמכה או המלצות</span>
                    </li>
                    <li className="flex items-center gap-3 flex-row text-slate-600">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm order-1"><Link className="w-3.5 h-3.5 text-[#14b8a6]" /></div>
                        <span className="text-xs font-medium order-2 flex-1">לינק לתיק עבודות או לאתר</span>
                    </li>
                </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col gap-3">
                <button 
                    onClick={onEditProfile} 
                    className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 text-base transition-all active:scale-95 group"
                >
                    <ArrowLeft className="w-4 h-4 text-white/80 group-hover:-translate-x-1 transition-transform" />
                    <span>לעריכת הפרופיל שלך עכשיו</span>
                </button>
                
                <button 
                    onClick={onClose} 
                    className="w-full text-slate-400 hover:text-slate-600 text-[11px] font-bold transition-colors mb-1"
                >
                    אולי אחר כך, כרגע אני רק מסתכל
                </button>
            </div>
        </div>

        {/* Progress bar at the bottom */}
        <div className="h-1.5 w-full bg-slate-100 shrink-0 flex">
            <div className="h-full bg-slate-100 w-1/4"></div>
            <div className="h-full bg-[#14b8a6] flex-1 rounded-l-full"></div>
        </div>
      </div>
    </div>
  );
};
