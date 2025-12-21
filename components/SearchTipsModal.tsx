
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all w-full max-w-lg relative z-10 max-h-[92vh] flex flex-col">
            <div className="bg-brand-600 px-6 py-6 text-white relative shrink-0">
                <button onClick={onClose} className="absolute top-4 left-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"><X className="w-6 h-6" /></button>
                <h3 className="text-2xl font-black text-center">איך מוצאים שותף?</h3>
            </div>
            
            <div className="p-6 sm:p-8 bg-white overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-8">
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-white border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><Search className="w-6 h-6" /></div>
                        <div><h4 className="font-bold text-slate-800 text-lg">1. חיפוש חכם</h4><p className="text-sm text-slate-500 leading-relaxed mt-1">השתמשו בסרגל החיפוש למציאת מילות מפתח ספציפיות כמו "וורדפרס" או "עיצוב".</p></div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-white border border-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm"><Filter className="w-6 h-6" /></div>
                        <div><h4 className="font-bold text-slate-800 text-lg">2. סינון ממוקד</h4><p className="text-sm text-slate-500 leading-relaxed mt-1">בחרו קטגוריה ראשית או סננו לפי "חד פעמי" כדי לדייק את התוצאות.</p></div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-white border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><MessageCircle className="w-6 h-6" /></div>
                        <div><h4 className="font-bold text-slate-800 text-lg">3. פנייה אישית</h4><p className="text-sm text-slate-500 leading-relaxed mt-1">מצאתם משהו מעניין? שלחו הודעה מפורטת. הציגו את עצמכם ואת הערך שלכם.</p></div>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <button onClick={onStartSearching} className="bg-brand-600 text-white font-bold py-4 px-10 rounded-xl hover:bg-brand-700 transition-all shadow-lg active:scale-95 w-full flex items-center justify-center gap-2">קחו אותי ללוח ההצעות <ArrowLeft className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    </div>
  );
};
