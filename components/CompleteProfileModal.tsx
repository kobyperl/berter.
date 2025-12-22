
import React, { useState, useRef } from 'react';
import { X, Upload, Plus, Trash2, Save, ArrowLeft, Image as ImageIcon, Link as LinkIcon, CheckCircle, Loader2 } from 'lucide-react';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { portfolioUrl: string; portfolioImages: string[] }) => void;
}

const normalizeUrl = (url: string): string => {
    if (!url || url.trim() === '') return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

// Utility to compress image
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
          let width = img.width;
          let height = img.height;
  
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
  
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
              reject(new Error("Could not get canvas context"));
          }
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
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      setIsLoading(true);
      try {
          const promises = Array.from(files).map(file => compressImage(file as File));
          const compressedImages = await Promise.all(promises);
          setPortfolioImages(prev => [...prev, ...compressedImages]);
      } catch (err) {
          console.error(err);
          alert('שגיאה בטעינת התמונות');
      } finally {
          setIsLoading(false);
          e.target.value = '';
      }
  };

  const handleAddImageUrl = () => {
      if (newImageUrl) {
          setPortfolioImages(prev => [...prev, newImageUrl]);
          setNewImageUrl('');
      }
  };

  const handleRemoveImage = (index: number) => {
      setPortfolioImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
      onSave({ 
          portfolioUrl: normalizeUrl(portfolioUrl), 
          portfolioImages 
      });
  };

  const inputClassName = "w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl p-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-6 text-white relative">
                <button onClick={onClose} className="absolute top-4 left-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex justify-center mb-4">
                    <div className="bg-white/20 p-3 rounded-full">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-center">
                    ברוכים הבאים לקהילה!
                </h3>
                <p className="text-center text-brand-100 mt-2 text-sm">
                    רק עוד רגע קטן... השלימו את הפרופיל כדי לקבל יותר פניות.
                </p>
            </div>
            
            <div className="p-6">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-brand-500" />
                            קישור לאתר / רשת חברתית
                        </label>
                        <input 
                            type="text" 
                            className={inputClassName}
                            placeholder="www.mywebsite.co.il"
                            value={portfolioUrl}
                            onChange={(e) => setPortfolioUrl(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1 mr-1">
                            קישור לפרופיל לינקדאין, אינסטגרם, או אתר עסקי.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-brand-500" />
                            העלאת עבודות לתיק העבודות
                        </label>
                        
                        <div className="flex gap-2 mb-3 items-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 flex items-center gap-2 border border-slate-200 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {isLoading ? 'מעלה...' : 'העלאת תמונות'}
                            </button>
                            <input 
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple 
                                onChange={handleFileUpload}
                            />
                            
                            <span className="text-slate-300">|</span>
                            
                            <div className="relative flex-1">
                                <input 
                                    type="text"
                                    className={`${inputClassName} py-2.5`}
                                    placeholder="או הדבק קישור לתמונה"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                />
                                <button 
                                    onClick={handleAddImageUrl}
                                    disabled={!newImageUrl}
                                    className="absolute left-1 top-1 bottom-1 bg-brand-50 text-brand-600 px-2 rounded-lg hover:bg-brand-100 disabled:opacity-0 transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {portfolioImages.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {portfolioImages.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border border-slate-200">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-400 text-sm">
                                לא נבחרו תמונות. מומלץ להוסיף 2-3 תמונות מייצגות.
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        דלג כרגע
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        שמור וסיים
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
