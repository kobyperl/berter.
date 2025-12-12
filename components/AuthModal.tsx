


import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, Briefcase, CheckCircle2, Heart, Plus, Tag, Camera, Image as ImageIcon, Trash2, Loader2, Upload } from 'lucide-react';
import { UserProfile, ExpertiseLevel } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>; // Updated signature to Promise for await
  onRegister: (user: Partial<UserProfile>, pass: string) => void;
  startOnRegister?: boolean;
  availableCategories: string[];
  availableInterests: string[];
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

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onRegister, startOnRegister = false, availableCategories, availableInterests }) => {
  const [isLoginMode, setIsLoginMode] = useState(!startOnRegister);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // New Loading State
  
  // Reset mode when isOpen changes or startOnRegister changes
  useEffect(() => {
    if (isOpen) {
        setIsLoginMode(!startOnRegister);
        setIsSubmitting(false);
    }
  }, [isOpen, startOnRegister]);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mainField, setMainField] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  
  // Image State
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  
  // Interests State (Tag based)
  const [interestsList, setInterestsList] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');

  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  // Reset form when switching modes
  useEffect(() => {
    if (!isLoginMode) {
      setInterestsList([]);
      setInterestInput('');
      setMainField('');
      setAvatarDataUrl('');
      setPortfolioImages([]);
    }
  }, [isLoginMode]);

  if (!isOpen) return null;

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
      try {
          const compressed = await compressImage(file);
          setAvatarDataUrl(compressed);
      } catch (err) {
          alert("שגיאה בטעינת התמונה");
      } finally {
          setIsUploading(false);
      }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      try {
          const promises = Array.from(files).map((file) => compressImage(file as File));
          const compressedImages = await Promise.all(promises);
          setPortfolioImages(prev => [...prev, ...compressedImages]);
      } catch (err) {
          alert("שגיאה בטעינת התמונות");
      } finally {
          setIsUploading(false);
          e.target.value = ''; // Reset
      }
  };

  const handleRemovePortfolioImage = (index: number) => {
      setPortfolioImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        if (isLoginMode) {
          await onLogin(email, password);
          // If successful, the modal will likely close via parent props
        } else {
          // Validation Logic
          if (!mainField.trim()) {
            alert("חובה לבחור או להקליד תחום עיסוק ראשי");
            setIsSubmitting(false);
            return;
          }
          if (interestsList.length < 2) {
            alert("חובה לבחור לפחות 2 תחומי עניין");
            setIsSubmitting(false);
            return;
          }
          if (!acceptedPrivacy) {
              alert("חובה לאשר את מדיניות הפרטיות כדי להירשם");
              setIsSubmitting(false);
              return;
          }

          // Register Logic
          const newUser: Partial<UserProfile> = {
            name: `${firstName} ${lastName}`,
            email,
            mainField: mainField.trim(),
            portfolioUrl,
            portfolioImages: portfolioImages, // Pass uploaded images
            expertise: ExpertiseLevel.MID,
            // Use uploaded avatar or generate random one
            avatarUrl: avatarDataUrl || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
            interests: interestsList
          };
          
          await onRegister(newUser, password);
          
          // Email Simulation Feedback
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            onClose();
          }, 3000);
        }
    } catch (err) {
        console.error(err);
        setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-75">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">ברוכים הבאים!</h3>
                <p className="text-slate-600 mb-4">
                    מייל אישור הרשמה נשלח לכתובת: <br/>
                    <span className="font-semibold">{email}</span>
                </p>
                <p className="text-xs text-slate-400">מעבירים אותך לאזור האישי...</p>
            </div>
        </div>
    );
  }

  // Improved Input Styles - White background, clearer border
  const inputClassName = "w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl p-3.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">
                    {isLoginMode ? 'התחברות לחשבון' : 'הרשמה לקהילה'}
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-6 bg-slate-50/50 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Avatar Upload (Only Registration) */}
                    {!isLoginMode && (
                        <div className="flex justify-center mb-6">
                            <div 
                                className="relative group cursor-pointer"
                                onClick={() => !isUploading && avatarInputRef.current?.click()}
                            >
                                <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-md">
                                    {avatarDataUrl ? (
                                        <img src={avatarDataUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                            <Camera className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold">שנה תמונה</span>
                                </div>
                                <input 
                                    type="file"
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                        </div>
                    )}

                    {!isLoginMode && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">שם פרטי</label>
                                <input 
                                    required
                                    type="text"
                                    name="firstName"
                                    autoComplete="given-name"
                                    className={inputClassName}
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">שם משפחה</label>
                                <input 
                                    required
                                    type="text"
                                    name="lastName"
                                    autoComplete="family-name"
                                    className={inputClassName}
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">כתובת אימייל</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                            <input 
                                required
                                type="email"
                                name="email"
                                autoComplete="email"
                                className={`${inputClassName} pr-10`}
                                placeholder="name@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">סיסמה</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                            <input 
                                required
                                type="password"
                                name="password"
                                autoComplete={isLoginMode ? "current-password" : "new-password"}
                                className={`${inputClassName} pr-10`}
                                placeholder="******"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {!isLoginMode && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">תחום עיסוק ראשי (בחר או הקלד)</label>
                                <div className="relative">
                                    <Briefcase className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                                    <input 
                                        required
                                        type="text"
                                        list="categories-list"
                                        name="mainField"
                                        autoComplete="off"
                                        className={`${inputClassName} pr-10`}
                                        placeholder="התחל להקליד כדי לבחור..."
                                        value={mainField}
                                        onChange={e => setMainField(e.target.value)}
                                    />
                                    <datalist id="categories-list">
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">תחומי עניין (חובה לבחור לפחות 2)</label>
                                <div className="relative flex gap-2 mb-2">
                                    <div className="relative flex-1">
                                      <Heart className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                                      <input 
                                          type="text" 
                                          name="interestInput"
                                          list="interests-list"
                                          autoComplete="off"
                                          className={`${inputClassName} pr-10`}
                                          placeholder="בחר או הקלד תחום חדש..."
                                          value={interestInput}
                                          onChange={e => setInterestInput(e.target.value)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleAddInterest();
                                            }
                                          }}
                                      />
                                      <datalist id="interests-list">
                                        {availableInterests.map(int => (
                                          <option key={int} value={int} />
                                        ))}
                                      </datalist>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleAddInterest}
                                      disabled={!interestInput.trim()}
                                      className="bg-brand-600 text-white rounded-xl px-3 hover:bg-brand-700 disabled:opacity-50 transition-colors"
                                    >
                                      <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 min-h-[32px]">
                                    {interestsList.map((interest, idx) => (
                                      <span key={idx} className="bg-brand-50 border border-brand-100 text-brand-700 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                                        {interest}
                                        <button 
                                          type="button" 
                                          onClick={() => handleRemoveInterest(interest)}
                                          className="text-brand-400 hover:text-red-500"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                    {interestsList.length === 0 && (
                                      <span className="text-xs text-slate-400">לדוגמה: ספורט, בישול, טכנולוגיה...</span>
                                    )}
                                </div>
                                {interestsList.length > 0 && interestsList.length < 2 && (
                                    <p className="text-xs text-red-500 mt-1">נא לבחור לפחות עוד תחום עניין אחד</p>
                                )}
                            </div>

                            {/* Portfolio Gallery Upload */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-brand-500" />
                                    תמונות לתיק עבודות (אופציונלי)
                                </label>
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {portfolioImages.map((img, idx) => (
                                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePortfolioImage(idx)}
                                                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => !isUploading && portfolioInputRef.current?.click()}
                                        className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors bg-slate-50"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    </button>
                                </div>
                                <input 
                                    type="file"
                                    ref={portfolioInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePortfolioUpload}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">קישור לאתר חיצוני (אופציונלי)</label>
                                <input 
                                    type="url"
                                    name="portfolioUrl"
                                    className={inputClassName}
                                    placeholder="https://portfolio.com"
                                    value={portfolioUrl}
                                    onChange={e => setPortfolioUrl(e.target.value)}
                                />
                            </div>

                            {/* Privacy Policy Consent */}
                            <div className="flex items-start gap-2 bg-slate-100 p-3 rounded-xl border border-slate-200 mt-2">
                                <input 
                                    type="checkbox" 
                                    id="privacyConsent"
                                    className="mt-1 w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                                    checked={acceptedPrivacy}
                                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                />
                                <label htmlFor="privacyConsent" className="text-xs text-slate-600 cursor-pointer">
                                    אני מאשר/ת את <a href="#" className="text-brand-600 underline font-bold hover:text-brand-800">מדיניות הפרטיות</a> ואת תנאי השימוש באתר.
                                </label>
                            </div>
                        </>
                    )}

                    <button 
                        type="submit" 
                        disabled={isSubmitting || (!isLoginMode && (!acceptedPrivacy || interestsList.length < 2 || !mainField || isUploading))}
                        className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 transition-colors shadow-sm mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isLoginMode ? (isSubmitting ? 'מתחבר...' : 'התחבר') : (isSubmitting ? 'נרשם...' : 'הירשם בחינם')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-slate-500">
                        {isLoginMode ? 'אין לך עדיין חשבון?' : 'כבר רשום במערכת?'}
                    </span>
                    <button 
                        onClick={() => setIsLoginMode(!isLoginMode)}
                        className="mr-2 text-brand-600 font-bold hover:underline"
                    >
                        {isLoginMode ? 'הירשם עכשיו' : 'התחבר'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
