
import React from 'react';
import { X, MessageCircle, Search, Handshake, Bell } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-3xl w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">
                    איך זה עובד?
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
                            <Search className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-lg text-slate-900 mb-2">1. מוצאים הזדמנות</h4>
                        <p className="text-slate-600 text-sm font-light">
                            עוברים על הצעות הברטר בלוח, מסננים לפי תחום או מיקום, ומוצאים שירות שאתם צריכים בתמורה לכישורים שלכם.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center">
                         <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-4">
                            <Bell className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-lg text-slate-900 mb-2">2. שולחים התראה</h4>
                        <p className="text-slate-600 text-sm font-light">
                            לוחצים על "שלח הודעה" בכרטיס ההצעה. המערכת תשלח התראה מיידית (נוטיפיקציה) לצד השני על התעניינותכם.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center">
                         <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                            <Handshake className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-lg text-slate-900 mb-2">3. סוגרים עסקה</h4>
                        <p className="text-slate-600 text-sm font-light">
                            מתכתבים בצ'אט הפנימי, מסכמים את פרטי ההחלפה (מה נותנים ומה מקבלים) ויוצאים לדרך!
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-brand-600" />
                        איך מתנהל התהליך בפועל?
                    </h4>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">1</div>
                            <div>
                                <h5 className="font-bold text-slate-800">פנייה ראשונית</h5>
                                <p className="text-sm text-slate-600 font-light">
                                    כאשר משתמש מוצא הצעה שלך, הוא שולח הודעה. פעולה זו מייצרת התראה אצלך במערכת (סימן אדום על אייקון ההודעות).
                                </p>
                            </div>
                        </div>
                         <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">2</div>
                            <div>
                                <h5 className="font-bold text-slate-800">מענה וסיכום</h5>
                                <p className="text-sm text-slate-600 font-light">
                                    אתם נכנסים לאזור ההודעות, עונים לפנייה ומנהלים משא ומתן. זה הזמן להגדיר ציפיות ולוודא שהברטר הוגן לשני הצדדים.
                                </p>
                            </div>
                        </div>
                         <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">3</div>
                            <div>
                                <h5 className="font-bold text-slate-800">ביצוע הברטר</h5>
                                <p className="text-sm text-slate-600 font-light">
                                    לאחר הסיכום, כל צד מבצע את עבודתו. אין מעבר כספי, רק החלפת ערך מקצועי.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <button 
                        onClick={onClose}
                        className="bg-brand-600 text-white font-bold py-3 px-8 rounded-full hover:bg-brand-700 transition-colors shadow-sm"
                    >
                        הבנתי, בואו נתחיל!
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
