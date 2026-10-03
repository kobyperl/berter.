
import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, Briefcase, CheckCircle2, Heart, Plus, Tag, Camera, Image as ImageIcon, Trash2, Loader2, Upload, AlertCircle, Eye, EyeOff, Search, Sparkles } from 'lucide-react';
import { UserProfile, ExpertiseLevel } from '../types';
import firebase, { db } from '../services/firebaseConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (user: Partial<UserProfile>, pass: string) => void;
  startOnRegister?: boolean;
  availableCategories: string[];
  availableInterests: string[];
  onOpenPrivacyPolicy?: () => void; 
}

const normalizeUrl = (url: string): string => {
    if (!url || url.trim() === '') return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400; // Aggressive compression for Firestore limits
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.4)); // Low quality for small thumbnails
          } else { reject(new Error("Canvas context error")); }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
};

export const AuthModal: React.FC<AuthModalProps> = ({ 
    isOpen, onClose, onLogin, onRegister, startOnRegister = false, availableCategories, availableInterests, onOpenPrivacyPolicy 
}) => {
  const [isLoginMode, setIsLoginMode] = useState(!startOnRegister);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
        setIsLoginMode(!startOnRegister);
        setIsSubmitting(false);
        setShowErrors(false); 
        setShowPassword(false);
    }
  }, [isOpen, startOnRegister]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Replaced single mainField string with list logic
  const [mainFieldsList, setMainFieldsList] = useState<string[]>([]);
  const [mainFieldInput, setMainFieldInput] = useState('');

  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [interestsList, setInterestsList] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
          const compressed = await compressImage(file);
          setAvatarDataUrl(compressed);
      } catch (err) { alert("שגיאה בטעינת התמונה"); }
      finally { setIsUploading(false); }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      setIsUploading(true);
      try {
          const remainingSlots = 6 - portfolioImages.length;
          if (remainingSlots <= 0) {
              alert("ניתן להעלות עד 6 תמונות.");
              setIsUploading(false);
              return;
          }
          const filesToProcess = Array.from(files).slice(0, remainingSlots);
          const promises = filesToProcess.map(f => compressImage(f as File));
          const results = await Promise.all(promises);
          setPortfolioImages(prev => [...prev, ...results].slice(0, 6));
      } catch (err) { alert("שגיאה בטעינת התמונות"); }
      finally { setIsUploading(false); e.target.value = ''; }
  };

  const handleAddMainField = (category: string) => {
      const val = category.trim();
      if (!val) return;
      if (mainFieldsList.length >= 3) {
          return; // Max 3
      }
      if (!mainFieldsList.includes(val)) {
          setMainFieldsList([...mainFieldsList, val]);
          // Check if custom to add to pending in backend
          if (!availableCategories.includes(val)) {
              db.collection("system").doc("taxonomy").update({
                  pendingCategories: firebase.firestore.FieldValue.arrayUnion(val)
              }).catch(e => console.error("Taxonomy update failed", e));
          }
      }
      setMainFieldInput('');
  };

  const handleAddInterest = (interest: string) => {
      const val = interest.trim();
      if (!val) return;
      if (!interestsList.includes(val)) {
          setInterestsList([...interestsList, val]);
          // Check if custom to add to pending in backend
          if (!availableInterests.includes(val)) {
              db.collection("system").doc("taxonomy").update({
                  pendingInterests: firebase.firestore.FieldValue.arrayUnion(val)
              }).catch(e => console.error("Taxonomy update failed", e));
          }
      }
      setInterestInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginMode) {
        if (!email.trim() || !password.trim()) { alert("נא למלא אימייל וסיסמה"); return; }
        setIsSubmitting(true);
        try { await onLogin(email, password); } catch (err) { setIsSubmitting(false); }
    } else {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || password.length < 6 || mainFieldsList.length === 0 || interestsList.length < 2 || !acceptedPrivacy) {
            setShowErrors(true);
            return;
        }
        setIsSubmitting(true);
        const newUser: Partial<UserProfile> = {
          name: `${firstName} ${lastName}`,
          email,
          mainField: mainFieldsList[0], // First one is primary
          secondaryFields: mainFieldsList.slice(1), // Rest are secondary
          portfolioUrl: normalizeUrl(portfolioUrl),
          portfolioImages: portfolioImages.slice(0, 6), // Explicitly slice
          expertise: ExpertiseLevel.MID,
          avatarUrl: avatarDataUrl || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
          interests: interestsList
        };
        try { await onRegister(newUser, password); } catch (err) { setIsSubmitting(false); }
    }
  };

  const inputBaseClass = "w-full text-slate-900 placeholder-slate-400 rounded-xl p-3.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm border border-slate-300 text-right bg-white";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">{isLoginMode ? 'התחברות' : 'הרשמה בחינם'}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {!isLoginMode && (
                        <div className="flex justify-center mb-4">
                            <div className="relative group cursor-pointer" onClick={() => !isUploading && avatarInputRef.current?.click()}>
                                <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-sm">
                                    {avatarDataUrl ? <img src={avatarDataUrl} className="w-full h-full object-cover" alt="avatar" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400"><Camera className="w-6 h-6" /></div>}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-[10px] font-bold">החלף תמונה</span></div>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </div>
                        </div>
                    )}

                    {!isLoginMode && (
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[11px] font-bold text-slate-700 mb-1">שם פרטי *</label><input type="text" className={`${inputBaseClass} ${showErrors && !firstName ? 'border-red-500' : ''}`} value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                            <div><label className="block text-[11px] font-bold text-slate-700 mb-1">שם משפחה *</label><input type="text" className={`${inputBaseClass} ${showErrors && !lastName ? 'border-red-500' : ''}`} value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">אימייל *</label>
                        <div className="relative"><Mail className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" /><input type="email" className={`${inputBaseClass} pr-10 ${showErrors && !email ? 'border-red-500' : ''}`} placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">סיסמה * <span className="text-slate-400 font-normal">(לפחות 6 תווים)</span></label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                            <input type={showPassword ? "text" : "password"} className={`${inputBaseClass} pr-10 ${showErrors && password.length < 6 ? 'border-red-500' : ''}`} placeholder="******" value={password} onChange={e => setPassword(e.target.value)} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                        </div>
                    </div>

                    {!isLoginMode && (
                        <>
                            {/* Main Field of Occupation - Updated UI */}
                            <div className="relative">
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">תחום עיסוק (עד 3) *</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            list="categories-list"
                                            className={`${inputBaseClass} ${showErrors && mainFieldsList.length === 0 ? 'border-red-500' : ''}`}
                                            placeholder="הוסף תחום עיסוק"
                                            value={mainFieldInput}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (availableCategories.includes(val)) {
                                                    handleAddMainField(val);
                                                } else {
                                                    setMainFieldInput(val);
                                                }
                                            }}
                                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddMainField(mainFieldInput))}
                                            disabled={mainFieldsList.length >= 3}
                                        />
                                        <datalist id="categories-list">{availableCategories.filter(c => !mainFieldsList.includes(c)).map(cat => <option key={cat} value={cat} />)}</datalist>
                                    </div>
                                    <button type="button" onClick={() => handleAddMainField(mainFieldInput)} disabled={!mainFieldInput.trim() || mainFieldsList.length >= 3} className="bg-brand-600 text-white rounded-xl px-4 hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"><Plus className="w-5 h-5" /></button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {mainFieldsList.map(field => (
                                        <span key={field} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-blue-100 shadow-sm animate-in zoom-in-95">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            {field}
                                            <button type="button" onClick={() => setMainFieldsList(mainFieldsList.filter(f => f !== field))}><X className="w-3.5 h-3.5" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Interests - Updated Button Color */}
                            <div className="relative">
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">תחומי עניין (לפחות 2) *</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            list="interests-list"
                                            className={`${inputBaseClass} ${showErrors && interestsList.length < 2 ? 'border-red-500' : ''}`} 
                                            placeholder="הוסף תחום עניין..." 
                                            value={interestInput} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                // If value matches an option exactly, add it immediately for a smooth native-like feel
                                                if (availableInterests.includes(val)) {
                                                    handleAddInterest(val);
                                                } else {
                                                    setInterestInput(val);
                                                }
                                            }} 
                                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddInterest(interestInput))} 
                                        />
                                        <datalist id="interests-list">{availableInterests.filter(i => !interestsList.includes(i)).map(int => <option key={int} value={int} />)}</datalist>
                                    </div>
                                    <button type="button" onClick={() => handleAddInterest(interestInput)} disabled={!interestInput.trim()} className="bg-brand-600 text-white rounded-xl px-4 hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"><Plus className="w-5 h-5" /></button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {interestsList.map(int => (
                                        <span key={int} className="bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-brand-100 shadow-sm animate-in zoom-in-95">
                                            <Heart className="w-3.5 h-3.5" />
                                            {int}
                                            <button type="button" onClick={() => setInterestsList(interestsList.filter(i => i !== int))}><X className="w-3.5 h-3.5" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-brand-500" />גלריית עבודות (אופציונלי - עד 6 תמונות)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {portfolioImages.map((img, idx) => <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border group"><img src={img} className="w-full h-full object-cover" alt="work" /><button type="button" onClick={() => setPortfolioImages(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 className="w-3 h-3" /></button></div>)}
                                    <button type="button" onClick={() => !isUploading && portfolioImages.length < 6 && portfolioInputRef.current?.click()} disabled={portfolioImages.length >= 6} className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</button>
                                </div>
                                <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*" multiple onChange={handlePortfolioUpload} />
                                <input type="text" className={inputBaseClass} placeholder="לינק לאתר (אופציונלי)" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} />
                            </div>

                            <div className={`flex items-start gap-2 p-3 rounded-xl border text-[10px] ${showErrors && !acceptedPrivacy ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                <input type="checkbox" id="privacy" className="mt-0.5" checked={acceptedPrivacy} onChange={e => setAcceptedPrivacy(e.target.checked)} />
                                <label htmlFor="privacy" className="cursor-pointer leading-relaxed">אני מאשר/ת את <button type="button" onClick={onOpenPrivacyPolicy} className="text-brand-600 underline font-bold">מדיניות הפרטיות</button> ותנאי השימוש באתר. *</label>
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={isSubmitting || isUploading} className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLoginMode ? 'התחברות' : 'הרשמה')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm border-t border-slate-50 pt-4">
                    <span className="text-slate-500">{isLoginMode ? 'אין לך חשבון?' : 'כבר רשום?'}</span>
                    <button onClick={() => setIsLoginMode(!isLoginMode)} className="mr-2 text-brand-600 font-bold hover:underline">{isLoginMode ? 'הירשם עכשיו' : 'התחבר'}</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
