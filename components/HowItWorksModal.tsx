
import React from 'react';
import { X, MessageCircle, Search, Handshake, Bell } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all w-full max-w-3xl relative z-10 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                <h3 className="text-lg font-extrabold text-slate-800">איך זה עובד?</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 sm:p-8 bg-white overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white border border-brand-100 rounded-full flex items-center justify-center text-brand-600 mb-4 shadow-sm"><Search className="w-8 h-8" /></div>
                        <h4 className="font-bold text-lg text-slate-900 mb-2">1. מוצאים הזדמנות</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">מסננים את לוח הברטר לפי תחום או מיקום, ומוצאים שירות שמתאים בדיוק לצורך שלכם.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                         <div className="w-16 h-16 bg-white border border-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4 shadow-sm"><Bell className="w-8 h-8" /></div>
                        <h4 className="font-bold text-lg text-slate-900 mb-2">2. יוצרים קשר</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">לוחצים על "שלח הודעה" בכרטיס ההצעה. המערכת תשלח התראה מיידית לצד השני.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                         <div className="w-16 h-16 bg-white border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-sm"><Handshake className="w-8 h-8" /></div>
                        <h4 className="font-bold text-lg text-slate-900 mb-2">3. סוגרים ברטר</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">מתכתבים בצ'אט הפנימי, מסכמים את פרטי ההחלפה (ערך מול ערך) ויוצאים לדרך!</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-5 flex items-center gap-2 text-lg">
                        <MessageCircle className="w-6 h-6 text-brand-600" />
                        התהליך בפועל
                    </h4>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center font-bold text-brand-600">1</div>
                            <div>
                                <h5 className="font-bold text-slate-800">פנייה וזיהוי צורך</h5>
                                <p className="text-sm text-slate-600 mt-1">משתמש שולח לך הודעה ומייצר התראה מיידית באייקון ההודעות במערכת.</p>
                            </div>
                        </div>
                         <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center font-bold text-brand-600">2</div>
                            <div>
                                <h5 className="font-bold text-slate-800">סיכום תנאי החלפה</h5>
                                <p className="text-sm text-slate-600 mt-1">זה הזמן להגדיר ציפיות, לו"ז וערך עבודה, כדי לוודא שהברטר הוגן לשני הצדדים.</p>
                            </div>
                        </div>
                         <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center font-bold text-brand-600">3</div>
                            <div>
                                <h5 className="font-bold text-slate-800">ביצוע הברטר</h5>
                                <p className="text-sm text-slate-600 mt-1">אין מעבר כספי - כל צד מבצע את העבודה על הצד הטוב ביותר.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <button onClick={onClose} className="bg-brand-600 text-white font-bold py-4 px-10 rounded-xl hover:bg-brand-700 transition-all shadow-lg active:scale-95 w-full sm:w-auto">הבנתי, בואו נתחיל!</button>
                </div>
            </div>
        </div>
    </div>
  );
};
