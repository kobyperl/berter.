
import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, Briefcase, CheckCircle2, Heart, Plus, Tag, Camera, Image as ImageIcon, Trash2, Loader2, Upload, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UserProfile, ExpertiseLevel } from '../types';

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
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else { reject(new Error("Could not get canvas context")); }
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
  const [professionsList, setProfessionsList] = useState<string[]>([]);
  const [professionInput, setProfessionInput] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [interestsList, setInterestsList] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoginMode) {
      setInterestsList([]); 
      setInterestInput(''); 
      setProfessionsList([]);
      setProfessionInput('');
      setAvatarDataUrl(''); 
      setPortfolioImages([]); 
      setShowErrors(false);
    }
  }, [isLoginMode]);

  if (!isOpen) return null;

  const handleAddProfession = () => {
    const trimmed = professionInput.trim();
    if (trimmed && !professionsList.includes(trimmed)) {
      setProfessionsList([...professionsList, trimmed]);
      setProfessionInput('');
    }
  };

  const handleRemoveProfession = (prof: string) => {
    setProfessionsList(professionsList.filter(p => p !== prof));
  };

  const handleAddInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !interestsList.includes(trimmed)) {
      setInterestsList([...interestsList, trimmed]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterestsList(interestsList.filter(i => i !== interest));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try { const compressed = await compressImage(file); setAvatarDataUrl(compressed); } 
      catch (err) { alert("שגיאה בטעינת התמונה"); } finally { setIsUploading(false); }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setIsUploading(true);
      try {
          const promises = Array.from(files).map((file) => compressImage(file as File));
          const compressedImages = await Promise.all(promises);
          setPortfolioImages(prev => [...prev, ...compressedImages]);
      } catch (err) { alert("שגיאה בטעינת התמונות"); } finally { setIsUploading(false); e.target.value = ''; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowErrors(false);
    try {
        if (isLoginMode) {
          if (!email.trim() || !password.trim()) { alert("נא למלא אימייל וסיסמה"); setShowErrors(true); setIsSubmitting(false); return; }
          await onLogin(email, password);
        } else {
          const missingFields = [];
          if (!firstName.trim()) missingFields.push("שם פרטי");
          if (!lastName.trim()) missingFields.push("שם משפחה");
          if (!email.trim()) missingFields.push("כתובת אימייל");
          if (!password.trim() || password.length < 6) missingFields.push("סיסמה (לפחות 6 תווים)");
          if (professionsList.length === 0) missingFields.push("לפחות מקצוע אחד");
          if (interestsList.length < 2) missingFields.push("לפחות 2 תחומי עניין");
          if (!acceptedPrivacy) missingFields.push("אישור תנאי שימוש");
          
          if (missingFields.length > 0) { 
              alert("נא למלא את כל שדות החובה"); 
              setShowErrors(true); 
              setIsSubmitting(false); 
              return; 
          }

          const newUser: Partial<UserProfile> = {
            name: `${firstName} ${lastName}`, email, mainField: professionsList, portfolioUrl, portfolioImages, expertise: ExpertiseLevel.MID,
            avatarUrl: avatarDataUrl || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`, interests: interestsList
          };
          await onRegister(newUser, password);
          setShowSuccess(true);
          setTimeout(() => { setShowSuccess(false); onClose(); }, 3000);
        }
    } catch (err) { setIsSubmitting(false); }
  };

  const getErrorClass = (value: any, isRequired: boolean = true) => {
      if (!showErrors) return "border-slate-300";
      if (isRequired && (!value || (Array.isArray(value) && value.length === 0))) return "border-red-500 bg-red-50";
      if (password && isLoginMode === false && password.length < 6 && value === password) return "border-red-500 bg-red-50";
      return "border-slate-300";
  };

  const inputBaseClass = "w-full text-slate-900 placeholder-slate-400 rounded-xl p-3.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm border bg-white";
  const labelBaseClass = "block text-sm font-bold text-slate-700 mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all w-full max-w-md relative z-10 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                <h3 className="text-lg font-extrabold text-slate-800">{isLoginMode ? 'התחברות' : 'הרשמה לקהילה'}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 sm:p-8 bg-white overflow-y-auto custom-scrollbar flex-1">
                {showErrors && !isLoginMode && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>יש למלא את כל שדות החובה והסיסמה באורך 6 תווים לפחות.</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {!isLoginMode && (
                        <div className="flex justify-center mb-6">
                            <div className="relative group cursor-pointer" onClick={() => !isUploading && avatarInputRef.current?.click()}>
                                <div className="w-20 h-20 rounded-full bg-white overflow-hidden border-4 border-white shadow-lg">
                                    {avatarDataUrl ? <img src={avatarDataUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-white text-slate-300"><Camera className="w-8 h-8" /></div>}
                                </div>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </div>
                        </div>
                    )}

                    {!isLoginMode && (
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={labelBaseClass}>שם פרטי *</label><input type="text" className={`${inputBaseClass} ${getErrorClass(firstName)}`} value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                            <div><label className={labelBaseClass}>שם משפחה *</label><input type="text" className={`${inputBaseClass} ${getErrorClass(lastName)}`} value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                        </div>
                    )}

                    <div>
                        <label className={labelBaseClass}>אימייל *</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                            <input type="email" className={`${inputBaseClass} pr-10 ${getErrorClass(email)}`} placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className={labelBaseClass}>סיסמה *</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                            <input type={showPassword ? "text" : "password"} className={`${inputBaseClass} pr-10 pl-10 ${getErrorClass(password)}`} placeholder="******" value={password} onChange={e => setPassword(e.target.value)} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                        </div>
                    </div>

                    {!isLoginMode && (
                        <>
                            <div className="space-y-2">
                                <label className={labelBaseClass}>מקצוע (לפחות 1) *</label>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="text" 
                                        list="categories-list" 
                                        className={`${inputBaseClass} ${getErrorClass(professionsList)}`} 
                                        placeholder="מה התחום שלך?" 
                                        value={professionInput} 
                                        onChange={e => setProfessionInput(e.target.value)} 
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProfession())}
                                    />
                                    <datalist id="categories-list">{availableCategories.map(cat => <option key={cat} value={cat} />)}</datalist>
                                    <button type="button" onClick={handleAddProfession} disabled={!professionInput.trim()} className="bg-brand-600 text-white rounded-xl px-4 hover:bg-brand-700 transition-colors shrink-0"><Plus className="w-5 h-5" /></button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {professionsList.map((prof, idx) => (
                                        <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                            {prof}
                                            <button type="button" onClick={() => handleRemoveProfession(prof)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={labelBaseClass}>תחומי עניין (2 לפחות) *</label>
                                <div className="flex gap-2 mb-3">
                                    <input type="text" list="interests-list" className={`${inputBaseClass} ${getErrorClass(interestsList)}`} value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())} />
                                    <datalist id="interests-list">{availableInterests.map(int => <option key={int} value={int} />)}</datalist>
                                    <button type="button" onClick={handleAddInterest} disabled={!interestInput.trim()} className="bg-brand-600 text-white rounded-xl px-4 hover:bg-brand-700 transition-colors shrink-0"><Plus className="w-5 h-5" /></button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {interestsList.map((interest, idx) => (
                                        <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                            {interest}
                                            <button type="button" onClick={() => handleRemoveInterest(interest)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={labelBaseClass}>תיק עבודות / גלריה (אופציונלי)</label>
                                <button type="button" onClick={() => portfolioInputRef.current?.click()} className="w-full py-4 px-4 bg-white border border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-500 hover:border-brand-500 hover:text-brand-600 transition-all flex items-center justify-center gap-2">
                                    <Upload className="w-4 h-4" /> העלה תמונות לעבודות שלך
                                </button>
                                <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*" multiple onChange={handlePortfolioUpload} />
                                {portfolioImages.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 mt-3">
                                        {portfolioImages.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setPortfolioImages(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/40 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={`flex items-start gap-3 p-3 rounded-xl ${showErrors && !acceptedPrivacy ? 'bg-red-50 border border-red-200' : ''}`}>
                                <input type="checkbox" id="privacyConsent" className="mt-1 w-5 h-5 text-brand-600 rounded-lg focus:ring-brand-500" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} />
                                <label htmlFor="privacyConsent" className="text-xs text-slate-600 cursor-pointer font-medium leading-relaxed">
                                    אני מאשר/ת את <button type="button" onClick={(e) => {e.preventDefault(); onOpenPrivacyPolicy && onOpenPrivacyPolicy()}} className="text-brand-600 underline font-bold">מדיניות הפרטיות</button> ותנאי השימוש. *
                                </label>
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={isSubmitting || (!isLoginMode && isUploading)} className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition-all shadow-lg flex items-center justify-center gap-3 text-base active:scale-95 disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        {isLoginMode ? 'התחברות' : 'הרשמה'}
                    </button>
                </form>

                <div className="mt-8 text-center pb-2">
                    <span className="text-slate-500 text-sm">{isLoginMode ? 'חדש כאן?' : 'כבר יש לך חשבון?'}</span>
                    <button onClick={() => setIsLoginMode(!isLoginMode)} className="mr-2 text-brand-600 font-extrabold hover:underline text-sm transition-all">
                        {isLoginMode ? 'להרשמה' : 'התחברות'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
