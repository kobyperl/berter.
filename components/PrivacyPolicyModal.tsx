
import React from 'react';
import { X, Shield } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all w-full max-w-4xl relative z-10 max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3"><Shield className="w-6 h-6 text-emerald-400" /><h3 className="text-lg font-bold">מדיניות פרטיות</h3></div>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 sm:p-8 text-slate-700 leading-relaxed overflow-y-auto custom-scrollbar flex-1 space-y-6 text-sm">
                <div><h4 className="font-bold text-base text-slate-900 mb-2">1. כללי</h4><p>אתר Barter.org.il מכבד את פרטיות המשתמשים. המטרה היא להסביר את נוהגי האתר וכיצד אנו משתמשים במידע.</p></div>
                <div><h4 className="font-bold text-base text-slate-900 mb-2">2. רישום ומסירת מידע</h4><p>ההרשמה טעונה מסירת מידע אישי בסיסי כגון שם, אימייל ותחום עיסוק לצורך מתן השירותים.</p></div>
                <div><h4 className="font-bold text-base text-slate-900 mb-2">3. מאגר המידע</h4><p>הנתונים נשמרים במאגר לצורך שיפור השירות, התאמת הצעות ויצירת קשר במקרה הצורך.</p></div>
                <div><h4 className="font-bold text-base text-slate-900 mb-2">4. Cookies</h4><p>אנו משתמשים ב-Cookies לצורך תפעול תקין, איסוף נתונים סטטיסטיים ואבטחת מידע.</p></div>
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mt-4 text-center"><p>בכל שאלה ניתן לפנות לכתובת: <a href="mailto:privacy@barter.org.il" className="text-brand-600 font-bold hover:underline">privacy@barter.org.il</a></p></div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-center shrink-0">
                <button onClick={onClose} className="bg-slate-900 text-white font-bold py-3 px-12 rounded-xl hover:bg-slate-800 transition-colors shadow-md w-full sm:w-auto">קראתי והבנתי</button>
            </div>
        </div>
    </div>
  );
};
