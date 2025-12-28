import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Shield, FileText, BarChart3, Megaphone, 
  Search, RefreshCw, Mail, Trash2, CheckCircle, 
  Edit, Plus, Copy, Pencil, LayoutDashboard, Check, CornerDownRight, GitMerge, Users, Save, ArrowRightLeft, Lock,
  Upload, Target, Briefcase, Tag
} from 'lucide-react';
import { UserProfile, BarterOffer, SystemAd } from '../types';
import { ADMIN_EMAIL } from '../constants';
import { db } from '../services/firebaseConfig';

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

type TabType = 'users' | 'content' | 'data' | 'ads';

// Helper functions
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
            const timer = setTimeout(() => setIsConfirming(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [isConfirming]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isConfirming) {
            onDelete();
            setIsConfirming(false);
        } else {
            setIsConfirming(true);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`p-2 rounded-lg transition-all flex items-center justify-center min-w-[36px] ${
                isConfirming 
                ? 'bg-red-600 text-white w-auto px-3 shadow-md' 
                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
            } ${className}`}
            title={isConfirming ? "לחץ שוב לאישור סופי" : "מחק"}
        >
            {isConfirming ? (
                <span className="text-[10px] font-bold whitespace-nowrap animate-in fade-in slide-in-from-left-1">מחק?</span>
            ) : (
                <Trash2 className="w-4 h-4 pointer-events-none" />
            )}
        </button>
    );
};

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  
  // Local State
  const [userSearch, setUserSearch] = useState('');
  const [usersSubTab, setUsersSubTab] = useState<'all' | 'pending'>('all');
  const [contentTab, setContentTab] = useState<'pending' | 'all'>('pending');
  const [dateThreshold, setDateThreshold] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Data Tab State
  const [dataSubTab, setDataSubTab] = useState<'categories' | 'interests' | 'pending'>('categories');
  const [newDataInput, setNewDataInput] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editParent, setEditParent] = useState('');
  // User Drilldown Logic
  const [viewingUsersFor, setViewingUsersFor] = useState<{name: string, type: 'category' | 'interest'} | null>(null);
  
  // Reassign State
  const [reassignTarget, setReassignTarget] = useState<string | null>(null);
  const [reassignDestination, setReassignDestination] = useState('');

  // Ads State
  const [adEditId, setAdEditId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState<Partial<SystemAd>>({ 
      title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '', isActive: true 
  });
  const [targetCategories, setTargetCategories] = useState<string[]>(['Global']);
  const [targetInterests, setTargetInterests] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [catSearch, setCatSearch] = useState('');
  const [intSearch, setIntSearch] = useState('');

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

  const handleForceAdminSync = async () => {
      if (!props.currentUser) return;
      if (confirm("פעולה זו תכריח עדכון של הרשאת 'Admin' במסד הנתונים עבור המשתמש הנוכחי. האם להמשיך?")) {
          try {
              await db.collection("users").doc(props.currentUser.id).update({ role: 'admin' });
              alert("הרשאת Admin עודכנה בהצלחה במסד הנתונים.");
          } catch (e: any) {
              alert(`שגיאה בעדכון: ${e.message}`);
          }
      }
  };

  // --- Handlers ---

  const handleEditAdClick = (ad: SystemAd) => {
      setAdEditId(ad.id);
      setAdForm({ ...ad });
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

  // --- Render Functions ---

  const renderUsers = () => {
      let displayedUsers = safeUsers;
      if (usersSubTab === 'pending') {
          displayedUsers = safeUsers.filter(u => u.pendingUpdate);
      }

      const filtered = displayedUsers.filter(u => 
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
      ).sort((a, b) => new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime());
      
      return (
          <div className="space-y-4">
              <div className="flex gap-2 border-b border-slate-200">
                  <button onClick={() => setUsersSubTab('all')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${usersSubTab === 'all' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}>כל המשתמשים</button>
                  <button onClick={() => setUsersSubTab('pending')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${usersSubTab === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}>ממתינים לאישור {pendingUserUpdates > 0 && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px] font-black">{pendingUserUpdates}</span>}</button>
              </div>
              <div className="relative">
                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="text" placeholder="חפש משתמש..." className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              <div className="overflow-x-auto border rounded-xl max-h-[50vh] overflow-y-auto custom-scrollbar shadow-inner bg-white">
                  <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b"><tr><th className="px-4 py-3">שם</th><th className="px-4 py-3">מייל</th><th className="px-4 py-3">סטטוס</th><th className="px-4 py-3">פעולות</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                          {filtered.map(user => (
                              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => props.onViewProfile(user)}><img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-slate-200" /><span className="font-bold text-slate-800">{user.name}</span></td>
                                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{user.email}</td>
                                  <td className="px-4 py-3">{user.pendingUpdate ? (
                                      <button onClick={(e) => { e.stopPropagation(); props.onViewProfile(user); }} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold hover:bg-yellow-200">
                                          ממתין
                                      </button>
                                  ) : <span className="text-green-600 text-xs">פעיל</span>}</td>
                                  <td className="px-4 py-3">
                                      <div className="flex gap-2">
                                          <button onClick={() => props.onDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="מחיקה"><Trash2 className="w-4 h-4"/></button>
                                          {user.pendingUpdate && (
                                              <button onClick={() => props.onApproveUpdate(user.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="אישור"><CheckCircle className="w-4 h-4" /></button>
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
                      <input type="date" className="border border-slate-200 rounded px-2 py-1 bg-white" value={dateThreshold} onChange={e => setDateThreshold(e.target.value)} />
                      <button type="button" onClick={() => { if(confirmDelete) { props.onBulkDelete(dateThreshold); setConfirmDelete(false); } else setConfirmDelete(true); }} disabled={!dateThreshold} className={`px-3 py-1 rounded text-white font-bold ${confirmDelete ? 'bg-red-600 animate-pulse' : 'bg-slate-800'}`}>{confirmDelete ? 'בטוח?' : 'מחק'}</button>
                  </div>
              )}
              <div className="space-y-3 overflow-y-auto max-h-[60vh] p-1">
                  {displayed.map(offer => (
                      <div key={offer.id} className="p-4 rounded-xl border flex justify-between items-center bg-white border-slate-200">
                          <div className="flex items-center gap-3"><img src={offer.profile.avatarUrl} className="w-10 h-10 rounded-full" /><div><h4 className="font-bold text-slate-900">{offer.title}</h4><div className="text-xs text-slate-500">{offer.profile.name} • {new Date(offer.createdAt).toLocaleDateString()}</div></div></div>
                          <div className="flex gap-2">
                              {offer.status === 'pending' && <button onClick={() => props.onApproveOffer(offer.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">אשר</button>}
                              <button onClick={() => props.onEditOffer(offer)} className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Edit className="w-4 h-4"/></button>
                              <button onClick={() => props.onDeleteOffer(offer.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const renderData = () => {
      const getCategoryCount = (cat: string) => safeUsers.filter(u => (u.mainField || '').trim().toLowerCase() === cat.trim().toLowerCase()).length;
      const getInterestCount = (int: string) => safeUsers.filter(u => (u.interests || []).some(i => i.trim().toLowerCase() === int.trim().toLowerCase())).length;
      
      const handleAddData = () => {
          if (!newDataInput.trim()) return;
          dataSubTab === 'categories' ? props.onAddCategory(newDataInput.trim()) : props.onAddInterest(newDataInput.trim());
          setNewDataInput('');
      };
      
      const activeList = dataSubTab === 'categories' ? safeAvailableCategories : safeAvailableInterests;
      
      // Calculate derived sorted lists
      const sortedCategories = [...safeAvailableCategories].sort((a, b) => getCategoryCount(b) - getCategoryCount(a));
      
      // Helper for saving edits
      const handleSaveEdit = () => {
          if (!editingItem || !editName.trim()) return;
          if (dataSubTab === 'categories') {
              props.onEditCategory(editingItem, editName.trim(), editParent || undefined);
          } else {
              props.onEditInterest(editingItem, editName.trim());
          }
          setEditingItem(null); setEditName(''); setEditParent('');
      };

      const handleStartEdit = (item: string) => {
          setEditingItem(item);
          setEditName(item);
          if (dataSubTab === 'categories' && props.categoryHierarchy) {
              setEditParent(props.categoryHierarchy[item] || '');
          }
      };

      return (
          <div className="space-y-4 h-full flex flex-col relative">
              {viewingUsersFor && (
                  <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in fade-in slide-in-from-right-4 border-l border-slate-100">
                      <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              <Users className="w-5 h-5 text-brand-600" />
                              משתמשים ב: <span className="text-brand-700 underline">{viewingUsersFor.name}</span>
                          </h4>
                          <button onClick={() => setViewingUsersFor(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-full shadow-sm">
                              <ArrowRightLeft className="w-4 h-4" /> חזרה
                          </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                          {safeUsers.filter(u => 
                              viewingUsersFor.type === 'category' 
                              ? (u.mainField || '').trim().toLowerCase() === viewingUsersFor.name.trim().toLowerCase()
                              : (u.interests || []).some(i => i.trim().toLowerCase() === viewingUsersFor.name.trim().toLowerCase())
                          ).map(u => (
                              <div key={u.id} className="flex items-center gap-3 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => props.onViewProfile(u)}>
                                  <img src={u.avatarUrl} className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                                  <div>
                                      <div className="font-bold text-sm text-slate-800">{u.name}</div>
                                      <div className="text-xs text-slate-500">{u.email}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="flex border-b border-slate-200 bg-slate-50">
                  <button onClick={() => setDataSubTab('categories')} className={`flex-1 py-2 text-sm font-bold ${dataSubTab === 'categories' ? 'border-b-2 border-brand-600 text-brand-600 bg-white' : 'text-slate-500'}`}>תחומים</button>
                  <button onClick={() => setDataSubTab('pending')} className={`flex-1 py-2 text-sm font-bold ${dataSubTab === 'pending' ? 'border-b-2 border-orange-500 text-orange-600 bg-white' : 'text-slate-500'}`}>ממתינים ({pendingDataCount})</button>
                  <button onClick={() => setDataSubTab('interests')} className={`flex-1 py-2 text-sm font-bold ${dataSubTab === 'interests' ? 'border-b-2 border-pink-500 text-pink-600 bg-white' : 'text-slate-500'}`}>עניין</button>
              </div>
              
              {dataSubTab !== 'pending' && <div className="flex gap-2"><input className="flex-1 border rounded-xl px-3 py-2 text-sm" placeholder="הוסף..." value={newDataInput} onChange={e => setNewDataInput(e.target.value)} /><button onClick={handleAddData} className="bg-slate-800 text-white px-4 rounded-xl text-sm font-bold">הוסף</button></div>}
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-2">
                  {dataSubTab === 'pending' ? (
                      safePendingCategories.map(c => (
                          <div key={c} className="bg-orange-50 p-2 rounded flex justify-between flex-wrap gap-2 items-center border border-orange-100">
                              <span className="font-bold text-sm">{c}</span>
                              <div className="flex gap-2 items-center w-full sm:w-auto">
                                  <select className="text-xs border rounded p-1" onChange={(e) => { if (e.target.value) { props.onReassignCategory(c, e.target.value); } }}>
                                      <option value="">מיזוג ל...</option>
                                      {sortedCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                  </select>
                                  <button onClick={() => props.onApproveCategory(c)} className="text-green-600"><CheckCircle className="w-4 h-4"/></button>
                                  <button onClick={() => props.onRejectCategory(c)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
                              </div>
                          </div>
                      ))
                  ) : (
                      activeList.map(item => {
                          const count = dataSubTab === 'categories' ? getCategoryCount(item) : getInterestCount(item);
                          const isEditingThis = editingItem === item;
                          const parent = (dataSubTab === 'categories' && props.categoryHierarchy) ? props.categoryHierarchy[item] : null;

                          return (
                              <div key={item} className={`flex justify-between items-center p-2 border-b hover:bg-slate-50 ${isEditingThis ? 'bg-blue-50' : ''}`}>
                                  {isEditingThis ? (
                                      <div className="flex flex-col w-full gap-2">
                                          <div className="flex gap-2">
                                              <input value={editName} onChange={e => setEditName(e.target.value)} className="border rounded px-2 py-1 flex-1 text-sm bg-white" />
                                              {dataSubTab === 'categories' && (
                                                  <select value={editParent} onChange={e => setEditParent(e.target.value)} className="border rounded text-xs bg-white">
                                                      <option value="">ללא אב</option>
                                                      {sortedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                  </select>
                                              )}
                                          </div>
                                          
                                          {/* Merge Tool inside edit mode */}
                                          <div className="flex gap-2 items-center bg-slate-100 p-1 rounded">
                                              <span className="text-[10px] font-bold">מיזוג לתוך:</span>
                                              <select className="text-xs border rounded bg-white flex-1" onChange={(e) => { if(e.target.value && props.onReassignCategory) { if(window.confirm(`למזג את ${item} לתוך ${e.target.value}?`)) { props.onReassignCategory(item, e.target.value); setEditingItem(null); } } }}>
                                                  <option value="">בחר יעד...</option>
                                                  {sortedCategories.filter(c => c !== item).map(c => <option key={c} value={c}>{c}</option>)}
                                              </select>
                                          </div>

                                          <div className="flex justify-end gap-2">
                                              <button onClick={handleSaveEdit} className="text-xs bg-green-600 text-white px-2 py-1 rounded">שמור</button>
                                              <button onClick={() => setEditingItem(null)} className="text-xs bg-gray-300 px-2 py-1 rounded">ביטול</button>
                                          </div>
                                      </div>
                                  ) : (
                                      <>
                                          <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setViewingUsersFor({name: item, type: dataSubTab === 'categories' ? 'category' : 'interest'})}>
                                              <div className="flex flex-col">
                                                  <span className="font-medium text-sm text-slate-800">{item}</span>
                                                  {parent && <span className="text-[10px] text-slate-400 flex items-center"><CornerDownRight className="w-3 h-3 inline"/> {parent}</span>}
                                              </div>
                                              <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full">{count}</span>
                                          </div>
                                          <div className="flex gap-2">
                                              <button onClick={() => handleStartEdit(item)} className="text-blue-400 hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
                                              <button onClick={() => { if(window.confirm(`למחוק את ${item}?`)) dataSubTab === 'categories' ? props.onDeleteCategory(item) : props.onDeleteInterest(item); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                          </div>
                                      </>
                                  )}
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      );
  };

  const renderAds = () => {
      const inputClassName = "w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all";
      if (adEditId === 'new' || (adEditId && adEditId !== 'new')) {
          const filteredInterests = safeAvailableInterests.filter(i => (i||'').toLowerCase().includes(intSearch.toLowerCase()));
          const filteredCategories = safeAvailableCategories.filter(c => (c||'').toLowerCase().includes(catSearch.toLowerCase()));
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
                               <div className="border-2 border-dashed border-slate-300 h-40 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 relative overflow-hidden group bg-white shadow-inner" onClick={() => fileInputRef.current?.click()}>
                                   {adForm.imageUrl ? <><img src={adForm.imageUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">החלף תמונה</span></div></> : <div className="text-center"><Upload className="mx-auto mb-2 w-8 h-8 opacity-50"/><span className="text-xs text-slate-400">לחץ להעלאת תמונה</span></div>}
                                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { try { const url = await compressImage(e.target.files[0]); setAdForm({...adForm, imageUrl: url}); } catch (e) { alert('Error uploading'); }}}} />
                               </div>
                               <div className="mt-2 relative"><input placeholder="או הדבק כתובת תמונה URL" className={inputClassName} value={adForm.imageUrl} onChange={e => setAdForm({...adForm, imageUrl: e.target.value})} /></div>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center"><div><label className="block text-sm font-bold text-slate-700">סטטוס המודעה</label><p className="text-[10px] text-slate-500">האם המודעה מוצגת כרגע באתר?</p></div><button type="button" onClick={() => setAdForm({...adForm, isActive: !adForm.isActive})} className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${adForm.isActive ? 'bg-green-500' : 'bg-slate-300'}`}><span className={`absolute top-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${adForm.isActive ? 'left-1' : 'left-6'}`}></span></button></div>
                           <div><label className="block text-sm font-bold text-slate-700 mb-1.5">כותרת ראשית</label><input required className={inputClassName} value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} /></div>
                           <div><label className="block text-sm font-bold text-slate-700 mb-1.5">תיאור הקמפיין</label><textarea className={`${inputClassName} h-24 resize-none`} value={adForm.description} onChange={e => setAdForm({...adForm, description: e.target.value})} /></div>
                           <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-slate-700 mb-1.5">לינק ליעד</label><input required className={`${inputClassName} ltr text-left`} value={adForm.linkUrl} onChange={e => setAdForm({...adForm, linkUrl: e.target.value})} /></div><div><label className="block text-sm font-bold text-slate-700 mb-1.5">טקסט כפתור</label><input className={inputClassName} value={adForm.ctaText} onChange={e => setAdForm({...adForm, ctaText: e.target.value})} /></div></div>
                       </div>
                       <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5 h-fit"><h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm"><Target className="w-5 h-5 text-purple-600" /> הגדרות טרגוט</h4><div><label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-tighter">מקצועות וקטגוריות</label><div className="relative mb-2"><Briefcase className="w-3 h-3 absolute right-3 top-3 text-slate-400" /><input type="text" className={`${inputClassName} pr-9 py-1.5`} placeholder="חפש מקצוע..." value={catSearch} onChange={e => setCatSearch(e.target.value)}/></div><div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1"><button type="button" onClick={() => toggleTargetCategory('Global')} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${targetCategories.includes('Global') ? 'bg-purple-600 border-purple-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`}>Global</button>{filteredCategories.map(cat => <button key={cat} type="button" onClick={() => toggleTargetCategory(cat)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${targetCategories.includes(cat) ? 'bg-purple-600 border-purple-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`}>{cat}</button>)}</div></div><div className="mt-4 border-t border-slate-200 pt-4"><label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-tighter">תחומי עניין ונושאים</label><div className="relative mb-2"><Tag className="w-3 h-3 absolute right-3 top-3 text-slate-400" /><input type="text" className={`${inputClassName} pr-9 py-1.5`} placeholder="חפש נושא..." value={intSearch} onChange={e => setIntSearch(e.target.value)}/></div><div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">{filteredInterests.map(int => (<button key={int} type="button" onClick={() => toggleTargetInterest(int)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${targetInterests.includes(int) ? 'bg-pink-500 border-pink-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`}>{int}</button>))}</div></div></div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100"><button type="button" onClick={() => setAdEditId(null)} className="px-6 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-xl transition-colors">ביטול</button><button type="submit" className="bg-purple-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-md hover:bg-purple-700 transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> שמור שינויים</button></div>
              </form>
          );
      }
      return (
          <div className="space-y-4">
              <button onClick={() => { setAdEditId('new'); setAdForm({ title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '', targetCategories: ['Global'], targetInterests: [], isActive: true }); }} className="w-full py-4 border-2 border-dashed border-purple-200 text-purple-600 rounded-2xl font-bold hover:bg-purple-50 flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> יצירת קמפיין חדש</button>
              <div className="space-y-2 overflow-y-auto max-h-[60vh] p-1">
                  {safeAds.map(ad => (
                      <div key={ad.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                          <div><h4 className="font-bold text-slate-800">{ad.title}</h4><span className={`text-xs ${ad.isActive ? 'text-green-600' : 'text-red-600'}`}>{ad.isActive ? 'פעיל' : 'כבוי'}</span></div>
                          <div className="flex gap-1"><button onClick={() => handleEditAdClick(ad)} className="p-2 hover:bg-blue-50 text-blue-600 rounded"><Pencil className="w-4 h-4"/></button><button onClick={() => props.onDeleteAd(ad.id)} className="p-2 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4"/></button></div>
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
        <div className="inline-block bg-white text-right overflow-hidden shadow-2xl transform transition-all w-full h-[100dvh] sm:h-[85vh] sm:rounded-3xl sm:max-w-6xl flex flex-col relative z-50">
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800">מרכז ניהול</h3>
                    {props.currentUser?.email === ADMIN_EMAIL && (
                        <button 
                            onClick={handleForceAdminSync} 
                            className="bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-full transition-colors text-[10px] font-bold border border-red-200 flex items-center gap-1"
                            title="סנכרן הרשאות ניהול (חירום)"
                        >
                            <Lock className="w-3 h-3" />
                            סנכרן הרשאות
                        </button>
                    )}
                </div>
                <button onClick={props.onClose}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
                <div className="w-full sm:w-64 bg-slate-50 border-l border-slate-200">
                    <nav className="flex sm:flex-col p-2 gap-2">
                        <button onClick={() => setActiveTab('users')} className={`flex-1 p-3 rounded-xl text-right font-bold ${activeTab === 'users' ? 'bg-white shadow text-brand-700' : 'text-slate-500'}`}>משתמשים</button>
                        <button onClick={() => setActiveTab('content')} className={`flex-1 p-3 rounded-xl text-right font-bold ${activeTab === 'content' ? 'bg-white shadow text-brand-700' : 'text-slate-500'}`}>תוכן</button>
                        <button onClick={() => setActiveTab('data')} className={`flex-1 p-3 rounded-xl text-right font-bold ${activeTab === 'data' ? 'bg-white shadow text-brand-700' : 'text-slate-500'}`}>נתונים</button>
                        <button onClick={() => setActiveTab('ads')} className={`flex-1 p-3 rounded-xl text-right font-bold ${activeTab === 'ads' ? 'bg-white shadow text-brand-700' : 'text-slate-500'}`}>פרסום</button>
                    </nav>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'content' && renderContent()}
                    {activeTab === 'data' && renderData()}
                    {activeTab === 'ads' && renderAds()}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};