
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Shield, FileText, BarChart3, Megaphone, 
  Search, RefreshCw, Mail, Trash2, CheckCircle, 
  Edit, Plus, Upload, Save, Link as LinkIcon, 
  Target, Copy, Pencil, LayoutDashboard, Check, Briefcase, Tag, CornerDownRight, GitMerge, ToggleRight, ToggleLeft, ArrowRightLeft
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
  categoryHierarchy?: Record<string, string>;
  onAddCategory: (category: string) => void;
  onAddInterest: (interest: string) => void;
  onDeleteCategory: (category: string) => void;
  onDeleteInterest: (interest: string) => void;
  onApproveCategory: (category: string) => void;
  onRejectCategory: (category: string) => void;
  onReassignCategory: (oldCategory: string, newCategory: string) => void;
  onApproveInterest: (interest: string) => void;
  onRejectInterest: (interest: string) => void;
  onEditCategory: (oldName: string, newName: string, parentCategory?: string) => void;
  onEditInterest: (oldName: string, newName: string) => void;
  // Ads Data
  ads: SystemAd[];
  onAddAd: (ad: SystemAd) => void;
  onEditAd: (ad: SystemAd) => void;
  onDeleteAd: (id: string) => void;
  // Shared
  onViewProfile: (profile: UserProfile) => void;
}

// ... (Helper functions remain the same) ...
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

const DeleteToggleButton = ({ onDelete, className = "" }: { onDelete: () => void, className?: string }) => {
    const [isConfirming, setIsConfirming] = useState(false);
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
  
  // Local State
  const [userSearch, setUserSearch] = useState('');
  const [contentTab, setContentTab] = useState<'pending' | 'all'>('pending');
  const [dateThreshold, setDateThreshold] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Data Tab State
  const [dataSubTab, setDataSubTab] = useState<'categories' | 'interests' | 'pending'>('categories');
  const [newDataInput, setNewDataInput] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editParent, setEditParent] = useState('');
  
  // Reassign State for Pending Items
  const [reassignTarget, setReassignTarget] = useState<string | null>(null);
  const [reassignDestination, setReassignDestination] = useState('');

  // Ads State
  const [adEditId, setAdEditId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState<Partial<SystemAd>>({ 
      title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '', isActive: true 
  });
  const [targetCategories, setTargetCategories] = useState<string[]>(['Global']);
  const [targetInterests, setTargetInterests] = useState<string[]>([]);
  const [catSearch, setCatSearch] = useState('');
  const [intSearch, setIntSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!props.isOpen) return null;

  // Safe Arrays
  const safeUsers = props.users || [];
  const safeOffers = props.offers || [];
  const safeAds = props.ads || [];
  const safeAvailableCategories = props.availableCategories || [];
  const safeAvailableInterests = props.availableInterests || [];
  const safePendingCategories = props.pendingCategories || [];
  const safePendingInterests = props.pendingInterests || [];

  const pendingUserUpdates = safeUsers.filter(u => u.pendingUpdate).length;
  const pendingOffersCount = safeOffers.filter(o => o.status === 'pending').length;
  const pendingDataCount = safePendingCategories.length + safePendingInterests.length;

  // --- Handlers ---

  const handleEditAdClick = (ad: SystemAd) => {
      setAdEditId(ad.id);
      setAdForm({
          title: ad.title,
          description: ad.description,
          ctaText: ad.ctaText,
          linkUrl: ad.linkUrl,
          imageUrl: ad.imageUrl,
          subLabel: ad.subLabel || '',
          isActive: ad.isActive
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

  const handleToggleAdStatus = (ad: SystemAd) => {
      props.onEditAd({ ...ad, isActive: !ad.isActive });
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
          isActive: adForm.isActive ?? true 
      };

      if (adEditId && adEditId !== 'new') {
          props.onEditAd(finalAd);
      } else {
          props.onAddAd(finalAd);
      }
      
      setAdEditId(null);
      setAdForm({ title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '', isActive: true });
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

  // 1. Users (Unchanged)
  const renderUsers = () => {
      const filtered = safeUsers.filter(u => 
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
      ).sort((a, b) => {
          const dateA = new Date(a.joinedAt || 0).getTime();
          const dateB = new Date(b.joinedAt || 0).getTime();
          return dateB - dateA;
      });
      
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
                                  <td className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => props.onViewProfile(user)}>
                                      <div className="relative shrink-0">
                                          <img src={user.avatarUrl} className="w-10 h-10 rounded-full border border-slate-200 object-cover aspect-square" alt="" />
                                      </div>
                                      <div className="min-w-0">
                                          <div className="font-bold text-slate-800 truncate">{user.name}</div>
                                          <div className="text-[10px] text-slate-500 truncate">{user.mainField}</div>
                                      </div>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                                  <td className="px-4 py-3">
                                      {user.pendingUpdate ? (
                                          <button onClick={() => props.onViewProfile(user)} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                                              <RefreshCw className="w-3 h-3" /> ממתין לאישור
                                          </button>
                                      ) : <span className="text-green-600 text-xs">פעיל</span>}
                                  </td>
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

  // 2. Content (Unchanged)
  const renderContent = () => {
      const pendingOffers = safeOffers.filter(o => o.status === 'pending');
      const displayed = contentTab === 'pending' ? pendingOffers : safeOffers;

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

  // 3. Data (Taxonomy)
  const renderData = () => {
      const getCategoryCount = (cat: string) => safeUsers.filter(u => u.mainField === cat).length;
      const getInterestCount = (int: string) => safeUsers.filter(u => u.interests?.includes(int)).length;

      const handleAddData = () => {
          if (!newDataInput.trim()) return;
          if (dataSubTab === 'categories') {
              props.onAddCategory(newDataInput.trim());
          } else {
              props.onAddInterest(newDataInput.trim());
          }
          setNewDataInput('');
      };

      const handleStartEdit = (item: string) => {
          setEditingItem(item);
          setEditName(item);
          if (dataSubTab === 'categories' && props.categoryHierarchy) {
              setEditParent(props.categoryHierarchy[item] || '');
          }
      };

      const handleSaveEdit = () => {
          if (!editingItem || !editName.trim()) return;
          
          if (dataSubTab === 'categories') {
              props.onEditCategory(editingItem, editName.trim(), editParent || undefined);
          } else {
              props.onEditInterest(editingItem, editName.trim());
          }
          
          setEditingItem(null);
          setEditName('');
          setEditParent('');
      };

      // Handler for pending item merge
      const handlePendingMerge = (pendingItem: string) => {
          if (reassignTarget === pendingItem && reassignDestination) {
              if (window.confirm(`האם למזג את "${pendingItem}" לתוך "${reassignDestination}"? פעולה זו תעדכן את כל המשתמשים ותמחק את הבקשה.`)) {
                  props.onReassignCategory(pendingItem, reassignDestination);
                  setReassignTarget(null);
                  setReassignDestination('');
              }
          }
      };

      // Sort categories/interests by count
      const sortedCategories = [...safeAvailableCategories].sort((a, b) => getCategoryCount(b) - getCategoryCount(a));
      const sortedInterests = [...safeAvailableInterests].sort((a, b) => getInterestCount(b) - getInterestCount(a));

      const activeList = dataSubTab === 'categories' ? sortedCategories : sortedInterests;

      return (
          <div className="space-y-4 h-full flex flex-col">
              <div className="flex border-b border-slate-200">
                  <button onClick={() => setDataSubTab('categories')} className={`flex-1 py-2 text-sm font-bold ${dataSubTab === 'categories' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-500'}`}>תחומים ({safeAvailableCategories.length})</button>
                  <button onClick={() => setDataSubTab('pending')} className={`flex-1 py-2 text-sm font-bold ${dataSubTab === 'pending' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-500'}`}>ממתינים ({safePendingCategories.length + safePendingInterests.length})</button>
                  <button onClick={() => setDataSubTab('interests')} className={`flex-1 py-2 text-sm font-bold ${dataSubTab === 'interests' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-slate-500'}`}>עניין ({safeAvailableInterests.length})</button>
              </div>

              {dataSubTab !== 'pending' && (
                  <div className="flex gap-2">
                      <input 
                        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-500" 
                        placeholder={dataSubTab === 'categories' ? 'הוסף מקצוע...' : 'הוסף עניין...'}
                        value={newDataInput}
                        onChange={e => setNewDataInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddData()}
                      />
                      <button onClick={handleAddData} className="bg-slate-800 text-white px-4 rounded text-sm font-bold hover:bg-slate-900 transition-colors">הוסף</button>
                  </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-2 max-h-[50vh]">
                  {dataSubTab === 'pending' && (
                      <div className="space-y-3">
                        {safePendingCategories.map(cat => (
                            <div key={cat} className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <div><span className="font-bold text-slate-800">{cat}</span> <span className="text-xs text-slate-500">(מקצוע)</span></div>
                                    <div className="flex gap-2">
                                        <button onClick={() => props.onApproveCategory(cat)} className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors" title="אשר"><CheckCircle className="w-4 h-4"/></button>
                                        <button onClick={() => props.onRejectCategory(cat)} className="text-red-600 hover:bg-red-100 p-1.5 rounded transition-colors" title="דחה"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                
                                {/* Pending Merge Dropdown */}
                                <div className="bg-white p-2 rounded border border-orange-200 flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                                        <ArrowRightLeft className="w-3 h-3 inline mr-1" />
                                        מיזוג לקיים:
                                    </span>
                                    <select 
                                        className="flex-1 border border-slate-300 rounded text-xs p-1 h-7"
                                        value={reassignTarget === cat ? reassignDestination : ''}
                                        onChange={(e) => {
                                            setReassignTarget(cat);
                                            setReassignDestination(e.target.value);
                                        }}
                                    >
                                        <option value="">בחר תחום...</option>
                                        {sortedCategories.map(existing => (
                                            <option key={existing} value={existing}>{existing}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={() => handlePendingMerge(cat)}
                                        disabled={reassignTarget !== cat || !reassignDestination}
                                        className="bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-bold disabled:opacity-50"
                                    >
                                        בצע
                                    </button>
                                </div>
                            </div>
                        ))}
                        {safePendingInterests.map(int => (
                            <div key={int} className="flex justify-between items-center p-3 bg-pink-50 border border-pink-100 rounded-lg">
                                <div><span className="font-bold text-slate-800">{int}</span> <span className="text-xs text-slate-500">(עניין)</span></div>
                                <div className="flex gap-2">
                                    <button onClick={() => props.onApproveInterest(int)} className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors" title="אשר"><CheckCircle className="w-4 h-4"/></button>
                                    <button onClick={() => props.onRejectInterest(int)} className="text-red-600 hover:bg-red-100 p-1.5 rounded transition-colors" title="דחה"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                        {safePendingCategories.length === 0 && safePendingInterests.length === 0 && <div className="text-center text-slate-400 py-10">אין פריטים ממתינים לאישור</div>}
                      </div>
                  )}

                  {/* Render Categories OR Interests with EDIT & MERGE support */}
                  {(dataSubTab === 'categories' || dataSubTab === 'interests') && (
                      activeList.map(item => {
                          const count = dataSubTab === 'categories' ? getCategoryCount(item) : getInterestCount(item);
                          const isEditingThis = editingItem === item;
                          const parent = (dataSubTab === 'categories' && props.categoryHierarchy) ? props.categoryHierarchy[item] : null;

                          return (
                              <div key={item} className={`flex flex-col p-2 border-b border-slate-100 last:border-0 rounded-lg transition-colors ${isEditingThis ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'hover:bg-slate-50'}`}>
                                  <div className="flex justify-between items-center w-full">
                                      {isEditingThis ? (
                                          <div className="flex flex-col gap-2 w-full">
                                              <div className="flex gap-2 items-center">
                                                  <input 
                                                      value={editName}
                                                      onChange={(e) => setEditName(e.target.value)}
                                                      className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm font-bold bg-white focus:border-brand-500 outline-none"
                                                      placeholder="שם התחום"
                                                      autoFocus
                                                  />
                                                  {dataSubTab === 'categories' && (
                                                      <select 
                                                          value={editParent}
                                                          onChange={(e) => setEditParent(e.target.value)}
                                                          className="border border-slate-300 rounded px-2 py-1.5 text-sm w-32 bg-white"
                                                      >
                                                          <option value="">ללא אב</option>
                                                          {sortedCategories.filter(c => c !== item).map(c => (
                                                              <option key={c} value={c}>{c}</option>
                                                          ))}
                                                      </select>
                                                  )}
                                              </div>
                                              
                                              {/* Merge Option Dropdown */}
                                              <div className="flex items-center gap-2 bg-white p-1.5 rounded border border-slate-200">
                                                  <GitMerge className="w-4 h-4 text-slate-400" />
                                                  <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">מיזוג עם:</span>
                                                  <select 
                                                      className="flex-1 text-xs border-transparent rounded focus:ring-0 text-slate-700 bg-transparent py-0.5"
                                                      onChange={(e) => {
                                                          if(e.target.value) setEditName(e.target.value);
                                                      }}
                                                      value=""
                                                  >
                                                      <option value="">בחר תחום קיים לרכישה/מיזוג...</option>
                                                      {activeList.filter(x => x !== item).map(x => (
                                                          <option key={x} value={x}>{x}</option>
                                                      ))}
                                                  </select>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="flex items-center gap-3 overflow-hidden">
                                              <div className="flex flex-col">
                                                  <span className="font-medium text-slate-800 truncate">{item}</span>
                                                  {parent && (
                                                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                          <CornerDownRight className="w-3 h-3" /> תחת: {parent}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                      )}

                                      <div className="flex items-center gap-2 shrink-0 self-start mt-1.5">
                                          {!isEditingThis && (
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold min-w-[3rem] text-center ${count > 0 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                                                  {count}
                                              </span>
                                          )}
                                          
                                          {isEditingThis ? (
                                              <div className="flex flex-col gap-1">
                                                  <button 
                                                      onClick={handleSaveEdit} 
                                                      className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
                                                      title="שמור"
                                                  >
                                                      <Save className="w-4 h-4" />
                                                  </button>
                                                  <button 
                                                      onClick={() => setEditingItem(null)} 
                                                      className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                                      title="ביטול"
                                                  >
                                                      <X className="w-4 h-4" />
                                                  </button>
                                              </div>
                                          ) : (
                                              <>
                                                  <button 
                                                      onClick={() => handleStartEdit(item)}
                                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                      title="ערוך / מזג"
                                                  >
                                                      <Pencil className="w-4 h-4" />
                                                  </button>
                                                  <DeleteToggleButton 
                                                      onDelete={() => dataSubTab === 'categories' ? props.onDeleteCategory(item) : props.onDeleteInterest(item)} 
                                                  />
                                              </>
                                          )}
                                      </div>
                                  </div>
                                  
                                  {isEditingThis && (
                                      <div className="mt-2 text-[10px] text-slate-500 bg-slate-100 p-1.5 rounded flex items-center gap-1">
                                          <Check className="w-3 h-3 text-green-600" />
                                          <span>שינוי השם יעדכן את כל המשתמשים. אם השם קיים, יבוצע מיזוג.</span>
                                      </div>
                                  )}
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      );
  };

  // 4. Ads (Unchanged)
  const renderAds = () => {
      const inputClassName = "w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all";

      if (adEditId === 'new' || (adEditId && adEditId !== 'new')) {
          const filteredInterests = safeAvailableInterests.filter(i => (i||'').toLowerCase().includes(intSearch.toLowerCase()));
          const filteredCategories = safeAvailableCategories.filter(c => (c||'').toLowerCase().includes(catSearch.toLowerCase()));

          return (
              <form onSubmit={handleAdSubmit} className="space-y-4 overflow-y-auto max-h-[70vh] p-1">
                  {/* ... Existing Edit Form ... */}
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
                                    <input placeholder="או הדבק כתובת תמונה URL" className={inputClassName} value={adForm.imageUrl} onChange={e => setAdForm({...adForm, imageUrl: e.target.value})} />
                               </div>
                           </div>
                           
                           {/* Status Toggle in Form */}
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700">סטטוס המודעה</label>
                                    <p className="text-xs text-slate-500">האם המודעה מוצגת כרגע באתר?</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAdForm({...adForm, isActive: !adForm.isActive})}
                                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${adForm.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${adForm.isActive ? 'left-1' : 'left-6'}`}></span>
                                </button>
                           </div>

                           <div><label className="block text-sm font-bold text-slate-700 mb-1.5">כותרת ראשית</label><input required className={inputClassName} value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} /></div>
                           <div><label className="block text-sm font-bold text-slate-700 mb-1.5">תיאור הקמפיין</label><textarea className={`${inputClassName} h-24 resize-none`} value={adForm.description} onChange={e => setAdForm({...adForm, description: e.target.value})} /></div>
                           <div className="grid grid-cols-2 gap-4">
                               <div><label className="block text-sm font-bold text-slate-700 mb-1.5">לינק ליעד</label><input required className={`${inputClassName} ltr`} value={adForm.linkUrl} onChange={e => setAdForm({...adForm, linkUrl: e.target.value})} /></div>
                               <div><label className="block text-sm font-bold text-slate-700 mb-1.5">טקסט כפתור</label><input className={inputClassName} value={adForm.ctaText} onChange={e => setAdForm({...adForm, ctaText: e.target.value})} /></div>
                           </div>
                       </div>
                       {/* Targeting */}
                       <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5 h-fit">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2"><Target className="w-5 h-5 text-purple-600" /> הגדרות טרגוט (קהל יעד)</h4>
                           
                           {/* Professions Targeting */}
                           <div>
                               <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">מקצועות וקטגוריות</label>
                               <div className="relative mb-2">
                                    <Briefcase className="w-3 h-3 absolute right-3 top-3 text-slate-400" />
                                    <input 
                                        type="text"
                                        className={`${inputClassName} pr-9 py-1.5`}
                                        placeholder="חפש מקצוע..."
                                        value={catSearch}
                                        onChange={e => setCatSearch(e.target.value)}
                                    />
                               </div>
                               <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                   <button type="button" onClick={() => toggleTargetCategory('Global')} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${targetCategories.includes('Global') ? 'bg-purple-600 text-white' : 'bg-white'}`}>Global</button>
                                   {filteredCategories.map(cat => <button key={cat} type="button" onClick={() => toggleTargetCategory(cat)} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${targetCategories.includes(cat) ? 'bg-purple-600 text-white' : 'bg-white'}`}>{cat}</button>)}
                               </div>
                           </div>

                           {/* Interests Targeting */}
                           <div className="mt-4 border-t border-slate-200 pt-4">
                               <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">תחומי עניין ונושאים</label>
                               <div className="relative mb-2">
                                    <Tag className="w-3 h-3 absolute right-3 top-3 text-slate-400" />
                                    <input 
                                        type="text"
                                        className={`${inputClassName} pr-9 py-1.5`}
                                        placeholder="חפש נושא..."
                                        value={intSearch}
                                        onChange={e => setIntSearch(e.target.value)}
                                    />
                               </div>
                               <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                   {filteredInterests.map(int => (
                                       <button 
                                            key={int} 
                                            type="button" 
                                            onClick={() => toggleTargetInterest(int)} 
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${targetInterests.includes(int) ? 'bg-pink-500 text-white' : 'bg-white'}`}
                                       >
                                           {int}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                      <button type="button" onClick={() => setAdEditId(null)} className="px-6 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-lg">ביטול</button>
                      <button type="submit" className="bg-purple-600 text-white px-8 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2"><Save className="w-4 h-4" /> שמור ופרסם</button>
                  </div>
              </form>
          );
      }

      return (
          <div className="space-y-4">
              <button 
                onClick={() => { setAdEditId('new'); setAdForm({ title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '', targetCategories: ['Global'], targetInterests: [], isActive: true }); setTargetCategories(['Global']); setTargetInterests([]); }}
                className="w-full py-4 border-2 border-dashed border-purple-200 text-purple-600 rounded-xl font-bold hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors"
              >
                  <Plus className="w-5 h-5" /> יצירת קמפיין חדש
              </button>
              <div className="space-y-2 overflow-y-auto max-h-[60vh] p-1">
                  {safeAds.map(ad => (
                      <div key={ad.id} className={`flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group relative ${!ad.isActive ? 'opacity-70 bg-slate-50' : ''}`}>
                          
                          {/* Toggle Switch */}
                          <div className="flex flex-col items-center gap-1 border-l pl-3 ml-2">
                                <button
                                    onClick={() => handleToggleAdStatus(ad)}
                                    className={`relative w-8 h-5 rounded-full transition-colors duration-200 ${ad.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                                    title={ad.isActive ? 'כבה מודעה' : 'הפעל מודעה'}
                                >
                                    <span className={`absolute top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${ad.isActive ? 'left-0.5' : 'left-3.5'}`}></span>
                                </button>
                                <span className={`text-[9px] font-bold ${ad.isActive ? 'text-green-600' : 'text-slate-400'}`}>{ad.isActive ? 'פעיל' : 'כבוי'}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-slate-800 text-sm truncate">{ad.title}</h4>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                                      {ad.targetCategories?.[0] || 'כללי'}
                                  </span>
                                  {ad.targetInterests && ad.targetInterests.length > 0 && (
                                      <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded text-[10px] border border-pink-100">
                                          +{ad.targetInterests.length} נושאים
                                      </span>
                                  )}
                                  <span className="truncate max-w-[200px] ltr text-right text-[10px]">{ad.linkUrl}</span>
                              </div>
                          </div>

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
      <div className="flex items-center justify-center min-h-screen p-0 sm:px-4 sm:pt-4 sm:pb-20 text-center">
        
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={props.onClose}></div>

        <div className="inline-block bg-white text-right overflow-hidden shadow-lg transform transition-all w-full h-[100dvh] sm:h-[85vh] sm:rounded-2xl sm:max-w-6xl flex flex-col relative z-50">
            
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
                <div className="order-2 sm:order-1 w-full sm:w-64 bg-slate-50 border-t sm:border-t-0 sm:border-l border-slate-200 shrink-0">
                    <nav className="flex flex-row sm:flex-col p-2 sm:p-4 gap-1 sm:gap-2 overflow-x-auto sm:overflow-visible no-scrollbar">
                        <button onClick={() => setActiveTab('users')} className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white shadow-sm text-brand-700 font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <Shield className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                            <span className="hidden sm:inline">משתמשים</span>
                            {pendingUserUpdates > 0 && <span className="mr-auto bg-red-500 text-white text-[10px] px-2 rounded-full hidden sm:inline-block">{pendingUserUpdates}</span>}
                        </button>
                        <button onClick={() => setActiveTab('content')} className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-white shadow-sm text-brand-700 font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <FileText className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                            <span className="hidden sm:inline">תוכן ומודעות</span>
                            {pendingOffersCount > 0 && <span className="mr-auto bg-red-500 text-white text-[10px] px-2 rounded-full hidden sm:inline-block">{pendingOffersCount}</span>}
                        </button>
                        <button onClick={() => setActiveTab('data')} className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-white shadow-sm text-brand-700 font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <BarChart3 className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                            <span className="hidden sm:inline">נתונים וקטגוריות</span>
                            {pendingDataCount > 0 && <span className="mr-auto bg-red-500 text-white text-[10px] px-2 rounded-full hidden sm:inline-block">{pendingDataCount}</span>}
                        </button>
                        <button onClick={() => setActiveTab('ads')} className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'ads' ? 'bg-white shadow-sm text-brand-700 font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <Megaphone className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                            <span className="hidden sm:inline">פרסומות</span>
                        </button>
                    </nav>
                </div>

                <div className="order-1 sm:order-2 flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
                    <div className="max-w-4xl mx-auto h-full">
                        <div className="mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                                {activeTab === 'users' && 'ניהול משתמשים'}
                                {activeTab === 'content' && 'ניהול מודעות ברטר'}
                                {activeTab === 'data' && 'ניהול טקסונומיה (תחומים)'}
                                {activeTab === 'ads' && 'ניהול קמפיינים ופרסום'}
                            </h2>
                        </div>

                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'content' && renderContent()}
                        
                        {activeTab === 'data' && (
                            <div className="h-full">
                                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg mb-4 text-sm flex items-start gap-2">
                                    <GitMerge className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span>
                                        <strong>טיפ למנהל:</strong> לחץ על כפתור העיפרון כדי לערוך שם של תחום קיים. <br/>
                                        שינוי השם יעדכן אוטומטית את הפרופיל של כל המשתמשים המקושרים אליו, כך שאף אחד לא "ייעלם".
                                    </span>
                                </div>
                                {renderData()}
                            </div>
                        )}
                        
                        {activeTab === 'ads' && renderAds()}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
