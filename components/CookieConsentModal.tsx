
import React, { useState, useEffect } from 'react';
import { Cookie, X, Check, Ban, Sparkles, UserCheck, Target } from 'lucide-react';

export const CookieConsentModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('barter_cookie_consent');
    if (!consent) {
        // Small delay for better UX
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('barter_cookie_consent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('barter_cookie_consent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_-5px_30px_-5px_rgba(0,0,0,0.15)] border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        
        <div className="hidden md:flex bg-brand-100 p-4 rounded-full text-brand-600 shrink-0">
            <Cookie className="w-8 h-8" />
        </div>

        <div className="flex-1 text-right">
            <h4 className="font-bold text-slate-900 mb-2 text-lg">כדי שהאתר יתאים את עצמו אליך...</h4>
            <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                    כדי לספק לך חווית שימוש חכמה, האתר צריך "לזכור" מי אתה. אנו משתמשים ב-Cookies לא רק בשביל פרסומות, אלא כדי להבין את הצרכים שלך:
                </p>
                
                <div className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                        <UserCheck className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                        <span><strong>זיהוי משתמש:</strong> כדי שהמערכת תכיר אותך ותחסוך לך התחברות מחדש.</span>
                    </div>
                    <div className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                        <Target className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                        <span><strong>מקצוע ותחומי עניין:</strong> זיהוי ההעדפות שלך כדי להציג לך הצעות רלוונטיות.</span>
                    </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs sm:text-sm">
                    <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                            <strong>הסכמתך מאפשרת לנו להתאים לך את כל החוויה:</strong> החל מתוכן ההצעות שיוצג לך ועד לפרסומות שבאמת יעניינו אותך. זה המנוע שמאפשר לאתר ללמוד ולהציע לך ערך אמיתי.
                        </span>
                    </div>
                </div>
            </div>
            <div className="text-xs mt-3 text-slate-400">
                לפרטים נוספים: <a href="#" className="underline hover:text-brand-600 transition-colors">מדיניות פרטיות</a> ו<a href="#" className="underline hover:text-brand-600 transition-colors">תנאי שימוש</a>.
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
            <button 
                onClick={handleDecline}
                className="px-5 py-3 text-slate-500 hover:text-slate-800 text-sm font-medium hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
            >
                מעדיף חוויה בסיסית
            </button>
            <button 
                onClick={handleAccept}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm transition-transform active:scale-95 text-sm flex items-center justify-center gap-2"
            >
                מאשר התאמה אישית
                <Check className="w-4 h-4" />
            </button>
        </div>

        <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 left-2 text-slate-400 hover:text-slate-600 p-2 md:hidden"
        >
            <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
