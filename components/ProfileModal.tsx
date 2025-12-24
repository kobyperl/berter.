
import React, { useState, useEffect, useRef } from 'react';
import { X, Briefcase, ExternalLink, Heart, Pencil, Save, Plus, Image as ImageIcon, Camera, Upload, Tag, AlertCircle, CheckCircle, XCircle, Loader2, ChevronRight, ChevronLeft, PlusCircle, Sparkles } from 'lucide-react';
import { UserProfile, BarterOffer, ExpertiseLevel } from '../types';
import { OfferCard } from './OfferCard';
import firebase, { db } from '../services/firebaseConfig';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  currentUser: UserProfile | null;
  userOffers: BarterOffer[];
  onDeleteOffer: (offerId: string) => void | Promise<void>;
  onEditOffer?: (offer: BarterOffer) => void;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
  onContact: (profile: UserProfile) => void;
  onRate?: (offerId: string, rating: number) => void;
  availableCategories: string[];
  availableInterests: string[];
  onApproveUpdate?: (userId: string) => void;
  onRejectUpdate?: (userId: string) => void;
  startInEditMode?: boolean;
  onOpenCreateOffer?: (profile: UserProfile) => void; 
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
          const MAX_WIDTH = 800; 
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else { reject(new Error("Could not get canvas context")); }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, onClose, profile, currentUser, userOffers, onDeleteOffer, onEditOffer, onUpdateProfile, onContact, onRate, availableCategories, availableInterests, onApproveUpdate, onRejectUpdate, startInEditMode = false, onOpenCreateOffer
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<UserProfile | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPendingApproval, setShowPendingApproval] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null); 
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === profile?.id;
  const isAdmin = currentUser?.role === 'admin';

  let displayProfile = profile;
  if (profile && profile.pendingUpdate && (isOwnProfile || isAdmin)) {
      displayProfile = { ...profile, ...profile.pendingUpdate } as UserProfile;
  }

  useEffect(() => {
    if (displayProfile) { setEditFormData(displayProfile); }
    if (isOpen && startInEditMode && (isOwnProfile || isAdmin)) { setIsEditing(true); } 
    else if (!isOpen) { setIsEditing(false); }
    setShowPendingApproval(false); 
    setInterestInput('');
    setIsSaving(false);
    setLightboxIndex(null);
  }, [profile, isOpen, isOwnProfile, isAdmin, startInEditMode]);

  if (!isOpen || !displayProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
        setIsSaving(true);
        try {
            const dataToSave = { ...editFormData, portfolioUrl: normalizeUrl(editFormData.portfolioUrl) };
            await onUpdateProfile(dataToSave);
            if (isAdmin) { setIsEditing(false); setShowPendingApproval(false); } 
            else { setShowPendingApproval(true); }
        } catch (err) { alert("שגיאה בשמירת הפרופיל"); } 
        finally { setIsSaving(false); }
    }
  };

  const handleRemoveImage = (index: number) => {
    if (editFormData) {
        const newImages = [...(editFormData.portfolioImages || [])];
        newImages.splice(index, 1);
        setEditFormData({ ...editFormData, portfolioImages: newImages });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'portfolio') => {
      const files = e.target.files;
      if (!files || files.length === 0 || !editFormData) return;
      setIsUploading(true);
      try {
          if (type === 'avatar') {
              const compressedDataUrl = await compressImage(files[0]);
              setEditFormData(prev => prev ? ({ ...prev, avatarUrl: compressedDataUrl }) : null);
          } else {
              const promises = Array.from(files).map(file => compressImage(file as File));
              const compressedImages = await Promise.all(promises);
              setEditFormData(prev => prev ? ({ ...prev, portfolioImages: [...(prev.portfolioImages || []), ...compressedImages] }) : null);
          }
      } catch (error) { alert("שגיאה בטעינת התמונה."); } 
      finally { setIsUploading(false); e.target.value = ''; }
  };

  const handleAddInterest = (interest: string) => {
      const val = interest.trim();
      if (!val || !editFormData) return;
      if (editFormData.interests?.includes(val)) { setInterestInput(''); return; }
      
      setEditFormData({ ...editFormData, interests: [...(editFormData.interests || []), val] });
      if (!availableInterests.includes(val)) {
          db.collection("system").doc("taxonomy").update({
              pendingInterests: firebase.firestore.FieldValue.arrayUnion(val)
          }).catch(e => console.error("Taxonomy push failed", e));
      }
      setInterestInput('');
  };

  const toggleInterest = (interest: string) => {
      if (!editFormData) return;
      const current = editFormData.interests || [];
      const updated = current.includes(interest) ? current.filter(i => i !== interest) : [...current, interest];
      setEditFormData({ ...editFormData, interests: updated });
  };

  const handleNextImage = (e: React.MouseEvent) => { e.stopPropagation(); if (displayProfile?.portfolioImages && lightboxIndex !== null) setLightboxIndex((lightboxIndex + 1) % displayProfile.portfolioImages.length); };
  const handlePrevImage = (e: React.MouseEvent) => { e.stopPropagation(); if (displayProfile?.portfolioImages && lightboxIndex !== null) setLightboxIndex((lightboxIndex - 1 + displayProfile.portfolioImages.length) % displayProfile.portfolioImages.length); };

  if (showPendingApproval && !isAdmin) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900 bg-opacity-75 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center animate-in fade-in zoom-in shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-yellow-600" /></div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">השינויים נשמרו!</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">העדכון הועבר לבדיקת מנהל המערכת ויופיע באתר לכולם מיד לאחר האישור.</p>
                <button onClick={() => { setShowPendingApproval(false); setIsEditing(false); }} className="bg-brand-600 text-white font-bold py-3 px-8 rounded-xl w-full hover:bg-brand-700 transition-colors shadow-lg">מצוין, תודה</button>
            </div>
        </div>
      );
  }

  const inputClassName = "w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl p-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm";

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block bg-white rounded-2xl text-right shadow-xl transform transition-all sm:max-w-4xl w-full max-h-[90vh] flex flex-col relative z-50 overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-brand-500 to-teal-600 relative shrink-0 z-0">
                <button onClick={onClose} className="absolute top-4 left-4 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-all z-10 backdrop-blur-sm"><X className="w-5 h-5" /></button>
                {(isOwnProfile || isAdmin) && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 bg-white text-brand-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"><Pencil className="w-3 h-3" />{isAdmin && !isOwnProfile ? 'ערוך (מנהל)' : 'ערוך פרופיל'}</button>
                )}
            </div>
            
            <div className="px-6 pb-6 overflow-y-auto custom-scrollbar relative z-10 flex-1">
                {isEditing && editFormData ? (
                    <form onSubmit={handleSave} className="-mt-10 relative z-20 bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-4">
                         <div className="mb-4 flex justify-center">
                             <div className="text-center relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                <img src={editFormData.avatarUrl} alt="Preview" className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white mx-auto mb-1 object-cover aspect-square group-hover:opacity-75 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="bg-black bg-opacity-50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-4 h-4" /></div></div>
                                <span className="text-[10px] text-brand-600 font-bold hover:underline">{isUploading ? 'מעלה...' : 'שנה תמונה'}</span>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                             </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <div><label className="block text-[11px] font-bold text-slate-700 mb-1">שם מלא</label><input required className={inputClassName} value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} /></div>
                             <div><label className="block text-[11px] font-bold text-slate-700 mb-1">תחום עיסוק ראשי</label><input list="edit-categories" className={inputClassName} value={editFormData.mainField} onChange={e => setEditFormData({...editFormData, mainField: e.target.value})} placeholder="בחר או הקלד..." /><datalist id="edit-categories">{availableCategories.map(c => <option key={c} value={c} />)}</datalist></div>
                             <div><label className="block text-[11px] font-bold text-slate-700 mb-1">לינק לתיק עבודות</label><input type="text" className={inputClassName} placeholder="www.example.co.il" value={editFormData.portfolioUrl} onChange={e => setEditFormData({...editFormData, portfolioUrl: e.target.value})} /></div>
                         </div>
                         <div className="mb-4"><label className="block text-[11px] font-bold text-slate-700 mb-1">קצת עליי (Bio)</label><textarea className={`${inputClassName} h-20`} value={editFormData.bio || ''} onChange={e => setEditFormData({...editFormData, bio: e.target.value})}></textarea></div>
                         
                         <div className="mb-4">
                             <label className="block text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-amber-400" />תחומי עניין ונושאים</label>
                             <div className="relative">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            list="profile-interests-list"
                                            className={inputClassName} 
                                            placeholder="הוסף נושא..." 
                                            value={interestInput} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (availableInterests.includes(val)) {
                                                    handleAddInterest(val);
                                                } else {
                                                    setInterestInput(val);
                                                }
                                            }}
                                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddInterest(interestInput))} 
                                        />
                                        <datalist id="profile-interests-list">{availableInterests.filter(i => !editFormData.interests?.includes(i)).map(int => <option key={int} value={int} />)}</datalist>
                                    </div>
                                    <button type="button" onClick={() => handleAddInterest(interestInput)} disabled={!interestInput.trim()} className="bg-slate-800 text-white px-4 rounded-xl hover:bg-black transition-colors disabled:opacity-50 shadow-sm"><Plus className="w-4 h-4" /></button>
                                </div>
                             </div>
                             
                             <div className="flex flex-wrap gap-2 mt-3">
                                 {editFormData.interests?.map((interest) => (
                                     <span key={interest} className="bg-brand-50 border border-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                         {interest}
                                         <button type="button" onClick={() => toggleInterest(interest)} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                     </span>
                                 ))}
                             </div>
                         </div>

                         <div className="mb-4 border-t border-slate-100 pt-3">
                            <label className="block text-[11px] font-bold text-slate-700 mb-2">תמונות לגלריה</label>
                            <div className="flex gap-2 mb-2 items-center">
                                <button type="button" onClick={() => !isUploading && portfolioInputRef.current?.click()} disabled={isUploading} className="shrink-0 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5 border border-slate-200 disabled:opacity-50 transition-all">{isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}{isUploading ? 'מעלה...' : 'העלאה'}</button>
                                <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'portfolio')} />
                                <input type="text" className={`${inputClassName} h-9 text-xs py-1`} placeholder="או הדבק URL..." value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} />
                                <button type="button" onClick={() => { if(newImageUrl) { setEditFormData({...editFormData, portfolioImages: [...(editFormData.portfolioImages || []), newImageUrl]}); setNewImageUrl(''); } }} disabled={!newImageUrl} className="shrink-0 bg-brand-50 text-brand-600 px-3 py-2 rounded-xl hover:bg-brand-100 border border-brand-100 transition-colors"><Plus className="w-4 h-4" /></button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {editFormData.portfolioImages?.map((img, idx) => (
                                    <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden group border border-slate-200 shadow-sm"><img src={img} alt="" className="w-full h-full object-cover" /><button type="button" onClick={() => { const ni = [...(editFormData.portfolioImages||[])]; ni.splice(idx,1); setEditFormData({...editFormData, portfolioImages: ni}); }} className="absolute inset-0 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><X className="w-4 h-4" /></button></div>
                                ))}
                            </div>
                         </div>
                         <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                             <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 text-slate-500 text-sm font-bold hover:bg-slate-50 rounded-xl transition-colors">ביטול</button>
                             <button type="submit" disabled={isUploading || isSaving} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isAdmin ? 'שמור (מנהל)' : 'שמור לאישור'}</button>
                         </div>
                    </form>
                ) : (
                    <>
                        <div className="relative z-20 flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-10 mb-6 gap-4">
                            <div className="flex items-end gap-4">
                                <img src={displayProfile.avatarUrl} alt={displayProfile.name} className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white object-cover aspect-square shrink-0" />
                                <div className="pb-1"> 
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">{displayProfile.name}</h2>
                                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium"><Briefcase className="w-3.5 h-3.5 shrink-0" />{displayProfile.mainField}</p>
                                </div>
                            </div>
                            {displayProfile.portfolioUrl && (
                                <div className="w-full sm:w-auto flex justify-start sm:justify-end sm:mb-1">
                                    <a href={displayProfile.portfolioUrl} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-brand-600 flex items-center justify-center gap-2 shadow-sm transition-all w-full sm:w-auto"><ExternalLink className="w-3.5 h-3.5" />תיק עבודות</a>
                                </div>
                            )}
                        </div>
                        {displayProfile.bio && (
                            <div className="mb-6"><h3 className="font-bold text-slate-900 mb-2 text-sm">אודות</h3><p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{displayProfile.bio}</p></div>
                        )}
                        {displayProfile.interests && displayProfile.interests.length > 0 && (
                             <div className="mb-6">
                                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-sm"><Heart className="w-4 h-4 text-amber-400" />תחומי עניין</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {displayProfile.interests.map(interest => (
                                        <span key={interest} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">{interest}</span>
                                    ))}
                                </div>
                             </div>
                        )}
                         {displayProfile.portfolioImages && displayProfile.portfolioImages.length > 0 && (
                            <div className="mb-6"><h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-sm"><ImageIcon className="w-4 h-4 text-brand-500" />גלריה</h3><div className="grid grid-cols-4 sm:grid-cols-5 gap-2">{displayProfile.portfolioImages.map((img, idx) => (<div key={idx} onClick={() => setLightboxIndex(idx)} className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm group cursor-pointer"><img src={img} alt={`Work ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>))}</div></div>
                        )}
                        <div className="border-t border-slate-100 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">{isOwnProfile ? 'ההצעות שלי' : `הצעות של ${displayProfile.name.split(' ')[0]}`}<span className="bg-brand-50 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{userOffers.length}</span></h3>
                                {(isOwnProfile || isAdmin) && onOpenCreateOffer && (
                                    <button 
                                        onClick={() => onOpenCreateOffer(displayProfile!)}
                                        className="flex items-center gap-1.5 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-100 border border-brand-100 transition-all shadow-sm"
                                    >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        {isAdmin && !isOwnProfile ? `פרסם בשם ${displayProfile.name.split(' ')[0]}` : 'פרסם הצעה'}
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3 pr-1">
                                {userOffers.length > 0 ? userOffers.map(offer => (
                                    <OfferCard 
                                        key={offer.id} offer={offer} viewMode="compact" currentUserId={currentUser?.id} onUserClick={() => {}} onContact={() => { onClose(); onContact(displayProfile!); }} onRate={onRate} onDelete={(isOwnProfile || isAdmin) ? onDeleteOffer : undefined} onEdit={(isOwnProfile || isAdmin) ? onEditOffer : undefined} 
                                    />
                                )) : (<p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">{isOwnProfile ? 'לא פרסמת עדיין הצעות.' : 'אין כרגע הצעות פעילות.'}</p>)}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>
      {lightboxIndex !== null && displayProfile.portfolioImages && (
          <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
              <button onClick={() => setLightboxIndex(null)} className="absolute top-6 left-6 text-white/70 hover:text-white p-2 transition-colors z-50 bg-black/20 rounded-full"><X className="w-8 h-8" /></button>
              <div className="relative w-full max-w-5xl flex items-center justify-center group">
                  {displayProfile.portfolioImages.length > 1 && (
                      <><button onClick={handleNextImage} className="absolute right-0 sm:-right-16 text-white/50 hover:text-white p-4 transition-all hover:scale-110 z-50"><ChevronRight className="w-12 h-12" /></button><button onClick={handlePrevImage} className="absolute left-0 sm:-left-16 text-white/50 hover:text-white p-4 transition-all hover:scale-110 z-50"><ChevronLeft className="w-12 h-12" /></button></>
                  )}
                  <div className="relative overflow-hidden rounded-lg shadow-2xl max-h-[90vh]"><img src={displayProfile.portfolioImages[lightboxIndex]} className="max-w-full max-h-[85vh] object-contain animate-in zoom-in-95 duration-300" alt="Gallery" /><div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white text-center"><span className="text-sm font-bold opacity-80">{lightboxIndex + 1} / {displayProfile.portfolioImages.length}</span></div></div>
              </div>
          </div>
      )}
    </div>
  );
};
