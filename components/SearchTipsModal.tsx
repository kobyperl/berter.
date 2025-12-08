
import React from 'react';
import { X, Search, Filter, MessageCircle, ArrowLeft } from 'lucide-react';

interface SearchTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSearching: () => void;
}

export const SearchTipsModal: React.FC<SearchTipsModalProps> = ({ isOpen, onClose, onStartSearching }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full">
            <div className="bg-brand-600 px-6 py-6 text-white relative">
                <button onClick={onClose} className="absolute top-4 left-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold text-center">
                    איך מוצאים שותף מושלם?
                </h3>
            </div>
            
            <div className="p-8">
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Search className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg">1. חיפוש חכם</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                השתמשו בסרגל החיפוש כדי למצוא מילות מפתח ספציפיות (למשל "וורדפרס" או "עריכת דין").
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                            <Filter className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg">2. סינון ממוקד</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                בחרו קטגוריה ראשית מהתפריט או סננו לפי "חד פעמי" / "מתמשך" כדי לדייק את התוצאות.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg">3. פנייה אישית</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                מצאתם הצעה מעניינת? שלחו הודעה מפורטת. הציגו את עצמכם ומה הערך שאתם נותנים בתמורה.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <button 
                        onClick={onStartSearching}
                        className="bg-brand-600 text-white font-bold py-3.5 px-10 rounded-full hover:bg-brand-700 transition-transform active:scale-95 shadow-lg flex items-center gap-2 mx-auto"
                    >
                        קחו אותי ללוח ההצעות
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
