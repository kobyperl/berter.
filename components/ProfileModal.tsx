
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
          if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.7)); } 
          else { reject(new Error("Context Error")); }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
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
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const isOwnProfile = currentUser?.id === profile?.id;
  const isAdmin = currentUser?.role === 'admin';

  let displayProfile = profile;
  if (profile && profile.pendingUpdate && (isOwnProfile || isAdmin)) displayProfile = { ...profile, ...profile.pendingUpdate } as UserProfile;

  useEffect(() => {
    if (displayProfile) setEditFormData(displayProfile);
    if (isOpen && startInEditMode && (isOwnProfile || isAdmin)) setIsEditing(true);
    else if (!isOpen) setIsEditing(false);
    setShowPendingApproval(false); setInterestInput(''); setIsSaving(false);
  }, [profile, isOpen, isOwnProfile, isAdmin, startInEditMode]);

  if (!isOpen || !displayProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
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
            <div className="h-24 sm:h-32 bg-gradient-to-r from-brand-500 to-teal-600 relative shrink-0">
                <button onClick={onClose} className="absolute top-3 left-3 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full backdrop-blur-sm z-10"><X className="w-5 h-5" /></button>
                {(isOwnProfile || isAdmin) && !isEditing && (<button onClick={() => setIsEditing(true)} className="absolute top-3 right-3 bg-white/90 text-brand-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-colors hover:bg-white"><Pencil className="w-3 h-3" />עריכה</button>)}
            </div>
            <div className="px-4 sm:px-8 pb-8 overflow-y-auto custom-scrollbar flex-1">
                {isEditing && editFormData ? (
                    <form onSubmit={handleSave} className="-mt-10 relative bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 space-y-5">
                         <div className="flex justify-center"><div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}><img src={editFormData.avatarUrl} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-md bg-white object-cover aspect-square" /><div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100"><Camera className="w-5 h-5 text-white" /></div><input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} /></div></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">שם מלא</label><input required className={inputClassName} value={editFormData.name} onChange={e => setEditFormData(prev => prev ? ({...prev, name: e.target.value}) : null)} /></div>
                             <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">תחום עיסוק</label><input list="edit-categories" className={inputClassName} value={editFormData.mainField} onChange={e => setEditFormData(prev => prev ? ({...prev, mainField: e.target.value}) : null)} /><datalist id="edit-categories">{availableCategories.map(c => <option key={c} value={c} />)}</datalist></div>
                             <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">לינק לתיק עבודות</label><input className={inputClassName} value={editFormData.portfolioUrl} onChange={e => setEditFormData(prev => prev ? ({...prev, portfolioUrl: e.target.value}) : null)} /></div>
                         </div>
                         <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">אודות</label><textarea className={`${inputClassName} h-20 resize-none`} value={editFormData.bio || ''} onChange={e => setEditFormData(prev => prev ? ({...prev, bio: e.target.value}) : null)}></textarea></div>
                         
                         <div className="bg-white p-4 rounded-xl border border-slate-100">
                             <label className="block text-xs font-bold text-slate-700 mb-3">גלריית עבודות</label>
                             <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                                 {editFormData.portfolioImages?.map((img, idx) => (
                                     <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm group">
                                         <img src={img} className="w-full h-full object-cover" />
                                         <button 
                                             type="button" 
                                             onClick={() => setEditFormData(prev => prev ? ({...prev, portfolioImages: prev.portfolioImages?.filter((_, i) => i !== idx)}) : null)}
                                             className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                             title="מחק תמונה"
                                         >
                                             <Trash2 className="w-5 h-5" />
                                         </button>
                                     </div>
                                 ))}
                                 <button 
                                     type="button" 
                                     onClick={() => portfolioInputRef.current?.click()}
                                     className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand-500 hover:text-brand-500 transition-all bg-white"
                                 >
                                     <Plus className="w-6 h-6 mb-1" />
                                     <span className="text-[10px] font-bold">הוסף</span>
                                 </button>
                             </div>
                             <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'portfolio')} />
                         </div>

                         <div className="bg-white p-4 rounded-xl border border-slate-100">
                             <label className="block text-xs font-bold text-slate-700 mb-2">תחומי עניין</label>
                             <div className="flex gap-2 mb-3"><input type="text" list="profile-interests-list" className={inputClassName} placeholder="הוסף..." value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), setEditFormData(prev => prev ? ({...prev, interests: [...(prev.interests || []), interestInput]}) : null), setInterestInput(''))} /><datalist id="profile-interests-list">{availableInterests.map(int => <option key={int} value={int} />)}</datalist><button type="button" onClick={() => { if(interestInput) { setEditFormData(prev => prev ? ({...prev, interests: [...(prev.interests || []), interestInput]}) : null); setInterestInput(''); } }} className="bg-brand-600 text-white px-4 rounded-xl"><Plus className="w-5 h-5" /></button></div>
                             <div className="flex flex-wrap gap-2">{editFormData.interests?.map((interest, idx) => (<span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-sm">{interest}<button type="button" onClick={() => setEditFormData(prev => prev ? ({...prev, interests: prev.interests?.filter(i => i !== interest)}) : null)} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button></span>))}</div>
                         </div>
                         <div className="flex gap-2 justify-end border-t pt-4"><button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 text-sm font-bold">ביטול</button><button type="submit" disabled={isUploading || isSaving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}שמור שינויים</button></div>
                    </form>
                ) : (
                    <>
                        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-10 mb-6 gap-4">
                            <div className="flex items-end gap-4">
                                <img src={displayProfile.avatarUrl} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg bg-white object-cover aspect-square" />
                                <div className="pb-1 pt-2">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{displayProfile.name}</h2>
                                    <p className="text-slate-500 flex items-center gap-1 mt-1 text-sm font-medium"><Briefcase className="w-4 h-4" />{displayProfile.mainField || 'טרם עודכן תחום'}</p>
                                </div>
                            </div>
                            {displayProfile.portfolioUrl && (<a href={displayProfile.portfolioUrl} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl text-xs font-bold hover:text-brand-600 shadow-sm transition-all w-full sm:w-auto text-center flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" />תיק עבודות</a>)}
                        </div>
                        {displayProfile.interests && displayProfile.interests.length > 0 && (
                            <div className="mb-6 flex flex-wrap gap-2">
                                {displayProfile.interests.map((int, i) => (
                                    <span key={i} className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-bold border border-brand-100 flex items-center gap-1"><Heart className="w-3 h-3" />{int}</span>
                                ))}
                            </div>
                        )}
                        {displayProfile.bio && (<div className="mb-6"><h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wider text-slate-400">אודות</h3><p className="text-slate-600 text-sm leading-relaxed bg-white p-4 rounded-xl border border-slate-100">{displayProfile.bio}</p></div>)}
                        
                        {displayProfile.portfolioImages && displayProfile.portfolioImages.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider text-slate-400">גלריית עבודות</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {displayProfile.portfolioImages.map((img, i) => (
                                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all">
                                            <img src={img} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">הצעות שפורסמו <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{userOffers.length}</span></h3>
                            <div className="space-y-3 pr-1">
                                {userOffers.length > 0 ? userOffers.map(offer => (<OfferCard key={offer.id} offer={offer} viewMode="compact" currentUserId={currentUser?.id} onUserClick={() => {}} onContact={() => { onClose(); onContact(displayProfile!); }} onRate={onRate} onDelete={isOwnProfile ? onDeleteOffer : undefined} />)) : (<p className="text-slate-400 text-center py-8 bg-white rounded-xl border-dashed border">אין הצעות פעילות.</p>)}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};