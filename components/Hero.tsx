
import React from 'react';
import { Wallet, Users, TrendingUp } from 'lucide-react';

interface HeroProps {
    onOpenWhoIsItFor?: () => void;
    onOpenSearchTips?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenWhoIsItFor, onOpenSearchTips }) => {
  return (
    <div className="relative bg-white overflow-hidden flex flex-col lg:flex-row border-b border-slate-100 min-h-[600px]">
      
      {/* Right Side (Text Content) - 55% Width */}
      <div className="w-full lg:w-[55%] bg-white z-20 flex flex-col justify-center relative order-1 lg:order-1">
          <main className="w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-24 flex flex-col items-end text-right mr-auto"> 
            <div className="w-full pl-0 lg:pl-10">
              <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl leading-tight">
                <span className="block">הכלכלה החדשה של</span>{' '}
                <span className="block text-brand-600 mt-1">העצמאים בישראל</span>
              </h1>
              <p className="mt-6 text-base text-slate-500 font-light sm:mt-8 sm:text-lg sm:max-w-xl md:mt-8 md:text-xl leading-relaxed">
                השתמשו בכישורים שלכם כדי לשלם על שירותים עסקיים. 
                בלי להוציא מזומן, בלי עמלות נסתרות. 
                נטוורקינג עסקי אמיתי שמייצר ערך מהיום הראשון.
              </p>
              
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-1.5 sm:gap-4 justify-start">
                <div className="rounded-md shadow">
                  <button 
                    onClick={onOpenSearchTips}
                    className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-700 md:text-lg transition-all active:scale-95"
                  >
                    מצאו שותף לברטר
                  </button>
                </div>
                <div className="mt-0 sm:mt-0">
                  <button 
                    onClick={onOpenWhoIsItFor}
                    className="w-full flex items-center justify-center px-8 py-4 border border-slate-200 text-base font-bold rounded-lg text-brand-700 bg-brand-50 hover:bg-brand-100 md:text-lg transition-all active:scale-95"
                  >
                    הרשמו והצטרפו לקהילה
                  </button>
                </div>
              </div>
            </div>
          </main>
      </div>

      {/* Left Side (Features) - 45% Width */}
      <div className="w-full lg:w-[45%] bg-slate-50 relative min-h-[500px] lg:min-h-full flex items-center justify-center overflow-hidden order-2 lg:order-2 border-t lg:border-t-0 lg:border-r border-slate-100 p-8">
        
         {/* Background Decor */}
         <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:20px_20px]"></div>

        {/* Composition: Vertical Stack (Original Layout) */}
        <div className="relative w-full max-w-sm flex flex-col gap-5">
            
            {/* Card 1 */}
            <div className="w-full bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">חוסכים בהוצאות העסק</h3>
                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                        משתמשים בכישרון שלכם כמטבע עבור הסוחר. מקבלים שירותים שווים בלי להוציא שקל מהחזרים.
                    </p>
                </div>
            </div>

            {/* Card 2 */}
            <div className="w-full bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">קהילה עסקית איכותית</h3>
                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                        נבחרת של פרילנסרים ובעלי עסקים מנוסים. כאן תמצאו שותפים רציניים לעבודה, לא חובבנים.
                    </p>
                </div>
            </div>

            {/* Card 3 */}
            <div className="w-full bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">הזדמנויות צמיחה</h3>
                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                         הדרך הנכונה להגדיל את היקף העבודות, לייצר קשרים אסטרטגיים ולפרוץ לשווקים חדשים.
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
