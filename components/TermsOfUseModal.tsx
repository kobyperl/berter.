
import React from 'react';
import { X, FileText, AlertTriangle } from 'lucide-react';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-4xl w-full">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-xl font-bold">תקנון ותנאי שימוש</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="p-8 text-slate-700 leading-relaxed overflow-y-auto max-h-[75vh] space-y-6 text-sm">
                
                <div className="bg-amber-50 border-r-4 border-amber-500 p-5 rounded-lg">
                    <h4 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        הנחיות לתוכן חזותי וקוד לבוש
                    </h4>
                    <p className="font-bold mb-2">לתשומת לבכם:</p>
                    <p className="mb-2">
                        כדי להבטיח חשיפה מקסימלית של הפרופיל שלכם לכלל המשתמשים (הכוללים גם גולשים המשתמשים בשירותי סינון אינטרנט שונים), יש להעלות תמונות בלבוש מלא והולם בלבד.
                    </p>
                    <p className="mb-2">
                        תמונות שאינן עומדות בסטנדרט המקצועי הזה עלולות להיחסם באופן אוטומטי על ידי ספקי הסינון, ובכך לפגוע בחשיפה שלכם ובנגישות האתר כולו עבור קהל יעד נרחב.
                    </p>
                    <p>
                        הנהלת האתר שומרת לעצמה את הזכות להסיר כל תוכן חזותי המועלה לאתר שאינו עומד בכללים אלו, וזאת על מנת לשמור על זמינותו המלאה של האתר לכלל משתמשי הפלטפורמה.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">1. מבוא</h4>
                    <p>
                        ברוכים הבאים לאתר Barter.org.il. השימוש באתר ובשירותים המוצעים בו כפוף לתנאים המפורטים להלן. עצם השימוש באתר מהווה הסכמה לתנאים אלה.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">2. השירותים</h4>
                    <p>
                        האתר משמש כפלטפורמה המקשרת בין נותני שירותים לצורך ביצוע עסקאות ברטר (סחר חליפין). הנהלת האתר אינה צד לעסקאות הנרקמות בין המשתמשים ואינה אחראית לטיב השירותים, אמינותם או חוקיותם.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">3. אחריות המשתמש</h4>
                    <p>
                        המשתמש מתחייב להשתמש באתר למטרות חוקיות בלבד. חל איסור על העלאת תכנים פוגעניים, שקריים או מפירים זכויות יוצרים. המשתמש אחראי בלעדית לכל אינטראקציה או עסקה שהוא מבצע דרך האתר.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">4. קניין רוחני</h4>
                    <p>
                        כל זכויות הקניין הרוחני באתר, לרבות עיצובו, קוד המקור והתכנים המועלים ע"י הנהלת האתר, שמורות ל-Barter.org.il. אין להעתיק או לעשות שימוש מסחרי ללא אישור.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">5. שינויים בתקנון</h4>
                    <p>
                        הנהלת האתר רשאית לעדכן את תנאי השימוש מעת לעת. הנוסח המחייב הוא זה המפורסם באתר במועד השימוש.
                    </p>
                </div>

            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-center">
                <button 
                    onClick={onClose}
                    className="bg-slate-900 text-white font-bold py-2.5 px-12 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                    קראתי והבנתי
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
