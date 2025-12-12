
import React, { useState, useEffect, useRef } from 'react';
import { X, Briefcase, ExternalLink, Heart, Pencil, Save, Plus, Image as ImageIcon, Camera, Upload, Tag, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { UserProfile, BarterOffer, ExpertiseLevel } from '../types';
import { OfferCard } from './OfferCard';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  currentUser: UserProfile | null;
  userOffers: BarterOffer[];
  onDeleteOffer: (offerId: string) => void;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
  onContact: (profile: UserProfile) => void;
  onRate?: (offerId: string, rating: number) => void;
  availableCategories: string[];
  availableInterests: string[];
  onApproveUpdate?: (userId: string) => void;
  onRejectUpdate?: (userId: string) => void;
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
          const MAX_WIDTH = 800; // Constrain width to 800px
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
              // Compress to JPEG at 0.7 quality
              resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
              reject(new Error("Could not get canvas context"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  profile, 
  currentUser,
  userOffers,
  onDeleteOffer,
  onUpdateProfile,
  onContact,
  onRate,
  availableCategories,
  availableInterests,
  onApproveUpdate,
  onRejectUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<UserProfile | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New saving state
  const [showPendingApproval, setShowPendingApproval] = useState(false);
  
  // State for adding new interests
  const [interestInput, setInterestInput] = useState('');
  
  // File Input Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === profile?.id;
  const isAdmin = currentUser?.role === 'admin';

  // Determine which data to show:
  // If I am viewing my own profile or I am an admin AND there are pending updates,
  // I want to see the PREVIEW of how it will look (merged state).
  // Regular users see the stable 'profile' state.
  let displayProfile = profile;
  
  // Logic: Show pending updates if I am the owner OR I am an admin viewing a user with updates
  if (profile && profile.pendingUpdate && (isOwnProfile || isAdmin)) {
      displayProfile = { ...profile, ...profile.pendingUpdate } as UserProfile;
  }

  // Sync edit form data when profile changes
  useEffect(() => {
    if (displayProfile) {
        setEditFormData(displayProfile);
    }
    setIsEditing(false);
    setShowPendingApproval(false); // Reset popup
    setInterestInput('');
    setIsSaving(false);
  }, [profile, isOpen, isOwnProfile, isAdmin]);

  if (!isOpen) return null;
  if (!displayProfile) return null; // Handle null profile safely

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
        setIsSaving(true);
        try {
            await onUpdateProfile(editFormData);
            
            if (isAdmin) {
                // Admin: Immediate close, no popup
                setIsEditing(false);
                setShowPendingApproval(false);
            } else {
                // User: Show Popup
                setShowPendingApproval(true);
            }
        } catch (err) {
            console.error(err);
            alert("שגיאה בשמירת הפרופיל");
        } finally {
            setIsSaving(false);
        }
    }
  };

  // Handle URL based image add
  const handleAddImage = () => {
    if (newImageUrl && editFormData) {
        setEditFormData({
            ...editFormData,
            portfolioImages: [...(editFormData.portfolioImages || []), newImageUrl]
        });
        setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    if (editFormData) {
        const newImages = [...(editFormData.portfolioImages || [])];
        newImages.splice(index, 1);
        setEditFormData({
            ...editFormData,
            portfolioImages: newImages
        });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'portfolio') => {
      const files = e.target.files;
      if (!files || files.length === 0 || !editFormData) return;

      setIsUploading(true);
      try {
          if (type === 'avatar') {
              // Avatar handles single file
              const file = files[0];
              const compressedDataUrl = await compressImage(file);
              setEditFormData(prev => prev ? ({ ...prev, avatarUrl: compressedDataUrl }) : null);
          } else {
              // Portfolio handles multiple files
              const promises = Array.from(files).map(file => compressImage(file as File));
              const compressedImages = await Promise.all(promises);
              
              setEditFormData(prev => prev ? ({
                  ...prev,
                  portfolioImages: [...(prev.portfolioImages || []), ...compressedImages]
              }) : null);
          }
      } catch (error) {
          console.error("Error processing image", error);
          alert("שגיאה בטעינת התמונה. נסה תמונה אחרת.");
      } finally {
          setIsUploading(false);
          // Reset input to allow selecting same file again
          e.target.value = '';
      }
  };

  // Interest Management
  const handleAddInterest = () => {
      if (!interestInput.trim() || !editFormData) return;
      const newInterest = interestInput.trim();
      
      // Prevent duplicates
      if (editFormData.interests?.includes(newInterest)) {
          setInterestInput('');
          return;
      }

      setEditFormData({
          ...editFormData,
          interests: [...(editFormData.interests || []), newInterest]
      });
      setInterestInput('');
  };

  const handleRemoveInterest = (interestToRemove: string) => {
      if (!editFormData) return;
      setEditFormData({
          ...editFormData,
          interests: (editFormData.interests || []).filter(i => i !== interestToRemove)
      });
  };

  // Popup Component for Pending Approval
  if (showPendingApproval && !isAdmin) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900 bg-opacity-75">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in shadow-2xl">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">השינויים נשמרו!</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    העדכון הועבר לבדיקת מנהל המערכת ויופיע באתר לכולם מיד לאחר האישור.
                </p>
                <button 
                    onClick={() => {
                        setShowPendingApproval(false);
                        setIsEditing(false); // Go back to "view mode" (previewing pending changes)
                    }}
                    className="bg-brand-600 text-white font-bold py-3 px-8 rounded-xl w-full hover:bg-brand-700 transition-colors shadow-lg"
                >
                    מצוין, תודה
                </button>
            </div>
        </div>
      );
  }

  const inputClassName = "w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl p-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm";

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-4xl w-full">
            
            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-brand-500 to-teal-600 relative">
                <button onClick={onClose} className="absolute top-4 left-4 bg-black/20 hover:bg-black/30 text-white p-2 rounded-full transition-all z-10 backdrop-blur-sm">
                    <X className="w-5 h-5" />
                </button>
                
                {isOwnProfile && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="absolute top-4 right-4 bg-white/90 text-brand-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-white transition-colors"
                    >
                        <Pencil className="w-3 h-3" />
                        ערוך פרופיל
                    </button>
                )}
            </div>

            <div className="px-8 pb-8">
                {isEditing && editFormData ? (
                    <form onSubmit={handleSave} className="-mt-12 relative bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                         
                         {/* Avatar Upload Section */}
                         <div className="mb-4 flex justify-center">
                             <div className="text-center relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                <img 
                                    src={editFormData.avatarUrl} 
                                    alt="Preview" 
                                    className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white mx-auto mb-2 object-cover aspect-square group-hover:opacity-75 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                </div>
                                <span className="text-xs text-brand-600 font-bold hover:underline">
                                    {isUploading ? 'מעלה...' : 'שנה תמונה'}
                                </span>
                                <input 
                                    type="file" 
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'avatar')}
                                />
                             </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                             <div>
                                 <label className="block text-xs font-bold text-slate-700 mb-1.5">שם מלא</label>
                                 <input 
                                    required
                                    className={inputClassName}
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-700 mb-1.5">תחום עיסוק ראשי</label>
                                 <input 
                                     list="edit-categories"
                                     className={inputClassName}
                                     value={editFormData.mainField}
                                     onChange={e => setEditFormData({...editFormData, mainField: e.target.value})}
                                     placeholder="בחר או הקלד חדש..."
                                 />
                                 <datalist id="edit-categories">
                                     {availableCategories.map(c => <option key={c} value={c} />)}
                                 </datalist>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-700 mb-1.5">רמת מומחיות</label>
                                 <select 
                                    className={inputClassName}
                                    value={editFormData.expertise}
                                    onChange={e => setEditFormData({...editFormData, expertise: e.target.value as ExpertiseLevel})}
                                 >
                                     {Object.values(ExpertiseLevel).map(l => <option key={l} value={l}>{l}</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-700 mb-1.5">לינק לתיק עבודות חיצוני</label>
                                 <input 
                                    className={inputClassName}
                                    placeholder="https://..."
                                    value={editFormData.portfolioUrl}
                                    onChange={e => setEditFormData({...editFormData, portfolioUrl: e.target.value})}
                                 />
                             </div>
                         </div>
                         
                         <div className="mb-5">
                             <label className="block text-xs font-bold text-slate-700 mb-1.5">קצת עליי (Bio)</label>
                             <textarea 
                                className={`${inputClassName} h-24`}
                                value={editFormData.bio || ''}
                                onChange={e => setEditFormData({...editFormData, bio: e.target.value})}
                             ></textarea>
                         </div>

                         {/* Interests Management Section */}
                         <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <label className="block text-xs font-bold text-slate-700 mb-2">תחומי עניין ותחביבים</label>
                             
                             <div className="flex gap-2 mb-3">
                                <div className="relative flex-1">
                                    <Tag className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                                    <input 
                                        type="text"
                                        list="profile-interests-list"
                                        className={`${inputClassName} pr-9`}
                                        placeholder="בחר או הוסף (למשל: ספורט, בישול)"
                                        value={interestInput}
                                        onChange={e => setInterestInput(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                                    />
                                    <datalist id="profile-interests-list">
                                        {availableInterests.map(int => (
                                          <option key={int} value={int} />
                                        ))}
                                    </datalist>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleAddInterest}
                                    disabled={!interestInput.trim()}
                                    className="bg-brand-600 text-white px-4 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                             </div>

                             <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                                 {editFormData.interests?.map((interest, idx) => (
                                     <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 shadow-sm group hover:border-red-200">
                                         {interest}
                                         <button 
                                            type="button" 
                                            onClick={() => handleRemoveInterest(interest)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                         >
                                             <X className="w-3.5 h-3.5" />
                                         </button>
                                     </span>
                                 ))}
                                 {(!editFormData.interests || editFormData.interests.length === 0) && (
                                     <span className="text-xs text-slate-400 italic">טרם הוגדרו תחומי עניין. הוסף למעלה.</span>
                                 )}
                             </div>
                         </div>
                         
                         {/* Portfolio Images Edit Section */}
                         <div className="mb-6 border-t border-slate-100 pt-4">
                            <label className="block text-xs font-bold text-slate-700 mb-3">תמונות לתיק העבודות</label>
                            
                            <div className="flex gap-2 mb-3 items-center">
                                {/* File Upload Button */}
                                <button
                                    type="button"
                                    onClick={() => !isUploading && portfolioInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="bg-slate-100 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center gap-2 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {isUploading ? 'מעלה...' : 'העלאת תמונות'}
                                </button>
                                <input 
                                    type="file"
                                    ref={portfolioInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple // Allow multiple files
                                    onChange={(e) => handleFileUpload(e, 'portfolio')}
                                />

                                <span className="text-slate-300 mx-1">|</span>

                                {/* URL Input Fallback */}
                                <input 
                                    type="text" 
                                    className={inputClassName}
                                    placeholder="או הדבק קישור..."
                                    value={newImageUrl}
                                    onChange={e => setNewImageUrl(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddImage}
                                    disabled={!newImageUrl}
                                    className="bg-brand-50 text-brand-600 px-3.5 py-2.5 rounded-lg hover:bg-brand-100 disabled:opacity-50 border border-brand-100"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-3">
                                {editFormData.portfolioImages?.map((img, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden group border border-slate-200 shadow-sm">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute inset-0 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {(!editFormData.portfolioImages || editFormData.portfolioImages.length === 0) && (
                                    <div className="text-xs text-slate-400 p-2 italic bg-slate-50 rounded-lg w-full text-center border border-dashed border-slate-200">
                                        עדיין לא הועלו תמונות לתיק העבודות
                                    </div>
                                )}
                            </div>
                         </div>

                         <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                             <button 
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-5 py-2.5 text-slate-600 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors"
                             >
                                 ביטול
                             </button>
                             <button 
                                type="submit"
                                disabled={isUploading || isSaving}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                             >
                                 {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                 ) : (
                                    <Save className="w-4 h-4" />
                                 )}
                                 {isAdmin ? 'שמור ועדכן מידית' : 'שמור (שלח לאישור)'}
                             </button>
                         </div>
                    </form>
                ) : (
                    <>
                        {/* Avatar & Basic Info Display */}
                        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 mb-8 gap-4">
                            <div className="flex items-end gap-5">
                                <img 
                                    src={displayProfile.avatarUrl} 
                                    alt={displayProfile.name} 
                                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-white object-cover aspect-square shrink-0"
                                />
                                <div className="pb-2">
                                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">{displayProfile.name}</h2>
                                    <p className="text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                                        <Briefcase className="w-4 h-4 shrink-0" />
                                        {displayProfile.mainField} • <span className="text-brand-600">{displayProfile.expertise}</span>
                                    </p>
                                </div>
                            </div>
                            {displayProfile.portfolioUrl && (
                                <div className="w-full sm:w-auto flex justify-start sm:justify-end sm:mb-2">
                                    <a 
                                        href={displayProfile.portfolioUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-brand-600 flex items-center justify-center gap-2 shadow-sm transition-all w-full sm:w-auto"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        תיק עבודות
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Bio Section */}
                        {displayProfile.bio && (
                            <div className="mb-8">
                                <h3 className="font-bold text-slate-900 mb-3 text-lg">אודות</h3>
                                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {displayProfile.bio}
                                </p>
                            </div>
                        )}

                         {/* Visual Portfolio Section */}
                         {displayProfile.portfolioImages && displayProfile.portfolioImages.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-lg">
                                    <ImageIcon className="w-5 h-5 text-brand-500" />
                                    גלריית עבודות
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {displayProfile.portfolioImages.map((img, idx) => (
                                        <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                                            <img src={img} alt={`Work ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interests Section */}
                        {displayProfile.interests && displayProfile.interests.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-lg">
                                    <Heart className="w-5 h-5 text-brand-500" />
                                    תחומי עניין
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {displayProfile.interests.map((interest, idx) => (
                                        <span key={idx} className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-sm font-medium border border-slate-200">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-slate-100 pt-8">
                            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2 text-lg">
                                {isOwnProfile ? 'ההצעות שלי' : `הצעות שפורסמו ע"י ${displayProfile.name.split(' ')[0]}`}
                                <span className="bg-brand-50 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                    {userOffers.length}
                                </span>
                            </h3>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {userOffers.length > 0 ? (
                                    userOffers.map(offer => (
                                        <OfferCard 
                                            key={offer.id}
                                            offer={offer}
                                            viewMode="compact"
                                            currentUserId={currentUser?.id}
                                            onUserClick={() => {}} // User is already viewing profile
                                            onContact={() => {
                                                onClose(); // Close profile modal first
                                                onContact(displayProfile); // Open messages
                                            }}
                                            onRate={onRate}
                                            onDelete={isOwnProfile ? onDeleteOffer : undefined}
                                        />
                                    ))
                                ) : (
                                    <p className="text-slate-500 text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        {isOwnProfile ? 'לא פרסמת עדיין הצעות.' : 'משתמש זה לא פרסם הצעות פעילות.'}
                                    </p>
                                )}
                            </div>
                        </div>

                         {/* Pending Changes Review Section (Bottom) */}
                         {/* Crucial fix: Don't show this if I am an admin viewing my own profile, as changes are instant */}
                         {profile?.pendingUpdate && (!isOwnProfile || !isAdmin) && (
                             <div className="mt-8 border-t-2 border-yellow-200 pt-6 animate-in slide-in-from-bottom-2">
                                {isAdmin ? (
                                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-yellow-900 text-lg">בקשה לשינוי פרופיל</h3>
                                                <p className="text-sm text-yellow-700">
                                                    אתה צופה בגרסה המעודכנת (תצוגה מקדימה). אשר או דחה את השינויים.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end">
                                            <button 
                                                onClick={() => onRejectUpdate && onRejectUpdate(profile.id)}
                                                className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-red-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                דחה
                                            </button>
                                            <button 
                                                onClick={() => onApproveUpdate && onApproveUpdate(profile.id)}
                                                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-700 shadow-sm"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                אשר שינויים
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
                                        <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 shrink-0">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-yellow-900 text-lg">השינויים נשמרו וממתינים לאישור</h3>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                אתה צופה בתצוגה מקדימה של הפרופיל. שאר המשתמשים יראו את העדכון רק לאחר אישור מנהל המערכת.
                                            </p>
                                        </div>
                                    </div>
                                )}
                             </div>
                         )}
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
