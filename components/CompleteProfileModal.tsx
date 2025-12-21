
import React, { useState, useRef } from 'react';
import { X, Upload, Plus, Trash2, Save, Image as ImageIcon, Link as LinkIcon, CheckCircle, Loader2 } from 'lucide-react';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { portfolioUrl: string; portfolioImages: string[] }) => void;
}

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          let width = img.width; let height = img.height;
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); } 
          else { reject(new Error("Context Error")); }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
};

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ isOpen, onClose, onSave }) => {
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files; if (!files?.length) return;
      setIsLoading(true);
      try {
          const promises = Array.from(files).map(file => compressImage(file as File));
          const compressedImages = await Promise.all(promises);
          setPortfolioImages(prev => [...prev, ...compressedImages]);
      } catch (err) { alert('שגיאה בטעינה'); } finally { setIsLoading(false); e.target.value = ''; }
  };

  const handleAddImageUrl = () => { if (newImageUrl) { setPortfolioImages(prev => [...prev, newImageUrl]); setNewImageUrl(''); } };
  const handleRemoveImage = (index: number) => { setPortfolioImages(prev => prev.filter((_, i) => i !== index)); };
  const handleSave = () => { onSave({ portfolioUrl, portfolioImages }); };

  const inputClassName = "w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:border-brand-500 outline-none transition-all shadow-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all w-full max-w-lg relative z-10 max-h-[92vh] flex flex-col">
            <div className="bg-brand-600 px-6 py-6 text-white text-center shrink-0">
                <button onClick={onClose} className="absolute top-4 left-4 text-white/80 p-1 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                <div className="flex justify-center mb-3"><CheckCircle className="w-10 h-10 text-white" /></div>
                <h3 className="text-xl font-bold">השלמת פרופיל</h3>
                <p className="text-brand-100 text-xs mt-1">כדי לקבל יותר פניות, כדאי להוסיף תיק עבודות.</p>
            </div>
            <div className="p-5 sm:p-8 bg-white overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div><label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-brand-500" /> אתר / רשת חברתית</label><input type="url" className={inputClassName} placeholder="https://..." value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} /></div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-brand-500" /> גלריית עבודות</label>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 flex items-center justify-center gap-2 border border-slate-200">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {isLoading ? 'מעלה...' : 'העלה תמונות'}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                        <div className="relative"><input type="text" className={inputClassName} placeholder="או קישור לתמונה..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} /><button onClick={handleAddImageUrl} disabled={!newImageUrl} className="absolute left-1 top-1 bottom-1 bg-brand-50 text-brand-600 px-3 rounded-lg hover:bg-brand-100"><Plus className="w-5 h-5" /></button></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        {portfolioImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm"><img src={img} className="w-full h-full object-cover" /><button onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 className="w-4 h-4" /></button></div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3 pt-4"><button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">דלג</button><button onClick={handleSave} className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-brand-700 transition-all flex items-center justify-center gap-2"><Save className="w-4 h-4" /> שמור</button></div>
            </div>
        </div>
    </div>
  );
};
