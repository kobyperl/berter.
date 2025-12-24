
import React from 'react';
import { Wallet, Users, TrendingUp, Sparkles, ArrowDown } from 'lucide-react';
import { UserProfile } from '../types';

interface HeroProps {
    onOpenWhoIsItFor?: () => void;
    onOpenSearchTips?: () => void;
    currentUser: UserProfile | null;
}

export const Hero: React.FC<HeroProps> = ({ onOpenWhoIsItFor, onOpenSearchTips, currentUser }) => {
  const isLoggedIn = !!currentUser;

  return (
    <div className="relative bg-white overflow-hidden flex flex-col lg:flex-row border-b border-slate-100 min-h-[650px]">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brand-50 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none"></div>

      {/* Right Side (Text Content) - 55% Width */}
      <div className="w-full lg:w-[55%] z-20 flex flex-col justify-center relative order-1 lg:order-1 pt-10 lg:pt-0">
          <main className="w-full max-w-2xl px-6 sm:px-8 lg:px-12 py-12 lg:py-24 flex flex-col items-start text-right mr-auto"> 
            <div className="w-full">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2">
                  <Sparkles className="w-3 h-3" />
                  <span>הצטרפו למהפכת הכלכלה השיתופית</span>
              </div>

              <h1 className="text-4xl tracking-tight font-[750] text-slate-900 sm:text-5xl md:text-6xl leading-tight">
                <span className="block">הכסף החדש של</span>{' '}
                <span className="relative inline-block mt-1">
                    <span className="relative z-10 text-brand-600">העצמאים בישראל</span>
                    <span className="absolute bottom-1 right-0 w-full h-3 bg-brand-100 -z-10 opacity-70 skew-x-[-10deg]"></span>
                </span>
              </h1>
              
              <p className="mt-6 text-base text-slate-600 font-normal sm:mt-8 sm:text-lg sm:max-w-xl md:mt-8 md:text-xl leading-relaxed">
                השתמשו בכישורים שלכם כדי לשלם על שירותים עסקיים. 
                בלי להוציא מזומן, בלי עמלות נסתרות. 
                <span className="font-bold text-slate-800"> נטוורקינג עסקי אמיתי</span> שמייצר ערך מהיום הראשון.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-start">
                {isLoggedIn ? (
                    // LOGGED IN STATE
                    <>
                         {/* Primary Button: Find Partner (First from Right) */}
                         <div className="rounded-xl shadow-lg shadow-brand-500/20 transition-transform active:scale-95">
                            <button 
                                onClick={onOpenSearchTips}
                                className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 md:text-lg transition-all"
                            >
                                מצאו שותף לברטר
                            </button>
                        </div>

                        {/* Secondary Button: Who is it for */}
                        <div className="rounded-xl transition-transform active:scale-95">
                            <button 
                                onClick={onOpenWhoIsItFor}
                                className="w-full flex items-center justify-center px-8 py-4 border border-slate-200 text-base font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 md:text-lg transition-all hover:shadow-md"
                            >
                                למי הקהילה מתאימה
                            </button>
                        </div>
                    </>
                ) : (
                    // LOGGED OUT STATE
                    <>
                        {/* Primary Button: Register (First from Right) */}
                        <div className="rounded-xl shadow-lg shadow-brand-500/20 transition-transform active:scale-95">
                            <button 
                                onClick={onOpenWhoIsItFor}
                                className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 md:text-lg transition-all"
                            >
                                הרשמו והצטרפו לקהילה
                            </button>
                        </div>

                        {/* Secondary Button: Find Partner */}
                        <div className="rounded-xl transition-transform active:scale-95">
                            <button 
                                onClick={onOpenSearchTips}
                                className="w-full flex items-center justify-center px-8 py-4 border border-slate-200 text-base font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 md:text-lg transition-all hover:shadow-md"
                            >
                                מצאו שותף לברטר
                            </button>
                        </div>
                    </>
                )}
              </div>

              <div className="mt-10 flex items-center gap-4 text-xs text-slate-400 font-normal">
                  <div className="flex -space-x-2 space-x-reverse">
                      {[1,2,3,4].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                              <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                          </div>
                      ))}
                  </div>
                  <p>הצטרפו למאות אנשים שכבר חוסכים</p>
              </div>

            </div>
          </main>
      </div>

      {/* Left Side (Features) - 45% Width */}
      <div className="w-full lg:w-[45%] bg-slate-50/50 relative min-h-[500px] lg:min-h-full flex items-center justify-center overflow-hidden order-2 lg:order-2 border-t lg:border-t-0 lg:border-r border-slate-100 p-8">
        
         {/* Background Pattern */}
         <div className="absolute inset-0 opacity-[0.4] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Composition: Connected Vertical Stack */}
        <div className="relative w-full max-w-sm flex flex-col gap-8 z-10">
            
            {/* Connecting Line */}
            <div className="absolute right-[27px] top-8 bottom-8 w-0.5 border-r-2 border-dashed border-slate-200 z-0 hidden sm:block"></div>

            {/* Card 1 */}
            <div className="relative bg-white p-5 pr-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-5 hover:-translate-y-1 transition-transform duration-300 group z-10">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white shadow-sm group-hover:scale-110 transition-transform">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-emerald-700 transition-colors">חוסכים בהוצאות העסק</h3>
                    {/* Fixed height to ensure alignment,removed line-clamp to show full text */}
                    <p className="text-slate-500 text-sm font-normal leading-relaxed min-h-[3.5rem]">
                        משתמשים בכישרון שלכם כמטבע עבור הסוחר. מקבלים שירותים שווים בלי להוציא שקל.
                    </p>
                </div>
            </div>

            {/* Card 2 */}
            <div className="relative bg-white p-5 pr-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-5 hover:-translate-y-1 transition-transform duration-300 group z-10">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white shadow-sm group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-700 transition-colors">קהילה עסקית איכותית</h3>
                    <p className="text-slate-500 text-sm font-normal leading-relaxed min-h-[3.5rem]">
                        נבחרת של פרילנסרים ובעלי עסקים מנוסים. כאן תמצאו שותפים רציניים לעבודה.
                    </p>
                </div>
            </div>

            {/* Card 3 */}
            <div className="relative bg-white p-5 pr-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-5 hover:-translate-y-1 transition-transform duration-300 group z-10">
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white shadow-sm group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-rose-700 transition-colors">הזדמנויות צמיחה</h3>
                    <p className="text-slate-500 text-sm font-normal leading-relaxed min-h-[3.5rem]">
                         הדרך הנכונה להגדיל את היקף העבודות, לייצר קשרים אסטרטגיים משמעותיים ולפרוץ יחד לשווקים חדשים ומפתיעים.
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
