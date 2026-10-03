
import React from 'react';
import { X, Check, Eye, MousePointer, Smartphone } from 'lucide-react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-3xl w-full">
            <div className="bg-teal-900 px-6 py-4 flex justify-between items-center text-white">
                <h3 className="text-xl font-bold">
                    הצהרת נגישות
                </h3>
                <button onClick={onClose} className="text-teal-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="p-8 text-slate-700 leading-relaxed overflow-y-auto max-h-[70vh]">
                <div className="mb-6">
                    <h4 className="text-lg font-bold text-teal-900 mb-3">מבוא</h4>
                    <p className="text-sm">
                        אתר Barter.org.il רואה חשיבות עליונה בהנגשת שירותיו לכלל האוכלוסייה, כולל אנשים עם מוגבלויות. 
                        אנו משקיעים משאבים רבים כדי להפוך את האתר לנגיש, נוח וידידותי לשימוש, בהתאם להוראות חוק שוויון זכויות לאנשים עם מוגבלות ותקנות הנגישות.
                    </p>
                </div>

                <div className="mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h4 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
                        <Check className="w-5 h-5 text-teal-600" />
                        רמת הנגישות באתר
                    </h4>
                    <p className="text-sm mb-4">
                        האתר עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג 2013.
                        ההתאמות בוצעו עפ"י המלצות התקן הישראלי (ת"י 5568) לנגישות תכנים באינטרנט ברמת AA ומסמך WCAG2.0 הבינלאומי.
                    </p>
                    
                    <ul className="space-y-3 text-sm">
                        <li className="flex gap-3">
                            <Smartphone className="w-5 h-5 text-teal-500 flex-shrink-0" />
                            <div>
                                <strong>תאימות לדפדפנים ומכשירים:</strong>
                                האתר מותאם לתצוגה במגוון מכשירים (מחשב נייח, טאבלט וסמארטפון) ונתמך ע"י הדפדפנים הנפוצים (Chrome, Safari, Edge, Firefox).
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <MousePointer className="w-5 h-5 text-teal-500 flex-shrink-0" />
                            <div>
                                <strong>ניווט מקלדת:</strong>
                                ניתן לנווט באתר באמצעות מקלדת בלבד (Tab למעבר בין רכיבים, Enter לבחירה, Esc ליציאה מחלונות).
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <Eye className="w-5 h-5 text-teal-500 flex-shrink-0" />
                            <div>
                                <strong>עיצוב ותוכן:</strong>
                                הצבעים באתר בעלי ניגודיות גבוהה, הטפסים נגישים לקוראי מסך, ולכל התמונות ישנו טקסט חלופי (Alt Text).
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="mb-6">
                    <h4 className="text-lg font-bold text-teal-900 mb-3">סייגים לנגישות</h4>
                    <p className="text-sm">
                        למרות מאמצנו להנגיש את כלל הדפים באתר, ייתכן ויתגלו חלקים שטרם הונגשו במלואם. 
                        אנו ממשיכים במאמצים לשפר את נגישות האתר כחלק ממחויבותנו לאפשר שימוש בו עבור כלל האוכלוסייה.
                    </p>
                </div>

                <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-lg font-bold text-teal-900 mb-3">פרטי רכז נגישות</h4>
                    <p className="text-sm mb-2">
                        אם נתקלתם בבעיה בנושא נגישות, נשמח לקבל מכם משוב כדי שנוכל לטפל בבעיה בהקדם.
                    </p>
                    <div className="bg-teal-50 p-4 rounded-lg inline-block text-sm text-teal-900">
                        <strong>שם:</strong> צוות התמיכה של Barter<br/>
                        <strong>אימייל:</strong> support@barter.org.il<br/>
                        <strong>טלפון:</strong> 050-1234567
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button 
                        onClick={onClose}
                        className="bg-teal-900 text-white font-bold py-3 px-10 rounded-full hover:bg-teal-800 transition-colors shadow-sm"
                    >
                        סגור הצהרה
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
