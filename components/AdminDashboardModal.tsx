
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Shield, FileText, BarChart3, Megaphone, 
  Search, RefreshCw, Mail, Trash2, CheckCircle, 
  Edit, Plus, Upload, Save, Link as LinkIcon, 
  Target, Copy, Pencil, LayoutDashboard, Check 
} from 'lucide-react';
import { UserProfile, BarterOffer, SystemAd } from '../types';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  // User Data
  users: UserProfile[];
  currentUser: UserProfile | null;
  onDeleteUser: (userId: string) => void;
  onApproveUpdate: (userId: string) => void;
  onRejectUpdate: (userId: string) => void;
  // Offer Data
  offers: BarterOffer[];
  onDeleteOffer: (offerId: string) => void;
  onBulkDelete: (dateThreshold: string) => void;
  onApproveOffer: (offerId: string) => void;
  onEditOffer: (offer: BarterOffer) => void;
  // Analytics/Taxonomy Data
  availableCategories: string[];
  availableInterests: string[];
  pendingCategories: string[];
  pendingInterests: string[];
  onAddCategory: (category: string) => void;
  onAddInterest: (interest: string) => void;
  onDeleteCategory: (category: string) => void;
  onDeleteInterest: (interest: string) => void;
  onApproveCategory: (category: string) => void;
  onRejectCategory: (category: string) => void;
  onReassignCategory: (oldCategory: string, newCategory: string) => void;
  onApproveInterest: (interest: string) => void;
  onRejectInterest: (interest: string) => void;
  // Ads Data
  ads: SystemAd[];
  onAddAd: (ad: SystemAd) => void;
  onEditAd: (ad: SystemAd) => void;
  onDeleteAd: (id: string) => void;
  // Shared
  onViewProfile: (profile: UserProfile) => void;
}

// Helper for image compression
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
          if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); } 
          else { reject(new Error("Could not get canvas context")); }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
};

// --- Internal Component: 2-Step Delete Button ---
const DeleteToggleButton = ({ onDelete, className = "" }: { onDelete: () => void, className?: string }) => {
    const [isConfirming, setIsConfirming] = useState(false);
    
    // Auto-reset confirmation after 3 seconds if not clicked
    useEffect(() => {
        if(isConfirming) {
            const timer = setTimeout(() => setIsConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isConfirming]);

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isConfirming) {
                    onDelete();
                    setIsConfirming(false);
                } else {
                    setIsConfirming(true);
                }
            }}
            className={`p-2 rounded-lg transition-all flex items-center justify-center z-20 ${
                isConfirming 
                ? 'bg-red-600 text-white w-auto px-3 shadow-md' 
                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
            } ${className}`}
            title={isConfirming ? "לחץ שוב לאישור סופי" : "מחק"}
        >
            {isConfirming ? (
                <span className="text-xs font-bold whitespace-nowrap animate-in fade-in">בטוח?</span>
            ) : (
                <Trash2 className="w-4 h-4 pointer-events-none" />
            )}
        </button>
    );
};

type TabType = 'users' | 'content' | 'data' | 'ads';

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  
  // --- Local State ---
  const [userSearch, setUserSearch] = useState('');
  const [contentTab, setContentTab] = useState<'pending' | 'all'>('pending');
  const [dateThreshold, setDateThreshold] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dataTab, setDataTab] = useState<'categories' | 'interests' | 'pending'>('categories');
  const [newDataInput, setNewDataInput] = useState('');
  const [reassignTarget, setReassignTarget] = useState<string | null>(null);
  const [reassignDestination, setReassignDestination] = useState('');
  
  // Ads State
  const [adEditId, setAdEditId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState<Partial<SystemAd>>({ 
      title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '' 
  });
  const [targetCategories, setTargetCategories] = useState<string[]>(['Global']);
  const [targetInterests, setTargetInterests] = useState<string[]>([]);
  const [catSearch, setCatSearch] = useState('');
  const [intSearch, setIntSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!props.isOpen) return null;

  const pendingUserUpdates = props.users.filter(u => u.pendingUpdate).length;
  const pendingOffersCount = props.offers.filter(o => o.status === 'pending').length;
  const pendingDataCount = props.pendingCategories.length + props.pendingInterests.length;

  // --- Handlers ---

  const handleEditAdClick = (ad: SystemAd) => {
      setAdEditId(ad.id);
      setAdForm({
          title: ad.title,
          description: ad.description,
          ctaText: ad.ctaText,
          linkUrl: ad.linkUrl,
          imageUrl: ad.imageUrl,
          subLabel: ad.subLabel || ''
      });
      setTargetCategories(ad.targetCategories || ['Global']);
      setTargetInterests(ad.targetInterests || []);
  };

  const handleDuplicateAd = (ad: SystemAd) => {
      const newAd: SystemAd = {
          ...ad,
          id: Date.now().toString(),
          title: `${ad.title} (עותק)`,
          isActive: false 
      };
      props.onAddAd(newAd);
      alert('המודעה שוכפלה בהצלחה (כטיוטה לא פעילה).');
  };

  const handleAdSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!adForm.title || !adForm.linkUrl || !adForm.imageUrl) {
          alert('נא למלא את כל שדות החובה');
          return;
      }

      const finalAd: SystemAd = { 
          id: (adEditId === 'new' || !adEditId) ? Date.now().toString() : adEditId,
          title: adForm.title!,
          description: adForm.description || '',
          ctaText: adForm.ctaText || 'לפרטים',
          linkUrl: adForm.linkUrl!,
          imageUrl: adForm.imageUrl!,
          subLabel: adForm.subLabel,
          targetCategories: targetCategories,
          targetInterests: targetInterests,
          isActive: true 
      };

      if (adEditId && adEditId !== 'new') {
          props.onEditAd(finalAd);
      } else {
          props.onAddAd(finalAd);
      }
      
      setAdEditId(null);
      setAdForm({ title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '' });
      setTargetCategories(['Global']);
      setTargetInterests([]);
  };

  const toggleTargetCategory = (cat: string) => {
      setTargetCategories(prev => {
          if (prev.includes(cat)) {
              if (prev.length === 1 && prev[0] === 'Global' && cat === 'Global') return prev;
              return prev.filter(c => c !== cat);
          }
          return [...prev, cat];
      });
  };

  const toggleTargetInterest = (int: string) => {
      setTargetInterests(prev => prev.includes(int) ? prev.filter(i => i !== int) : [...prev, int]);
  };

  // --- Render Sections ---

  // 1. Users
  const renderUsers = () => {
      const filtered = props.users.filter(u => 
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
      );
      
      return (
          <div className="space-y-4">
              <div className="relative">
                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="חיפוש משתמש..." 
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                 />
              </div>
              <div className="overflow-x-auto border rounded-xl max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr><th className="px-4 py-3">שם</th><th className="px-4 py-3">מייל</th><th className="px-4 py-3">סטטוס</th><th className="px-4 py-3">פעולות</th></tr>
                      </thead>
                      <tbody className="divide-y">
                          {filtered.map(user => (
                              <tr key={user.id} className="hover:bg-slate-50">
                                  {/* User Name - Click to view */}
                                  <td className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => props.onViewProfile(user)}>
                                      <div className="relative shrink-0">
                                          <img src={user.avatarUrl} className="w-10 h-10 rounded-full border border-slate-200 object-cover aspect-square" alt="" />
                                      </div>
                                      <div className="min-w-0">
                                          <div className="font-bold text-slate-800 truncate">{user.name}</div>
                                          <div className="text-[10px] text-slate-500 truncate">{user.mainField}</div>
                                      </div>
                                  </td>
                                  
                                  {/* Email */}
                                  <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                                  
                                  {/* Status */}
                                  <td className="px-4 py-3">
                                      {user.pendingUpdate ? (
                                          <button onClick={() => props.onViewProfile(user)} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                                              <RefreshCw className="w-3 h-3" /> ממתין לאישור
                                          </button>
                                      ) : <span className="text-green-600 text-xs">פעיל</span>}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-4 py-3">
                                      <div className="flex gap-2 items-center">
                                          <a href={`mailto:${user.email}`} className="p-2 text-slate-400 hover:bg-slate-100 rounded block"><Mail className="w-4 h-4"/></a>
                                          {user.id !== props.currentUser?.id && (
                                              <DeleteToggleButton onDelete={() => props.onDeleteUser(user.id)} />
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  // 2. Content
  const renderContent = () => {
      const pendingOffers = props.offers.filter(o => o.status === 'pending');
      const displayed = contentTab === 'pending' ? pendingOffers : props.offers;

      return (
          <div className="space-y-4">
              <div className="flex gap-2 border-b">
                  <button onClick={() => setContentTab('pending')} className={`px-4 py-2 text-sm font-bold border-b-2 ${contentTab === 'pending' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500'}`}>ממתינות ({pendingOffers.length})</button>
                  <button onClick={() => setContentTab('all')} className={`px-4 py-2 text-sm font-bold border-b-2 ${contentTab === 'all' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500'}`}>כל המודעות</button>
              </div>

              {contentTab === 'all' && (
                  <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-2 text-sm">
                      <span className="font-bold text-slate-700">מחיקה מרוכזת לפני תאריך:</span>
                      <input type="date" className="border rounded px-2 py-1 bg-white" value={dateThreshold} onChange={e => setDateThreshold(e.target.value)} />
                      <button 
                        type="button"
                        onClick={() => { if(confirmDelete) { props.onBulkDelete(dateThreshold); setConfirmDelete(false); } else setConfirmDelete(true); }}
                        disabled={!dateThreshold}
                        className={`px-3 py-1 rounded text-white font-bold ${confirmDelete ? 'bg-red-600' : 'bg-slate-800'}`}
                      >
                          {confirmDelete ? 'בטוח?' : 'מחק'}
                      </button>
                  </div>
              )}

              <div className="space-y-3 overflow-y-auto max-h-[60vh] p-1">
                  {displayed.length === 0 && <div className="text-center py-10 text-slate-400">אין מודעות להצגה</div>}
                  {displayed.map(offer => (
                      <div key={offer.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${offer.status === 'pending' ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-start gap-3 w-full">
                              <div className="shrink-0 cursor-pointer" onClick={() => props.onViewProfile(offer.profile)}>
                                  <img src={offer.profile.avatarUrl} className="w-10 h-10 rounded-full border border-slate-200 object-cover aspect-square bg-white shrink-0" alt="" />
                              </div>
                              <div className="flex-1">
                                  <h4 className="font-bold text-slate-900">{offer.title}</h4>
                                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                      <span className="font-medium text-slate-700">{offer.profile.name}</span>
                                      <span>•</span>
                                      <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  {offer.status === 'pending' && <p className="text-sm mt-2 p-2 bg-white/60 rounded border border-orange-100">{offer.description}</p>}
                              </div>
                          </div>

                          <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end items-center">
                              {offer.status === 'pending' && (
                                  <button onClick={() => props.onApproveOffer(offer.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">אשר</button>
                              )}
                              <button onClick={() => props.onEditOffer(offer)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"><Edit className="w-4 h-4"/></button>
                              <DeleteToggleButton onDelete={() => props.onDeleteOffer(offer.id)} />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  // 3. Data
  const renderData = () => {
      const pendingTotal = props.pendingCategories.length + props.pendingInterests.length;
      
      const handleAdd = () => {
          if (!newDataInput.trim()) return;
          if (dataTab === 'categories') props.onAddCategory(newDataInput);
          else props.onAddInterest(newDataInput);
          setNewDataInput('');
      };

      const listItems = dataTab === 'categories' ? props.availableCategories : props.availableInterests;
      const getCount = (item: string) => dataTab === 'categories' 
          ? props.users.filter(u => u.mainField === item).length 
          : props.users.filter(u => u.interests?.includes(item)).length;
      
      const sortedItems = [...listItems].sort((a,b) => getCount(b) - getCount(a));

      return (
          <div className="space-y-4">
               <div className="flex gap-2 border-b overflow-x-auto">
                  <button onClick={() => setDataTab('categories')} className={`px-4 py-2 text-sm font-bold border-b-2 whitespace-nowrap ${dataTab === 'categories' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}>תחומים</button>
                  <button onClick={() => setDataTab('interests')} className={`px-4 py-2 text-sm font-bold border-b-2 whitespace-nowrap ${dataTab === 'interests' ? 'border-pink-600 text-pink-600' : 'border-transparent text-slate-500'}`}>תחומי עניין</button>
                  <button onClick={() => setDataTab('pending')} className={`px-4 py-2 text-sm font-bold border-b-2 whitespace-nowrap ${dataTab === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}>ממתינים ({pendingTotal})</button>
              </div>

              {dataTab === 'pending' ? (
                  <div className="space-y-4 overflow-y-auto max-h-[60vh]">
                      {props.pendingCategories.map(cat => (
                          <div key={cat} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold">{cat} (מקצוע)</span>
                                  <div className="flex gap-2 items-center">
                                      <button onClick={() => props.onApproveCategory(cat)} className="text-green-600 hover:bg-green-100 p-2 rounded"><CheckCircle className="w-5 h-5"/></button>
                                      <DeleteToggleButton onDelete={() => props.onRejectCategory(cat)} />
                                  </div>
                              </div>
                              <div className="flex gap-2 items-center text-xs">
                                  <span>מזג עם:</span>
                                  <select className="border rounded p-1 bg-white" onChange={(e) => { setReassignTarget(cat); setReassignDestination(e.target.value); }}>
                                      <option value="">בחר...</option>
                                      {props.availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                  <button 
                                    disabled={reassignTarget !== cat || !reassignDestination}
                                    onClick={() => { props.onReassignCategory(cat, reassignDestination); setReassignTarget(null); setReassignDestination(''); }}
                                    className="bg-slate-800 text-white px-2 py-1 rounded disabled:opacity-50"
                                  >
                                      בצע
                                  </button>
                              </div>
                          </div>
                      ))}
                      {props.pendingInterests.map(int => (
                          <div key={int} className="bg-pink-50 p-3 rounded-lg border border-pink-200 flex justify-between items-center">
                              <span className="font-bold">{int} (עניין)</span>
                              <div className="flex gap-2 items-center">
                                  <button onClick={() => props.onApproveInterest(int)} className="text-green-600 hover:bg-green-100 p-2 rounded"><CheckCircle className="w-5 h-5"/></button>
                                  <DeleteToggleButton onDelete={() => props.onRejectInterest(int)} />
                              </div>
                          </div>
                      ))}
                      {pendingTotal === 0 && <div className="text-center text-slate-400 py-10">אין פריטים ממתינים</div>}
                  </div>
              ) : (
                  <div className="space-y-4">
                      <div className="flex gap-2">
                          <input 
                            value={newDataInput} 
                            onChange={e => setNewDataInput(e.target.value)} 
                            className="flex-1 border rounded-lg px-3 py-2 bg-white" 
                            placeholder="הוסף חדש..." 
                            onKeyPress={e => e.key === 'Enter' && handleAdd()}
                          />
                          <button onClick={handleAdd} className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold">הוסף</button>
                      </div>
                      <div className="overflow-y-auto max-h-[60vh] space-y-2 pr-1">
                          {sortedItems.map(item => (
                              <div key={item} className="flex justify-between items-center p-2 border rounded-lg hover:bg-slate-50">
                                  <span>{item}</span>
                                  <div className="flex items-center gap-3">
                                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{getCount(item)} משתמשים</span>
                                      <DeleteToggleButton onDelete={() => {
                                          if (dataTab === 'categories') props.onDeleteCategory(item);
                                          else props.onDeleteInterest(item);
                                      }} />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  // 4. Ads
  const renderAds = () => {
      const inputClassName = "w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all";

      if (adEditId === 'new' || (adEditId && adEditId !== 'new')) {
          const filteredInterests = props.availableInterests.filter(i => (i||'').toLowerCase().includes(intSearch.toLowerCase()));
          const filteredCategories = props.availableCategories.filter(c => (c||'').toLowerCase().includes(catSearch.toLowerCase()));

          return (
              <form onSubmit={handleAdSubmit} className="space-y-4 overflow-y-auto max-h-[70vh] p-1">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-lg text-slate-800">{adEditId === 'new' ? 'יצירת קמפיין חדש' : 'עריכת קמפיין'}</h3>
                      <button type="button" onClick={() => setAdEditId(null)} className="text-slate-400 hover:text-slate-700 bg-slate-50 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-5">
                           <div>
                               <label className="block text-sm font-bold text-slate-700 mb-2">תמונת קמפיין</label>
                               <div 
                                  className="border-2 border-dashed border-slate-300 h-40 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 relative overflow-hidden group bg-white"
                                  onClick={() => fileInputRef.current?.click()}
                               >
                                   {adForm.imageUrl ? (
                                       <>
                                           <img src={adForm.imageUrl} className="w-full h-full object-cover" />
                                           <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                               <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">החלף תמונה</span>
                                           </div>
                                       </>
                                   ) : (
                                       <div className="text-center text-slate-400"><Upload className="mx-auto mb-2 w-8 h-8 opacity-50"/><span>לחץ להעלאת תמונה</span></div>
                                   )}
                                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                                       if (e.target.files?.[0]) {
                                           try {
                                               const url = await compressImage(e.target.files[0]);
                                               setAdForm({...adForm, imageUrl: url});
                                           } catch (e) { alert('Error'); }
                                       }
                                   }} />
                               </div>
                               <div className="mt-2 relative">
                                    <input 
                                        placeholder="או הדבק כתובת תמונה URL" 
                                        className={inputClassName}
                                        value={adForm.imageUrl} 
                                        onChange={e => setAdForm({...adForm, imageUrl: e.target.value})} 
                                    />
                               </div>
                           </div>
                           
                           <div>
                               <label className="block text-sm font-bold text-slate-700 mb-1.5">כותרת ראשית</label>
                               <input required className={inputClassName} placeholder="כותרת מושכת..." value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-slate-700 mb-1.5">תיאור הקמפיין</label>
                               <textarea className={`${inputClassName} h-24 resize-none`} placeholder="פירוט קצר על ההצעה..." value={adForm.description} onChange={e => setAdForm({...adForm, description: e.target.value})} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-1.5">לינק ליעד</label>
                                   <input required className={`${inputClassName} ltr`} placeholder="https://..." value={adForm.linkUrl} onChange={e => setAdForm({...adForm, linkUrl: e.target.value})} />
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-1.5">טקסט כפתור</label>
                                   <input className={inputClassName} placeholder="למשל: לפרטים" value={adForm.ctaText} onChange={e => setAdForm({...adForm, ctaText: e.target.value})} />
                               </div>
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-slate-700 mb-1.5">טקסט תחתון (אופציונלי)</label>
                               <input className={inputClassName} placeholder='למשל: "בחסות המערכת"' value={adForm.subLabel} onChange={e => setAdForm({...adForm, subLabel: e.target.value})} />
                           </div>
                       </div>

                       <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5 h-fit">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                               <Target className="w-5 h-5 text-purple-600" /> הגדרות טרגוט (קהל יעד)
                           </h4>
                           <div>
                               <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">מקצועות וקטגוריות</label>
                               <div className="relative mb-2">
                                   <Search className="w-3 h-3 absolute right-3 top-2.5 text-slate-400" />
                                   <input className="w-full border rounded-lg pl-2 pr-8 py-1.5 text-sm bg-white" placeholder="חפש..." value={catSearch} onChange={e => setCatSearch(e.target.value)} />
                               </div>
                               <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                   <button type="button" onClick={() => toggleTargetCategory('Global')} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${targetCategories.includes('Global') ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}>Global (כולם)</button>
                                   {filteredCategories.map(cat => (
                                       <button key={cat} type="button" onClick={() => toggleTargetCategory(cat)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${targetCategories.includes(cat) ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                                           {targetCategories.includes(cat) && <Check className="w-3 h-3" />} {cat}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">תחומי עניין</label>
                               <div className="relative mb-2">
                                   <Search className="w-3 h-3 absolute right-3 top-2.5 text-slate-400" />
                                   <input className="w-full border rounded-lg pl-2 pr-8 py-1.5 text-sm bg-white" placeholder="חפש..." value={intSearch} onChange={e => setIntSearch(e.target.value)} />
                               </div>
                               <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                   {filteredInterests.map(int => (
                                       <button key={int} type="button" onClick={() => toggleTargetInterest(int)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${targetInterests.includes(int) ? 'bg-pink-500 text-white border-pink-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300'}`}>
                                           {targetInterests.includes(int) && <Check className="w-3 h-3" />} {int}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                      <button type="button" onClick={() => setAdEditId(null)} className="px-6 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-lg transition-colors">ביטול</button>
                      <button type="submit" className="bg-purple-600 text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:bg-purple-700 transition-all flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          שמור ופרסם
                      </button>
                  </div>
              </form>
          );
      }

      return (
          <div className="space-y-4">
              <button 
                onClick={() => { setAdEditId('new'); setAdForm({ title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '', targetCategories: ['Global'], targetInterests: [] }); setTargetCategories(['Global']); setTargetInterests([]); }}
                className="w-full py-4 border-2 border-dashed border-purple-200 text-purple-600 rounded-xl font-bold hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors"
              >
                  <Plus className="w-5 h-5" /> יצירת קמפיין חדש
              </button>
              <div className="space-y-2 overflow-y-auto max-h-[60vh] p-1">
                  {props.ads.map(ad => (
                      <div key={ad.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group relative">
                          
                          {/* Right Side: Title & Info */}
                          <div className="flex-1 min-w-0 pl-3">
                              <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-slate-800 text-sm truncate">{ad.title}</h4>
                                  {!ad.isActive && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border">טיוטה</span>}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                                      {ad.targetCategories?.[0] || 'כללי'}
                                      {ad.targetCategories?.length > 1 && ` +${ad.targetCategories.length - 1}`}
                                  </span>
                                  <span className="text-slate-300">|</span>
                                  <span className="truncate max-w-[200px] ltr text-right text-[10px]">{ad.linkUrl}</span>
                              </div>
                          </div>

                          {/* Left Side: Actions & Image */}
                          <div className="flex items-center gap-3 shrink-0">
                              <div className="flex gap-1 transition-opacity">
                                  <button onClick={() => handleDuplicateAd(ad)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="שכפל"><Copy className="w-4 h-4"/></button>
                                  <button onClick={() => handleEditAdClick(ad)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="ערוך"><Pencil className="w-4 h-4"/></button>
                                  <DeleteToggleButton onDelete={() => props.onDeleteAd(ad.id)} />
                              </div>
                              <img 
                                src={ad.imageUrl} 
                                className="w-24 h-16 object-cover rounded-lg border border-slate-100 shadow-sm bg-slate-50" 
                                alt="" 
                              />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden sm:overflow-y-auto" role="dialog" aria-modal="true">
      {/* Container - Removed padding on mobile to ensure full height */}
      <div className="flex items-center justify-center min-h-screen p-0 sm:px-4 sm:pt-4 sm:pb-20 text-center">
        
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={props.onClose}></div>

        {/* Modal Window - Full height on mobile (h-[100dvh]) */}
        <div className="inline-block bg-white text-right overflow-hidden shadow-lg transform transition-all w-full h-[100dvh] sm:h-[85vh] sm:rounded-2xl sm:max-w-6xl flex flex-col relative z-50">
            
            {/* Header */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                        <LayoutDashboard className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">ניהול מערכת</h3>
                        <p className="text-xs text-slate-500">מחובר: {props.currentUser?.name}</p>
                    </div>
                </div>
                <button onClick={props.onClose} className="text-slate-400 hover:text-slate-800 bg-white border border-slate-200 p-2 rounded-full hover:bg-slate-100 transition-colors shadow-sm">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
                {/* Navigation Bar */}
                <div className="order-2 sm:order-1 w-full sm:w-64 bg-slate-50 border-t sm:border-t-0 sm:border-l border-slate-200 shrink-0">
                    <nav className="flex flex-row sm:flex-col p-2 sm:p-4 gap-1 sm:gap-2 overflow-x-auto sm:overflow-visible no-scrollbar">
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white shadow-sm text-brand-700 font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <div className="relative">
                                <Shield className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                                {pendingUserUpdates > 0 && <span className="absolute -top-1 -right-1 sm:hidden w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
                            </div>
                            <span className="text-[10px] sm:text-sm sm:hidden">משתמשים</span>
                            <span className="hidden sm:inline">משתמשים</span>
                            {pendingUserUpdates > 0 && <span className="mr-auto bg-red-500 text-white text-[10px] px-2 rounded-full hidden sm:inline-block">{pendingUserUpdates}</span>}
                        </button>

                        <button 
                            onClick={() => setActiveTab('content')}
                            className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-white shadow-sm text-brand-700 font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <div className="relative">
                                <FileText className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                                {pendingOffersCount > 0 && <span className="absolute -top-1 -right-1 sm:hidden w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
                            </div>
                            <span className="text-[10px] sm:text-sm sm:hidden">תוכן</span>
                            <span className="hidden sm:inline">תוכן ומודעות</span>
                            {pendingOffersCount > 0 && <span className="mr-auto bg-red-500 text-white text-[10px] px-2 rounded-full hidden sm:inline-block">{pendingOffersCount}</span>}
                        </button>

                        <button 
                            onClick={() => setActiveTab('data')}
                            className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-white shadow-sm text-brand-700 font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <div className="relative">
                                <BarChart3 className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                                {pendingDataCount > 0 && <span className="absolute -top-1 -right-1 sm:hidden w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
                            </div>
                            <span className="text-[10px] sm:text-sm sm:hidden">נתונים</span>
                            <span className="hidden sm:inline">נתונים וקטגוריות</span>
                            {pendingDataCount > 0 && <span className="mr-auto bg-red-500 text-white text-[10px] px-2 rounded-full hidden sm:inline-block">{pendingDataCount}</span>}
                        </button>

                        <button 
                            onClick={() => setActiveTab('ads')}
                            className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'ads' ? 'bg-white shadow-sm text-brand-700 font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Megaphone className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                            <span className="text-[10px] sm:text-sm sm:hidden">פרסומות</span>
                            <span className="hidden sm:inline">פרסומות</span>
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="order-1 sm:order-2 flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
                    <div className="max-w-4xl mx-auto h-full">
                        <div className="mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                                {activeTab === 'users' && 'ניהול משתמשים'}
                                {activeTab === 'content' && 'ניהול מודעות ברטר'}
                                {activeTab === 'data' && 'ניהול טקסונומיה (תחומים)'}
                                {activeTab === 'ads' && 'ניהול קמפיינים ופרסום'}
                            </h2>
                            <p className="text-slate-500 text-xs sm:text-sm">
                                {activeTab === 'users' && `סה"כ ${props.users.length} משתמשים רשומים במערכת`}
                                {activeTab === 'content' && `סה"כ ${props.offers.length} מודעות, מתוכן ${pendingOffersCount} ממתינות לאישור`}
                                {activeTab === 'data' && 'אישור קטגוריות חדשות, מיזוג תחומים וניהול תגיות'}
                                {activeTab === 'ads' && 'ניהול הבאנרים הפרסומיים המופיעים בראש האתר'}
                            </p>
                        </div>

                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'content' && renderContent()}
                        {activeTab === 'data' && renderData()}
                        {activeTab === 'ads' && renderAds()}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
