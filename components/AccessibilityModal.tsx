
import React from 'react';
import { X, Check, Eye, MousePointer, Smartphone } from 'lucide-react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all w-full max-w-3xl relative z-10 max-h-[92vh] flex flex-col">
            <div className="bg-teal-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
                <h3 className="text-xl font-bold">הצהרת נגישות</h3>
                <button onClick={onClose} className="text-teal-200 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 sm:p-8 text-slate-700 leading-relaxed overflow-y-auto custom-scrollbar flex-1">
                <div className="mb-6">
                    <h4 className="text-lg font-bold text-teal-900 mb-3">מבוא</h4>
                    <p className="text-sm">אתר Barter.org.il רואה חשיבות עליונה בהנגשת שירותיו לכלל האוכלוסייה, כולל אנשים עם מוגבלויות.</p>
                </div>
                <div className="mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                    <h4 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-teal-600" /> רמת הנגישות</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li className="flex gap-3"><Smartphone className="w-5 h-5 text-teal-500 shrink-0" /><div><strong>תצוגה במכשירים:</strong> האתר מותאם למחשב, טאבלט וסמארטפון.</div></li>
                        <li className="flex gap-3"><MousePointer className="w-5 h-5 text-teal-500 shrink-0" /><div><strong>ניווט מקלדת:</strong> ניתן לנווט באתר באמצעות המקלדת בלבד.</div></li>
                        <li className="flex gap-3"><Eye className="w-5 h-5 text-teal-500 shrink-0" /><div><strong>עיצוב וניגודיות:</strong> הצבעים בעלי ניגודיות גבוהה והטפסים נגישים.</div></li>
                    </ul>
                </div>
                <div className="mt-8 text-center">
                    <button onClick={onClose} className="bg-teal-900 text-white font-bold py-3 px-10 rounded-xl hover:bg-teal-800 transition-colors shadow-md w-full sm:w-auto">סגור הצהרה</button>
                </div>
            </div>
        </div>
    </div>
  );
};
