
import React from 'react';
import { X, Shield, Lock, Eye } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-4xl w-full">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-xl font-bold">מדיניות פרטיות</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="p-8 text-slate-700 leading-relaxed overflow-y-auto max-h-[75vh] space-y-6 text-sm">
                
                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">1. כללי</h4>
                    <p>
                        אתר Barter.org.il (להלן: "האתר") מכבד את פרטיות המשתמשים בו. מטרת מדיניות זו היא להסביר מהם נוהגי האתר ביחס לפרטיות המשתמשים, וכיצד אנו משתמשים במידע הנמסר לנו על-ידי המשתמשים או הנאסף על-ידנו בעת השימוש באתר.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">2. רישום ומסירת מידע</h4>
                    <p>
                        חלק מהשירותים באתר טעונים הרשמה. במסגרת ההרשמה תידרש למסור מידע אישי, כגון שמך, כתובת הדואר האלקטרוני שלך, תחום עיסוקך ותחומי עניין. השדות שחובה למלא יסומנו במפורש. ללא מסירת הנתונים המתבקשים בשדות החובה לא תוכל להירשם לשירותים הטעונים רישום.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">3. מאגר המידע והשימוש בו</h4>
                    <p>
                        הנתונים שתמסור בעת ההרשמה יישמרו במאגר המידע של האתר. האתר יעשה שימוש במידע זה בהתאם להוראות החוק ולמטרות הבאות:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                        <li>כדי לאפשר לך להשתמש בשירותים שונים באתר (כגון פרסום הצעות ויצירת קשר עם משתמשים אחרים).</li>
                        <li>לצורך שיפור והעשרת השירותים והתכנים המוצעים באתר.</li>
                        <li>לצורך התאמת המודעות והתכנים שיוצגו בעת הביקור באתר לתחומי ההתעניינות שלך.</li>
                        <li>ליצירת קשר איתך במקרה הצורך (למשל: עדכונים על הודעות חדשות).</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">4. מסירת מידע לצד שלישי</h4>
                    <p>
                        אנו מתחייבים שלא להעביר לצדדים שלישיים את פרטיך האישיים והמידע שנאסף על פעילותך באתר, אלא במקרים הבאים:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                        <li>במקרה של מחלוקת משפטית בינך לבין האתר הדורשת חשיפת פרטיך.</li>
                        <li>אם תבצע באתר פעולות שבניגוד לדין.</li>
                        <li>אם יתקבל צו שיפוטי המורה למסור את פרטיך או המידע אודותיך לצד שלישי.</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">5. Cookies (עוגיות)</h4>
                    <p>
                        האתר משתמש ב"עוגיות" (Cookies) לצורך תפעולו השוטף והתקין, ובכלל זה כדי לאסוף נתונים סטטיסטיים אודות השימוש באתר, לאימות פרטים, כדי להתאים את האתר להעדפותיך האישיות ולצורכי אבטחת מידע.
                        <br/>
                        דפדפנים מודרניים מאפשרים להימנע מקבלת Cookies. אם אינך יודע כיצד לעשות זאת, בדוק בקובץ העזרה של הדפדפן שבו אתה משתמש.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">6. אבטחת מידע</h4>
                    <p>
                        האתר מיישם מערכות ונהלים עדכניים לאבטחת מידע. בעוד שמערכות ונהלים אלה מצמצמים את הסיכונים לחדירה בלתי-מורשית, אין הם מעניקים ביטחון מוחלט. לכן, אנו לא מתחייבים ששירותי האתר יהיו חסינים באופן מוחלט מפני גישה בלתי-מורשית למידע המאוחסן בהם.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-2">7. זכות לעיון במידע</h4>
                    <p>
                        על-פי חוק הגנת הפרטיות, התשמ"א - 1981, כל אדם זכאי לעיין במידע שעליו המוחזק במאגר מידע. אדם שעיין במידע שעליו ומצא כי אינו נכון, שלם, ברור או מעודכן, רשאי לפנות לבעל מאגר המידע בבקשה לתקן את המידע או למוחקו.
                    </p>
                </div>

                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mt-4">
                    <h4 className="font-bold text-slate-900 mb-1">יצירת קשר</h4>
                    <p>
                        בכל שאלה בנוגע למדיניות פרטיות זו, ניתן לפנות אלינו בכתובת המייל: <a href="mailto:privacy@barter.org.il" className="text-brand-600 font-bold hover:underline">privacy@barter.org.il</a>
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
