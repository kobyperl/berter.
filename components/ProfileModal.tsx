
import React, { useState, useEffect, useRef } from 'react';
import { X, Briefcase, ExternalLink, Heart, Pencil, Save, Plus, Image as ImageIcon, Camera, Upload, Tag, AlertCircle, CheckCircle, XCircle, Loader2, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { UserProfile, BarterOffer, ExpertiseLevel } from '../types';
import { OfferCard } from './OfferCard';

interface ProfileModalProps {
  isOpen: boolean; onClose: () => void; profile: UserProfile | null; currentUser: UserProfile | null; userOffers: BarterOffer[]; onDeleteOffer: (offerId: string) => void | Promise<void>; onUpdateProfile: (profile: UserProfile) => Promise<void>; onContact: (profile: UserProfile) => void; onRate?: (offerId: string, rating: number) => void; availableCategories: string[]; availableInterests: string[]; onApproveUpdate?: (userId: string) => void; onRejectUpdate?: (userId: string) => void; startInEditMode?: boolean;
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

const cleanUrlForDisplay = (url: string) => {
    if (!url) return '';
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
};

const ensureProtocol = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, onClose, profile, currentUser, userOffers, onDeleteOffer, onUpdateProfile, onContact, onRate, availableCategories, availableInterests, onApproveUpdate, onRejectUpdate, startInEditMode = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<UserProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPendingApproval, setShowPendingApproval] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [professionInput, setProfessionInput] = useState('');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const isOwnProfile = currentUser?.id === profile?.id;
  const isAdmin = currentUser?.role === 'admin';

  let displayProfile = profile;
  if (profile && profile.pendingUpdate && (isOwnProfile || isAdmin)) {
      displayProfile = { ...profile, ...profile.pendingUpdate } as UserProfile;
  }
  
  if (displayProfile && displayProfile.mainField && !Array.isArray(displayProfile.mainField)) {
      displayProfile = { ...displayProfile, mainField: [displayProfile.mainField as unknown as string] };
  }

  useEffect(() => {
    if (displayProfile) setEditFormData(displayProfile);
    if (isOpen && startInEditMode && (isOwnProfile || isAdmin)) setIsEditing(true);
    else if (!isOpen) setIsEditing(false);
    setShowPendingApproval(false); 
    setInterestInput(''); 
    setProfessionInput('');
    setIsSaving(false);
  }, [profile, isOpen, isOwnProfile, isAdmin, startInEditMode]);

  if (!isOpen || !displayProfile) return null;

  const handleAddProfession = () => {
    if (!professionInput.trim()) return;
    setEditFormData(prev => {
        if (!prev) return null;
        const current = Array.isArray(prev.mainField) ? prev.mainField : (prev.mainField ? [prev.mainField as unknown as string] : []);
        if (current.length >= 3) {
            alert("ניתן לבחור עד 3 מקצועות בלבד");
            return prev;
        }
        return { ...prev, mainField: Array.from(new Set([...current, professionInput.trim()])) };
    });
    setProfessionInput('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
        if (!editFormData.mainField || editFormData.mainField.length === 0) {
            alert("יש לבחור לפחות מקצוע אחד");
            return;
        }
        setIsSaving(true);
        try { await onUpdateProfile(editFormData); if (isAdmin) { setIsEditing(false); setShowPendingApproval(false); } else { setShowPendingApproval(true); } } 
        catch (err) { alert("שגיאה בשמירה"); } finally { setIsSaving(false); }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'portfolio') => {
      const files = e.target.files; if (!files?.length || !editFormData) return;
      setIsUploading(true);
      try {
          if (type === 'avatar') { const url = await compressImage(files[0]); setEditFormData(prev => prev ? ({ ...prev, avatarUrl: url }) : null); } 
          else { const promises = Array.from(files).map(file => compressImage(file as File)); const urls = await Promise.all(promises); setEditFormData(prev => prev ? ({ ...prev, portfolioImages: [...(prev.portfolioImages || []), ...urls] }) : null); }
      } catch (error) { alert("שגיאה בהעלאה"); } finally { setIsUploading(false); e.target.value = ''; }
  };

  if (showPendingApproval && !isAdmin) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900 bg-opacity-75 p-3">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in zoom-in shadow-2xl">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-yellow-600" /></div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">השינויים נשלחו!</h3>
                <p className="text-slate-600 mb-6 text-sm">העדכון יפורסם לאחר אישור מנהל.</p>
                <button onClick={() => { setShowPendingApproval(false); setIsEditing(false); }} className="bg-brand-600 text-white font-bold py-3 px-8 rounded-xl w-full shadow-lg">מעולה</button>
            </div>
        </div>
      );
  }

  const inputClassName = "w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-3 text-sm focus:border-brand-500 outline-none transition-all shadow-sm";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all w-full max-w-4xl relative z-10 max-h-[92vh] flex flex-col">
            <div className="overflow-y-auto custom-scrollbar flex-1 relative bg-white">
                <div className="h-28 sm:h-32 bg-gradient-to-r from-brand-500 to-teal-600 relative shrink-0">
                    <button onClick={onClose} className="absolute top-4 left-4 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full backdrop-blur-sm z-30"><X className="w-5 h-5" /></button>
                    {(isOwnProfile || isAdmin) && !isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="absolute top-4 right-4 bg-white/90 text-brand-700 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all hover:bg-white hover:scale-105 active:scale-95 z-30"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            עריכת פרופיל
                        </button>
                    )}
                </div>

                <div className="px-6 sm:px-12 pb-10 relative">
                    {isEditing && editFormData ? (
                        <form onSubmit={handleSave} className="-mt-14 sm:-mt-16 relative bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-slate-100 space-y-6 z-20">
                            <div className="flex justify-center">
                                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                    <img src={editFormData.avatarUrl} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-2xl bg-white object-cover aspect-square" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div><label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">שם מלא</label><input required className={inputClassName} value={editFormData.name} onChange={e => setEditFormData(prev => prev ? ({...prev, name: e.target.value}) : null)} /></div>
                                <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">לינק לתיק עבודות / אתר</label><input className={inputClassName} value={editFormData.portfolioUrl} onChange={e => setEditFormData(prev => prev ? ({...prev, portfolioUrl: e.target.value}) : null)} placeholder="https://..." /></div>
                            </div>
                            
                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">מקצועות (עד 3)</label>
                                    <span className="text-[10px] font-bold text-slate-400">{(Array.isArray(editFormData.mainField) ? editFormData.mainField.length : 1)}/3</span>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <input 
                                        type="text" 
                                        list="edit-categories" 
                                        className={inputClassName} 
                                        placeholder="הוסף מקצוע..." 
                                        value={professionInput} 
                                        onChange={e => setProfessionInput(e.target.value)} 
                                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddProfession())} 
                                    />
                                    <datalist id="edit-categories">{availableCategories.map(c => <option key={c} value={c} />)}</datalist>
                                    <button type="button" onClick={handleAddProfession} className="bg-brand-600 text-white px-5 rounded-xl shrink-0 shadow-md hover:bg-brand-700 transition-all"><Plus className="w-5 h-5" /></button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(editFormData.mainField) ? editFormData.mainField : (editFormData.mainField ? [editFormData.mainField as unknown as string] : [])).map((prof, idx) => (
                                        <span key={idx} className="bg-white border border-slate-200 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                            {prof}
                                            <button type="button" onClick={() => setEditFormData(prev => {
                                                if (!prev) return null;
                                                const current = Array.isArray(prev.mainField) ? prev.mainField : (prev.mainField ? [prev.mainField as unknown as string] : []);
                                                return { ...prev, mainField: current.filter(p => p !== prof) };
                                            })} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div><label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">אודות</label><textarea className={`${inputClassName} h-28 resize-none`} value={editFormData.bio || ''} onChange={e => setEditFormData(prev => prev ? ({...prev, bio: e.target.value}) : null)} placeholder="ספר בקצרה על הניסיון והמומחיות שלך..."></textarea></div>
                            
                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                <label className="block text-xs font-black text-slate-700 mb-4 uppercase tracking-wider">גלריה</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                                    {editFormData.portfolioImages?.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button 
                                                type="button" 
                                                onClick={() => setEditFormData(prev => prev ? ({...prev, portfolioImages: prev.portfolioImages?.filter((_, i) => i !== idx)}) : null)}
                                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="מחק תמונה"
                                            >
                                                <Trash2 className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button" 
                                        onClick={() => portfolioInputRef.current?.click()}
                                        className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand-500 hover:text-brand-500 transition-all bg-white shadow-sm"
                                    >
                                        <Plus className="w-8 h-8 mb-1" />
                                        <span className="text-[10px] font-black">הוסף תמונה</span>
                                    </button>
                                </div>
                                <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'portfolio')} />
                            </div>

                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                <label className="block text-xs font-black text-slate-700 mb-3 uppercase tracking-wider">תחומי עניין נוספים</label>
                                <div className="flex gap-2 mb-4"><input type="text" list="profile-interests-list" className={inputClassName} placeholder="למשל: ספורט, קולינריה..." value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), interestInput && setEditFormData(prev => prev ? ({...prev, interests: Array.from(new Set([...(prev.interests || []), interestInput]))}) : null), setInterestInput(''))} /><datalist id="profile-interests-list">{availableInterests.map(int => <option key={int} value={int} />)}</datalist><button type="button" onClick={() => { if(interestInput) { setEditFormData(prev => prev ? ({...prev, interests: Array.from(new Set([...(prev.interests || []), interestInput]))}) : null); setInterestInput(''); } }} className="bg-brand-600 text-white px-5 rounded-xl shadow-md hover:bg-brand-700 transition-all"><Plus className="w-5 h-5" /></button></div>
                                <div className="flex flex-wrap gap-2">{editFormData.interests?.map((interest, idx) => (<span key={idx} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">{interest}<button type="button" onClick={() => setEditFormData(prev => prev ? ({...prev, interests: prev.interests?.filter(i => i !== interest)}) : null)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button></span>))}</div>
                            </div>
                            <div className="flex gap-4 justify-end pt-4 border-t border-slate-100"><button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 text-slate-500 text-sm font-bold hover:bg-slate-50 rounded-xl transition-colors">ביטול</button><button type="submit" disabled={isUploading || isSaving} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95">{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}שמור שינויים</button></div>
                        </form>
                    ) : (
                        <>
                            {/* HEADER SECTION - FIXED NAME POSITION */}
                            <div className="relative flex flex-col items-start -mt-14 sm:-mt-16 mb-10 z-20">
                                <div className="flex flex-row items-end gap-5 sm:gap-8 w-full">
                                    <div className="relative shrink-0">
                                        <img 
                                            src={displayProfile.avatarUrl} 
                                            className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-[6px] border-white shadow-2xl bg-white object-cover aspect-square" 
                                            alt={displayProfile.name}
                                        />
                                        {isOwnProfile && (
                                            <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm" title="מחובר"></div>
                                        )}
                                    </div>
                                    
                                    {/* Text Info - Pushed down to be fully on the white background */}
                                    <div className="flex-1 pt-12 sm:pt-16 text-right">
                                        <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-tight mb-2">
                                            {displayProfile.name}
                                        </h2>
                                        
                                        <div className="flex flex-wrap justify-start gap-2">
                                            {displayProfile.mainField && (Array.isArray(displayProfile.mainField) ? displayProfile.mainField.length > 0 : !!displayProfile.mainField) ? (
                                                (Array.isArray(displayProfile.mainField) ? displayProfile.mainField : [displayProfile.mainField as unknown as string]).slice(0, 3).map((prof, i) => (
                                                    <span key={i} className="bg-brand-50 text-brand-800 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border border-brand-100 flex items-center gap-1.5">
                                                        <Briefcase className="w-3 h-3 text-brand-600" />
                                                        {prof}
                                                    </span>
                                                ))
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 mt-6">
                                    {displayProfile.portfolioUrl && (
                                        <a 
                                            href={ensureProtocol(displayProfile.portfolioUrl)} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="bg-white border border-slate-200 text-slate-800 px-5 py-2 rounded-2xl text-[11px] font-bold hover:text-brand-600 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group active:scale-95"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                            {cleanUrlForDisplay(displayProfile.portfolioUrl)}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-12">
                                {/* ABOUT SECTION - SUBTLE BG */}
                                {displayProfile.bio && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <h3 className="font-bold text-lg text-slate-800 mb-4 text-right">
                                            אודות
                                        </h3>
                                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium text-right pr-4 border-r-2 border-brand-200">
                                                {displayProfile.bio}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* INTERESTS SECTION */}
                                {displayProfile.interests && displayProfile.interests.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-600">
                                        <h3 className="font-bold text-lg text-slate-800 mb-4 text-right">
                                            תחומי עניין
                                        </h3>
                                        <div className="flex flex-wrap justify-start gap-2">
                                            {displayProfile.interests.map((int, i) => (
                                                <span key={i} className="bg-white text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold border border-slate-100 flex items-center gap-1.5 shadow-sm transition-all hover:bg-brand-50 hover:border-brand-100">
                                                    <Heart className="w-3.5 h-3.5 text-brand-500 fill-brand-100" />
                                                    {int}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* GALLERY SECTION */}
                                {displayProfile.portfolioImages && displayProfile.portfolioImages.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <h3 className="font-bold text-lg text-slate-800 mb-6 text-right">
                                            גלריה
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                                            {displayProfile.portfolioImages.map((img, i) => (
                                                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-md cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                                    <img src={img} className="w-full h-full object-cover" alt={`עבודה ${i+1}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* OFFERS SECTION */}
                                <div className="border-t border-slate-100 pt-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-bold text-lg text-slate-800 text-right">
                                            הצעות פעילות
                                        </h3>
                                        <span className="bg-brand-100 text-brand-700 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                                            {userOffers.length} מודעות באוויר
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {userOffers.length > 0 ? (
                                            userOffers.map(offer => (
                                                <OfferCard 
                                                    key={offer.id} 
                                                    offer={offer} 
                                                    viewMode="compact" 
                                                    currentUserId={currentUser?.id} 
                                                    onUserClick={() => {}} 
                                                    onContact={() => { onClose(); onContact(displayProfile!); }} 
                                                    onRate={onRate} 
                                                    onDelete={isOwnProfile ? onDeleteOffer : undefined} 
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                                <p className="text-slate-400 font-bold text-sm">טרם פורסמו הצעות ברטר.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
