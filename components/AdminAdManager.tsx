
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Megaphone, Save, Upload, Check, Pencil, Tag, Target, Link as LinkIcon, Copy, Briefcase, Eye, EyeOff, Power } from 'lucide-react';
import { SystemAd } from '../types';

interface AdminAdManagerProps {
  isOpen: boolean;
  onClose: () => void;
  ads: SystemAd[];
  availableInterests: string[]; // List of all interests (common + user generated)
  availableCategories: string[]; // List of all professions (common + user generated)
  onAddAd: (ad: SystemAd) => void;
  onEditAd?: (ad: SystemAd) => void; 
  onDeleteAd: (id: string) => void;
}

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

export const AdminAdManager: React.FC<AdminAdManagerProps> = ({ isOpen, onClose, ads, availableInterests, availableCategories, onAddAd, onEditAd, onDeleteAd }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctaText, setCtaText] = useState('לפרטים נוספים');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [subLabel, setSubLabel] = useState(''); // New "Cover" text field
  
  // Targeting State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Global']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestSearch, setInterestSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (!isOpen) {
          resetForm();
      }
  }, [isOpen]);

  const resetForm = () => {
      setTitle('');
      setDescription('');
      setCtaText('לפרטים נוספים');
      setLinkUrl('');
      setImageUrl('');
      setSubLabel('');
      setSelectedCategories(['Global']);
      setSelectedInterests([]);
      setInterestSearch('');
      setCategorySearch('');
      setEditingAdId(null);
      setActiveTab('list');
  };

  const handleEditClick = (ad: SystemAd) => {
      setEditingAdId(ad.id);
      setTitle(ad.title);
      setDescription(ad.description);
      setCtaText(ad.ctaText);
      setLinkUrl(ad.linkUrl);
      setImageUrl(ad.imageUrl);
      setSubLabel(ad.subLabel || '');
      setSelectedCategories(ad.targetCategories || ['Global']);
      setSelectedInterests(ad.targetInterests || []);
      setActiveTab('create');
  };

  const handleDuplicate = (ad: SystemAd) => {
      const newAd: SystemAd = {
          ...ad,
          id: Date.now().toString(), // Generate new ID
          title: `${ad.title} (עותק)`, // Append copy indicator
          isActive: false // Default to inactive so manager can review before publishing
      };
      
      onAddAd(newAd);
      alert('המודעה שוכפלה בהצלחה. היא מופיעה כעת ברשימה כלא פעילה.');
  };

  const handleToggleStatus = (ad: SystemAd) => {
      if (onEditAd) {
          onEditAd({ ...ad, isActive: !ad.isActive });
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const compressed = await compressImage(file);
        setImageUrl(compressed);
    } catch (err) {
        alert('שגיאה בטעינת התמונה');
    }
  };

  const toggleCategory = (cat: string) => {
      setSelectedCategories(prev => {
          if (prev.includes(cat)) {
              if (prev.length === 1 && prev[0] === 'Global' && cat === 'Global') return prev;
              return prev.filter(c => c !== cat);
          } else {
              return [...prev, cat];
          }
      });
  };

  const toggleInterest = (interest: string) => {
      setSelectedInterests(prev => {
          if (prev.includes(interest)) {
              return prev.filter(i => i !== interest);
          } else {
              return [...prev, interest];
          }
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !linkUrl || !imageUrl) {
        alert('נא למלא את כל שדות החובה (כותרת, לינק, תמונה)');
        return;
    }

    const adData: SystemAd = {
        id: editingAdId || Date.now().toString(),
        title,
        description,
        ctaText,
        linkUrl,
        imageUrl,
        targetCategories: selectedCategories,
        targetInterests: selectedInterests,
        subLabel: subLabel,
        isActive: true // Defaults to true on save unless explicitly edited elsewhere
    };

    if (editingAdId && onEditAd) {
        // Keep original active state if editing, unless it's a new one
        const originalAd = ads.find(a => a.id === editingAdId);
        if (originalAd) adData.isActive = originalAd.isActive;
        
        onEditAd(adData);
    } else {
        onAddAd(adData);
    }
    
    resetForm();
  };
  
  const filteredInterests = availableInterests.filter(i => 
    (i || '').toLowerCase().includes(interestSearch.toLowerCase())
  );
  
  const filteredCategories = availableCategories.filter(c => 
    (c || '').toLowerCase().includes(categorySearch.toLowerCase())
  );

  if (!isOpen) return null;

  const inputClassName = "w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-lg p-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 shadow-sm";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-5xl w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-purple-50">
                <div className="flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-800">
                        ניהול פרסומות
                    </h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => {
                        setActiveTab('list');
                        setEditingAdId(null);
                        resetForm();
                    }}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'list' ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    רשימת מודעות פעילות ({ads.length})
                </button>
                <button 
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'create' ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    {editingAdId ? 'עריכת קמפיין' : 'יצירת קמפיין חדש'}
                </button>
            </div>

            <div className="p-6 min-h-[400px]">
                {activeTab === 'create' ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* ... (Existing Create Form Code remains same) ... */}
                            {/* Left Column: Visuals */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">תמונת קמפיין</label>
                                <div 
                                    className="border-2 border-dashed border-slate-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden relative group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {imageUrl ? (
                                        <>
                                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                                                <span className="text-white opacity-0 group-hover:opacity-100 font-medium bg-black/50 px-3 py-1 rounded-full">החלף תמונה</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                            <span className="text-sm text-slate-500">לחץ להעלאת תמונה</span>
                                        </>
                                    )}
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                                <div className="mt-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">או הדבק כתובת תמונה</label>
                                    <input 
                                        type="text"
                                        className={inputClassName}
                                        placeholder="https://..."
                                        value={imageUrl}
                                        onChange={e => setImageUrl(e.target.value)}
                                    />
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">טקסט תחתון (אופציונלי)</label>
                                    <input 
                                        type="text"
                                        className={inputClassName}
                                        placeholder='למשל: "בחסות המערכת" או השאר ריק'
                                        value={subLabel}
                                        onChange={e => setSubLabel(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Details & Targeting */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">כותרת המודעה</label>
                                    <input 
                                        required
                                        type="text"
                                        className={inputClassName}
                                        placeholder="למשל: ציוד נגינה במבצע"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>
                                
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                        <Target className="w-4 h-4 text-purple-600" />
                                        הגדרות טרגוט (קהל יעד)
                                    </h4>
                                    
                                    {/* Professions */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">מקצועות וקטגוריות</label>
                                        <div className="relative mb-2">
                                            <Briefcase className="w-3 h-3 absolute right-3 top-3 text-slate-400" />
                                            <input 
                                                type="text"
                                                className={`${inputClassName} pr-9 py-1.5`}
                                                placeholder="חפש או הוסף מקצוע..."
                                                value={categorySearch}
                                                onChange={e => setCategorySearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-1 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleCategory('Global')}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                                                    selectedCategories.includes('Global') 
                                                    ? 'bg-purple-600 border-purple-600 text-white' 
                                                    : 'bg-white border-slate-300 text-slate-600 hover:border-purple-300'
                                                }`}
                                            >
                                                {selectedCategories.includes('Global') && <Check className="w-3 h-3" />}
                                                Global (כולם)
                                            </button>
                                            {filteredCategories.map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => toggleCategory(cat)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                                                        selectedCategories.includes(cat) 
                                                        ? 'bg-purple-600 border-purple-600 text-white' 
                                                        : 'bg-white border-slate-300 text-slate-600 hover:border-purple-300'
                                                    }`}
                                                >
                                                    {selectedCategories.includes(cat) && <Check className="w-3 h-3" />}
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Interests */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">תחומי עניין / נושאים</label>
                                        <div className="relative mb-2">
                                            <Tag className="w-3 h-3 absolute right-3 top-3 text-slate-400" />
                                            <input 
                                                type="text"
                                                className={`${inputClassName} pr-9 py-1.5`}
                                                placeholder="חפש או הוסף נושא..."
                                                value={interestSearch}
                                                onChange={e => setInterestSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                            {filteredInterests.map(interest => (
                                                <button
                                                    key={interest}
                                                    type="button"
                                                    onClick={() => toggleInterest(interest)}
                                                    className={`px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1 ${
                                                        selectedInterests.includes(interest)
                                                        ? 'bg-pink-500 border-pink-500 text-white'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300'
                                                    }`}
                                                >
                                                    {selectedInterests.includes(interest) && <Check className="w-3 h-3" />}
                                                    {interest}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">טקסט תיאור</label>
                                    <textarea 
                                        className={`${inputClassName} h-20 resize-none`}
                                        placeholder="תיאור קצר שיופיע מתחת לכותרת..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">טקסט כפתור</label>
                                        <input 
                                            type="text"
                                            className={inputClassName}
                                            value={ctaText}
                                            onChange={e => setCtaText(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">לינק ליעד</label>
                                        <div className="relative">
                                            <LinkIcon className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                                            <input 
                                                required
                                                type="url"
                                                className={`${inputClassName} pr-9`}
                                                placeholder="https://..."
                                                value={linkUrl}
                                                onChange={e => setLinkUrl(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                             {editingAdId && (
                                 <button 
                                    type="button"
                                    onClick={resetForm}
                                    className="text-slate-500 px-6 py-2.5 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                                 >
                                     ביטול עריכה
                                 </button>
                             )}
                             <button 
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors"
                             >
                                 {editingAdId ? (
                                     <>
                                        <Save className="w-5 h-5" />
                                        שמור שינויים
                                     </>
                                 ) : (
                                     <>
                                        <Plus className="w-5 h-5" />
                                        פרסם מודעה
                                     </>
                                 )}
                             </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        {ads.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>טרם הוגדרו מודעות במערכת.</p>
                            </div>
                        ) : (
                            ads.map(ad => (
                                <div key={ad.id} className={`flex flex-col sm:flex-row items-center gap-4 border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group ${ad.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                                    
                                    {/* Toggle Switch */}
                                    <div className="flex flex-col items-center gap-1 sm:border-l sm:pl-4 sm:ml-2">
                                        <button
                                            onClick={() => handleToggleStatus(ad)}
                                            className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${ad.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                                            title={ad.isActive ? 'השבת מודעה' : 'הפעל מודעה'}
                                        >
                                            <span className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${ad.isActive ? 'left-1' : 'left-5'}`}></span>
                                        </button>
                                        <span className="text-[10px] font-bold text-slate-500">{ad.isActive ? 'פעיל' : 'כבוי'}</span>
                                    </div>

                                    <div className="relative w-full sm:w-32 h-24 shrink-0">
                                        <img 
                                            src={ad.imageUrl} 
                                            alt={ad.title} 
                                            className={`w-full h-full object-cover rounded-lg ${!ad.isActive ? 'grayscale' : ''}`}
                                        />
                                    </div>
                                    
                                    <div className="flex-1 text-right w-full min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-bold text-lg truncate ${ad.isActive ? 'text-slate-800' : 'text-slate-500'}`}>{ad.title}</h4>
                                            <div className="flex gap-2 shrink-0">
                                                {/* Duplicate Button */}
                                                <button 
                                                    onClick={() => handleDuplicate(ad)}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="שכפל מודעה"
                                                >
                                                    <Copy className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEditClick(ad)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="ערוך מודעה"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm('למחוק את המודעה?')) onDeleteAd(ad.id);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="מחק מודעה"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 my-2">
                                            {/* Minimal Tags for Admin View Only */}
                                            {ad.targetCategories?.slice(0, 3).map(c => (
                                                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-500">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-1">{ad.description}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
