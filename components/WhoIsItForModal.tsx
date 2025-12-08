
import React from 'react';
import { X, CheckCircle, Users, ArrowLeft, Briefcase, Baby, Music, GraduationCap, Palette, Stethoscope } from 'lucide-react';

interface WhoIsItForModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const WhoIsItForModal: React.FC<WhoIsItForModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-3xl w-full">
            <div className="bg-brand-600 px-6 py-6 text-white relative">
                <button onClick={onClose} className="absolute top-4 left-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex justify-center mb-4">
                    <div className="bg-white/20 p-4 rounded-full">
                        <Users className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-center">
                    למי הקהילה מתאימה?
                </h3>
            </div>
            
            <div className="p-8">
                <p className="text-lg text-slate-600 text-center mb-8 leading-relaxed max-w-2xl mx-auto">
                    הפלטפורמה נועדה לכל אדם שיש לו כישרון, ידע או מקצוע, ורוצה למנף אותו כדי לקבל ערך חדש.
                    <span className="block font-bold text-brand-600 mt-1">זה הרבה מעבר לעסקים - זו החלפת כישורים אנושית.</span>
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {/* Card 1: Classic Professionals */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            מקצועות דיגיטל ועסקים
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            בונים אתרים, מעצבים גרפיים, עורכי דין, רואי חשבון ויועצים עסקיים שרוצים להגדיל את מעגל הלקוחות ולחסוך הוצאות.
                        </p>
                    </div>

                    {/* Card 2: Wellness & Care */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Baby className="w-5 h-5 text-pink-500" />
                            טיפול, בריאות ומשפחה
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            דולות ותומכות לידה, מדריכות הורים, מאמני כושר, מטפלים אלטרנטיביים, יועצות שינה וקלינאיות תקשורת.
                        </p>
                    </div>

                    {/* Card 3: Education & Creators */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-amber-500" />
                            יוצרי תוכן והדרכה
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            בעלי קורסים דיגיטליים, מורים פרטיים, מרצים, מנחי סדנאות ויוצרי תוכן שמעוניינים להחליף ידע תמורת שירותים.
                        </p>
                    </div>

                    {/* Card 4: Skill Exchange (The Creative Part) */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Music className="w-5 h-5 text-purple-500" />
                            החלפת כישרונות ותחביבים
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            יש לכם כישרון נוסף מעבר למקצוע? זה המקום!
                            למשל: <span className="font-semibold text-slate-800">רופאה שמלמדת פסנתר תמורת שיעורי סינית</span>, או הייטקיסט שאופה עוגות מעוצבות תמורת צילום מקצועי.
                        </p>
                    </div>
                </div>

                <div className="bg-brand-50 rounded-xl p-4 border border-brand-100 text-center mb-6">
                    <p className="text-brand-800 font-medium text-sm">
                        "הכסף הכי טוב הוא הכישרון שכבר יש לכם בידיים."
                    </p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-slate-900 mb-4 text-center">איך זה עובד בפועל?</h4>
                    <ol className="space-y-4 max-w-md mx-auto text-sm">
                        <li className="flex gap-4">
                            <span className="flex-shrink-0 w-6 h-6 bg-slate-200 text-slate-700 font-bold rounded-full flex items-center justify-center">1</span>
                            <div>
                                <span className="font-bold block text-slate-800">מגדירים מה נותנים</span>
                                <span className="text-slate-500">זה יכול להיות השירות המקצועי שלכם, או תחביב שאתם מצטיינים בו.</span>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="flex-shrink-0 w-6 h-6 bg-slate-200 text-slate-700 font-bold rounded-full flex items-center justify-center">2</span>
                            <div>
                                <span className="font-bold block text-slate-800">מגדירים מה מחפשים</span>
                                <span className="text-slate-500">שיעור פרטי? עזרה בעסק? טיפול מפנק? הכל הולך.</span>
                            </div>
                        </li>
                    </ol>
                </div>

                <div className="mt-8 text-center">
                    <button 
                        onClick={() => {
                            onClose();
                            onOpenAuth();
                        }}
                        className="bg-slate-900 text-white font-bold py-3 px-10 rounded-full hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2 mx-auto"
                    >
                        הירשם והצטרף לקהילה
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
