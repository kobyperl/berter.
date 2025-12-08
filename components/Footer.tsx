
import React from 'react';
import { ShieldCheck, Lock, Facebook, Instagram, Linkedin, Send, AlertTriangle, Accessibility } from 'lucide-react';

interface FooterProps {
    onOpenAccessibility?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAccessibility }) => {
  return (
    // Changed bg-black to bg-teal-900 for the "Mint Style" requested
    <footer className="bg-teal-900 text-teal-100 border-t border-teal-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Top Warning / Disclaimer Banner */}
        <div className="bg-teal-950/40 p-4 rounded-xl border border-teal-800/50 mb-10 text-xs sm:text-sm text-teal-200 leading-relaxed flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
                <span className="font-bold text-teal-100 block mb-1">הבהרה משפטית חשובה:</span>
                האתר "Barter.org.il" משמש כפלטפורמה טכנולוגית לחיבור בין צדדים בלבד. הנהלת האתר אינה צד לעסקאות, אינה אחראית לטיב השירותים, לאמינות המשתמשים או לכל נזק שייגרם כתוצאה מהתקשרות בין הצדדים. האחריות הבלעדית על ביצוע העסקאות, הדיווח לרשויות המס וההתנהלות המקצועית חלה על המשתמשים בלבד.
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Column 1: Regulation & Legal */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-bold border-b border-teal-700 pb-2 inline-block">
              רגולציה ומשפט
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">תקנון ותנאי שימוש</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">מדיניות פרטיות (Privacy Policy)</a>
              </li>
              <li>
                <button onClick={onOpenAccessibility} className="hover:text-white transition-colors text-right">הצהרת נגישות</button>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">מדיניות ביטול עסקה</a>
              </li>
            </ul>
            
            <div className="mt-6 text-xs text-teal-300 bg-teal-950/50 p-3 rounded-lg border border-teal-800">
                <span className="block font-bold text-teal-200 mb-1">מדיניות פרסום ודאטה:</span>
                האתר עושה שימוש בקבצי "Cookies" ובמידע הנאסף על המשתמשים (כגון תחומי עניין ומקצוע) לצורך הצגת פרסומות מותאמות אישית (Targeted Ads) ושיפור חווית הגלישה. הגלישה באתר מהווה הסכמה למדיניות זו.
            </div>
          </div>

          {/* Column 2: Security (Trust Indicators) */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-bold border-b border-teal-700 pb-2 inline-block">
              אבטחת מידע
            </h3>
            <p className="text-sm text-teal-200">
              אנו פועלים על פי התקנים המחמירים ביותר לאבטחת מידע ושמירה על פרטיות המשתמשים.
            </p>
            
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/30">
                <Lock className="w-4 h-4" />
                <span>SSL Secured Connection</span>
            </div>
          </div>

          {/* Column 3: Social & Community */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-bold border-b border-teal-700 pb-2 inline-block">
              קהילה ועדכונים
            </h3>
            <p className="text-sm text-teal-200">
              הצטרפו לאלפי פרילנסרים שכבר חוסכים הוצאות. הירשמו לניוזלטר שלנו:
            </p>
            
            <div className="flex gap-2">
                <input 
                    type="email" 
                    placeholder="האימייל שלך..." 
                    className="bg-teal-950/50 border border-teal-800 text-white text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:border-teal-500 transition-colors placeholder-teal-700"
                />
                <button className="bg-teal-800 hover:bg-teal-700 text-white p-2 rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-4 pt-4 mt-auto">
                <a href="#" className="bg-teal-800 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-colors text-teal-300 border border-teal-700">
                    <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="bg-teal-800 p-2 rounded-full hover:bg-pink-600 hover:text-white transition-colors text-teal-300 border border-teal-700">
                    <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="bg-teal-800 p-2 rounded-full hover:bg-blue-700 hover:text-white transition-colors text-teal-300 border border-teal-700">
                    <Linkedin className="w-5 h-5" />
                </a>
            </div>
          </div>

        </div>

        <div className="border-t border-teal-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-teal-400">
            <p>© {new Date().getFullYear()} Barter.org.il - כל הזכויות שמורות.</p>
            <div className="flex gap-4 mt-4 md:mt-0 items-center">
                <a href="#" className="hover:text-white transition-colors">תקנון האתר</a>
                <span className="text-teal-700">|</span>
                <button onClick={onOpenAccessibility} className="hover:text-white transition-colors flex items-center gap-1">
                    <Accessibility className="w-3 h-3" />
                    הסדרי נגישות
                </button>
                <span className="text-teal-700">|</span>
                <a href="#" className="hover:text-white transition-colors">צור קשר</a>
            </div>
        </div>
      </div>
    </footer>
  );
};
