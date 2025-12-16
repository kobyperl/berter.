
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Shield, FileText, BarChart3, Megaphone, 
  Search, RefreshCw, Mail, Trash2, CheckCircle, 
  Edit, Plus, Upload, Save, Link as LinkIcon, 
  Target, Copy, Pencil, LayoutDashboard, Check, 
  ArrowUp, Users, MessageSquare, AlertTriangle,
  ArrowRightLeft, Eye, EyeOff, Briefcase, Tag
} from 'lucide-react';
import { UserProfile, BarterOffer, SystemAd, Message } from '../types';

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
  
  // Taxonomy Management
  onRenameItem: (oldName: string, newName: string, type: 'category' | 'interest') => void;
  onMergeItems: (source: string, target: string, type: 'category' | 'interest') => void;

  // Ads Data
  ads: SystemAd[];
  onAddAd: (ad: SystemAd) => void;
  onEditAd: (ad: SystemAd) => void;
  onDeleteAd: (id: string) => void;
  onToggleAdStatus: (adId: string, currentStatus: boolean) => void; 
  // Shared
  onViewProfile: (profile: UserProfile) => void;
  // Engagement Data
  messages?: Message[];
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

// --- Internal Component: Simple Bar Chart for Analytics ---
const SimpleChart = ({ data, color = "bg-blue-500", label }: { data: number[], color?: string, label: string }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="h-24 flex items-end gap-1 w-full mt-2">
            {data.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group relative">
                    <div 
                        className={`w-full rounded-t-sm ${color} opacity-80 hover:opacity-100 transition-all`} 
                        style={{ height: `${(val / max) * 100}%` }}
                    ></div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        {val}
                    </div>
                </div>
            ))}
        </div>
    );
};

type TabType = 'overview' | 'users' | 'content' | 'data' | 'ads';

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // --- Local State ---
  const [userSearch, setUserSearch] = useState('');
  const [contentTab, setContentTab] = useState<'pending' | 'all'>('pending');
  const [dateThreshold, setDateThreshold] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dataTab, setDataTab] = useState<'categories' | 'interests' | 'pending'>('categories');
  const [newDataInput, setNewDataInput] = useState('');
  const [reassignTarget, setReassignTarget] = useState<string | null>(null);
  const [reassignDestination, setReassignDestination] = useState('');
  
  // Taxonomy Edit State
  const [editItem, setEditItem] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');

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

  const pendingUserUpdates = props.users.filter(u => u.pendingUpdate).length;
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
          isActive: adForm.isActive !== undefined ? adForm.isActive : true 
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const compressed = await compressImage(file);
        setAdForm(prev => ({ ...prev, imageUrl: compressed }));
    } catch (err) {
        alert('שגיאה בטעינת התמונה');
    }
  };

  // --- Taxonomy Handlers ---
  const startEditItem = (item: string) => {
      setEditItem(item);
      setRenameValue(item);
      setMergeMode(false);
      setMergeTarget('');
  };

  const saveEditItem = () => {
      if (!editItem) return;
      const type = dataTab === 'categories' ? 'category' : 'interest';
      
      if (mergeMode) {
          if (!mergeTarget || mergeTarget === editItem) {
              alert('נא לבחור יעד חוקי למיזוג');
              return;
          }
          if (window.confirm(`האם למזג את "${editItem}" לתוך "${mergeTarget}"? כל המשתמשים יעודכנו.`)) {
              props.onMergeItems(editItem, mergeTarget, type);
              setEditItem(null);
          }
      } else {
          if (renameValue !== editItem) {
              if (window.confirm(`האם לשנות את השם מ-"${editItem}" ל-"${renameValue}"?`)) {
                  props.onRenameItem(editItem, renameValue, type);
                  setEditItem(null);
              }
          } else {
              setEditItem(null);
          }
      }
  };

  // --- Analytics Logic ---
  const getAnalyticsData = () => {
    const getLast14DaysCounts = (items: any[], dateField: string) => {
        const counts = new Array(14).fill(0);
        const today = new Date();
        today.setHours(0,0,0,0);
        items.forEach(item => {
            const date = new Date(item[dateField]);
            date.setHours(0,0,0,0);
            const diffTime = Math.abs(today.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays < 14) {
                counts[13 - diffDays] = (counts[13 - diffDays] || 0) + 1;
            }
        });
        return counts;
    };
    const userGrowth = getLast14DaysCounts(props.users, 'joinedAt');
    const offerGrowth = getLast14DaysCounts(props.offers, 'createdAt');
    const messageGrowth = getLast14DaysCounts(props.messages || [], 'timestamp');
    return { userGrowth, offerGrowth, messageGrowth };
  };

  const { userGrowth, offerGrowth } = getAnalyticsData();

  // --- Render Sections ---

  // 0. Overview
  const renderOverview = () => {
      const activeOffers = props.offers.filter(o => o.status === 'active').length;
      return (
          <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:border-brand-200 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start z-10">
                          <div>
                              <p className="text-xs font-bold text-slate-500 uppercase">משתמשים</p>
                              <h3 className="text-3xl font-bold text-slate-800 mt-1">{props.users.length}</h3>
                          </div>
                          <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                              <Users className="w-5 h-5" />
                          </div>
                      </div>
                      <div className="z-10 mt-auto flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded-full">
                          <ArrowUp className="w-3 h-3" />
                          פעילים במערכת
                      </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:border-brand-200 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start z-10">
                          <div>
                              <p className="text-xs font-bold text-slate-500 uppercase">מודעות פעילות</p>
                              <h3 className="text-3xl font-bold text-slate-800 mt-1">{activeOffers}</h3>
                          </div>
                          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                              <FileText className="w-5 h-5" />
                          </div>
                      </div>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-800">הצטרפות משתמשים (14 ימים אחרונים)</h4>
                      </div>
                      <SimpleChart data={userGrowth} color="bg-blue-500" label="Users" />
                  </div>
              </div>
          </div>
      );
  };

  // 1. Users
  const renderUsers = () => {
      const filtered = props.users.filter(u => 
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
      ).sort((a, b) => {
          const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
          const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
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
                          <tr><th className="px-4 py-3">שם</th><th className="px-4 py-3">מייל</th><th className="px-4 py-3">הצטרף</th><th className="px-4 py-3">סטטוס</th><th className="px-4 py-3">פעולות</th></tr>
                      </thead>
                      <tbody className="divide-y">
                          {filtered.map(user => (
                              <tr key={user.id} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => props.onViewProfile(user)}>
                                      <img src={user.avatarUrl} className="w-10 h-10 rounded-full border border-slate-200 object-cover aspect-square" alt="" />
                                      <div className="min-w-0">
                                          <div className="font-bold text-slate-800 truncate">{user.name}</div>
                                          <div className="text-[10px] text-slate-500 truncate">{user.mainField}</div>
                                      </div>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                                  <td className="px-4 py-3 text-xs text-slate-500">{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '-'}</td>
                                  <td className="px-4 py-3">
                                      {user.pendingUpdate ? (
                                          <button onClick={() => props.onViewProfile(user)} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                                              <RefreshCw className="w-3 h-3" /> ממתין
                                          </button>
                                      ) : <span className="text-green-600 text-xs">פעיל</span>}
                                  </td>
                                  <td className="px-4 py-3">
                                      <div className="flex gap-2 items-center">
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

  // 2. Content (Offers)
  const renderContent = () => {
      const pendingOffers = props.offers.filter(o => o.status === 'pending');
      const displayed = contentTab === 'pending' ? pendingOffers : props.offers;

      return (
          <div className="space-y-4">
              <div className="flex gap-2 border-b">
                  <button onClick={() => setContentTab('pending')} className={`px-4 py-2 text-sm font-bold border-b-2 ${contentTab === 'pending' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500'}`}>ממתינות ({pendingOffers.length})</button>
                  <button onClick={() => setContentTab('all')} className={`px-4 py-2 text-sm font-bold border-b-2 ${contentTab === 'all' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500'}`}>כל המודעות</button>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[60vh] p-1">
                  {displayed.length === 0 && <div className="text-center py-10 text-slate-400">אין מודעות להצגה</div>}
                  {displayed.map(offer => (
                      <div key={offer.id} className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-slate-200">
                          <div className="flex items-start gap-3 w-full">
                              <img src={offer.profile.avatarUrl} className="w-10 h-10 rounded-full border border-slate-200 object-cover aspect-square" alt="" />
                              <div className="flex-1">
                                  <h4 className="font-bold text-slate-900">{offer.title}</h4>
                                  <div className="text-xs text-slate-500">{offer.profile.name}</div>
                              </div>
                          </div>
                          <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end items-center">
                              {offer.status === 'pending' && <button onClick={() => props.onApproveOffer(offer.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">אשר</button>}
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
                          <div key={cat} className="bg-orange-50 p-3 rounded-lg border border-orange-200 flex justify-between items-center">
                              <span className="font-bold text-slate-800">{cat}</span>
                              <div className="flex gap-2">
                                  <button onClick={() => props.onApproveCategory(cat)} className="text-green-600 hover:bg-green-100 p-2 rounded"><CheckCircle className="w-5 h-5"/></button>
                                  <DeleteToggleButton onDelete={() => props.onRejectCategory(cat)} />
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="space-y-4">
                      {/* Add New Input */}
                      <div className="flex gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <input 
                            value={newDataInput} 
                            onChange={e => setNewDataInput(e.target.value)} 
                            className="flex-1 border rounded-lg px-3 py-2 bg-white" 
                            placeholder={dataTab === 'categories' ? 'הוסף מקצוע (היררכיה: ראשי > משני)' : 'הוסף תחום עניין'} 
                            onKeyPress={e => e.key === 'Enter' && handleAdd()}
                          />
                          <button onClick={handleAdd} className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold">הוסף</button>
                      </div>

                      {/* List Items */}
                      <div className="overflow-y-auto max-h-[60vh] space-y-2 pr-1">
                          {sortedItems.map(item => {
                              const isEditing = editItem === item;
                              if (isEditing) {
                                  return (
                                      <div key={item} className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-in fade-in">
                                          <div className="flex flex-col gap-3">
                                              <div className="flex items-center gap-2">
                                                  <span className="text-xs font-bold text-slate-500">עריכת: {item}</span>
                                                  <div className="flex gap-2 mr-auto text-xs">
                                                      <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={!mergeMode} onChange={() => setMergeMode(false)} /> שינוי שם</label>
                                                      <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={mergeMode} onChange={() => setMergeMode(true)} /> מיזוג</label>
                                                  </div>
                                              </div>
                                              
                                              {mergeMode ? (
                                                  <select className="w-full border rounded p-2 text-sm bg-white" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)}>
                                                      <option value="">בחר יעד למיזוג...</option>
                                                      {listItems.filter(i => i !== item).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                  </select>
                                              ) : (
                                                  <input className="w-full border rounded p-2 text-sm" value={renameValue} onChange={e => setRenameValue(e.target.value)} />
                                              )}

                                              <div className="flex gap-2 justify-end">
                                                  <button onClick={() => setEditItem(null)} className="text-slate-500 text-xs px-3 py-1">ביטול</button>
                                                  <button onClick={saveEditItem} className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded font-bold">שמור</button>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              }

                              return (
                                  <div key={item} className="flex justify-between items-center p-2 border rounded-lg hover:bg-slate-50 group bg-white">
                                      <span className="font-medium text-slate-700">{item}</span>
                                      <div className="flex items-center gap-2">
                                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{getCount(item)} משתמשים</span>
                                          <button onClick={() => startEditItem(item)} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded" title="ערוך / מזג"><Pencil className="w-4 h-4"/></button>
                                          <DeleteToggleButton onDelete={() => { if(dataTab === 'categories') props.onDeleteCategory(item); else props.onDeleteInterest(item); }} />
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}
          </div>
      );
  };

  // 4. Ads - Full Restoration of Rich UI + Toggle Feature
  const renderAds = () => {
      const inputClassName = "w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 shadow-sm";

      if (adEditId === 'new' || (adEditId && adEditId !== 'new')) {
          // Filtering logic for the form chips
          const filteredInterests = props.availableInterests.filter(i => (i || '').toLowerCase().includes(intSearch.toLowerCase()));
          const filteredCategories = props.availableCategories.filter(c => (c || '').toLowerCase().includes(catSearch.toLowerCase()));

          return (
              <form onSubmit={handleAdSubmit} className="space-y-6 overflow-y-auto max-h-[75vh] p-1">
                  <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-lg text-slate-800">{adEditId === 'new' ? 'יצירת קמפיין חדש' : 'עריכת קמפיין'}</h3>
                      <button type="button" onClick={() => setAdEditId(null)} className="text-slate-400 hover:text-slate-700 bg-slate-50 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Visuals */}
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">תמונת קמפיין</label>
                          <div 
                              className="border-2 border-dashed border-slate-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden relative group"
                              onClick={() => fileInputRef.current?.click()}
                          >
                              {adForm.imageUrl ? (
                                  <>
                                      <img src={adForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                                          <span className="text-white opacity-0 group-hover:opacity-100 font-medium bg-black/50 px-3 py-1 rounded-full">החלף תמונה</span>
                                      </div>
                                  </>
                              ) : (
                                  <>
                                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                      <span className="text-sm text-slate-500">לחץ להעלאת תמונה</span>
                                  </>
                              )}
                              <input 
                                  type="file"
                                  ref={fileInputRef}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                              />
                          </div>
                          <div className="mt-2">
                              <label className="block text-sm font-bold text-slate-700 mb-1">או הדבק כתובת תמונה</label>
                              <input 
                                  type="text"
                                  className={inputClassName}
                                  placeholder="https://..."
                                  value={adForm.imageUrl}
                                  onChange={e => setAdForm({...adForm, imageUrl: e.target.value})}
                              />
                          </div>

                          <div className="mt-6">
                              <label className="block text-sm font-bold text-slate-700 mb-1">טקסט תחתון (אופציונלי)</label>
                              <input 
                                  type="text"
                                  className={inputClassName}
                                  placeholder='למשל: "בחסות המערכת" או השאר ריק'
                                  value={adForm.subLabel}
                                  onChange={e => setAdForm({...adForm, subLabel: e.target.value})}
                              />
                          </div>

                          <div className="mt-6 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="text-sm font-bold text-slate-700">סטטוס מודעה (פעיל/מוסתר)</span>
                              <button
                                  type="button"
                                  onClick={() => setAdForm({...adForm, isActive: !adForm.isActive})}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${adForm.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                              >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adForm.isActive ? 'translate-x-1' : 'translate-x-6'}`} />
                              </button>
                          </div>
                      </div>

                      {/* Right Column: Details & Targeting */}
                      <div className="space-y-5">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">כותרת המודעה</label>
                              <input 
                                  required
                                  type="text"
                                  className={inputClassName}
                                  placeholder="למשל: ציוד נגינה במבצע"
                                  value={adForm.title}
                                  onChange={e => setAdForm({...adForm, title: e.target.value})}
                              />
                          </div>
                          
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                              <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                  <Target className="w-4 h-4 text-purple-600" />
                                  הגדרות טרגוט (קהל יעד)
                              </h4>
                              
                              {/* Professions / Categories */}
                              <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-2">מקצועות וקטגוריות באתר</label>
                                  <div className="relative mb-2">
                                      <Briefcase className="w-3 h-3 absolute right-3 top-3 text-slate-400" />
                                      <input 
                                          type="text"
                                          className={`${inputClassName} pr-9 py-1.5`}
                                          placeholder="חפש או הוסף מקצוע..."
                                          value={catSearch}
                                          onChange={e => setCatSearch(e.target.value)}
                                      />
                                  </div>
                                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-1 mb-2">
                                      <button
                                          type="button"
                                          onClick={() => toggleTargetCategory('Global')}
                                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                                              targetCategories.includes('Global') 
                                              ? 'bg-purple-600 border-purple-600 text-white' 
                                              : 'bg-white border-slate-300 text-slate-600 hover:border-purple-300'
                                          }`}
                                      >
                                          {targetCategories.includes('Global') && <Check className="w-3 h-3" />}
                                          Global (כולם)
                                      </button>
                                      {filteredCategories.map(cat => (
                                          <button
                                              key={cat}
                                              type="button"
                                              onClick={() => toggleTargetCategory(cat)}
                                              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                                                  targetCategories.includes(cat) 
                                                  ? 'bg-purple-600 border-purple-600 text-white' 
                                                  : 'bg-white border-slate-300 text-slate-600 hover:border-purple-300'
                                              }`}
                                          >
                                              {targetCategories.includes(cat) && <Check className="w-3 h-3" />}
                                              {cat}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              {/* Subject Matters / Interests Selector */}
                              <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1">תחומי עניין / נושאים (Subject Matters)</label>
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
                                      {filteredInterests.map(interest => (
                                          <button
                                              key={interest}
                                              type="button"
                                              onClick={() => toggleTargetInterest(interest)}
                                              className={`px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1 ${
                                                  targetInterests.includes(interest)
                                                  ? 'bg-pink-500 border-pink-500 text-white'
                                                  : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300'
                                              }`}
                                          >
                                              {targetInterests.includes(interest) && <Check className="w-3 h-3" />}
                                              {interest}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">טקסט תיאור</label>
                              <textarea 
                                  className={`${inputClassName} h-20 resize-none`}
                                  placeholder="תיאור קצר שיופיע מתחת לכותרת..."
                                  value={adForm.description}
                                  onChange={e => setAdForm({...adForm, description: e.target.value})}
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1">טקסט כפתור</label>
                                  <input 
                                      type="text"
                                      className={inputClassName}
                                      value={adForm.ctaText}
                                      onChange={e => setAdForm({...adForm, ctaText: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1">לינק ליעד</label>
                                  <div className="relative">
                                      <LinkIcon className="w-4 h-4 absolute right-3 top-3.5 text-slate-400" />
                                      <input 
                                          required
                                          type="url"
                                          className={`${inputClassName} pr-9`}
                                          placeholder="https://..."
                                          value={adForm.linkUrl}
                                          onChange={e => setAdForm({...adForm, linkUrl: e.target.value})}
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                       <button 
                          type="button"
                          onClick={() => setAdEditId(null)}
                          className="px-6 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                       >
                           ביטול
                       </button>
                       <button 
                          type="submit"
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors"
                       >
                           {adEditId && adEditId !== 'new' ? (
                               <>
                                  <Save className="w-5 h-5" />
                                  שמור שינויים
                               </>
                           ) : (
                               <>
                                  <Plus className="w-5 h-5" />
                                  פרסם מודעה
                               </>
                           )}
                       </button>
                  </div>
              </form>
          );
      }

      // List View (With Visibility Toggle)
      return (
          <div className="space-y-4">
              <button 
                onClick={() => { 
                    setAdEditId('new'); 
                    setAdForm({ title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '', isActive: true }); 
                    setTargetCategories(['Global']); 
                    setTargetInterests([]); 
                }}
                className="w-full py-4 border-2 border-dashed border-purple-200 text-purple-600 rounded-xl font-bold hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors"
              >
                  <Plus className="w-5 h-5" /> יצירת קמפיין חדש
              </button>
              <div className="space-y-2 overflow-y-auto max-h-[60vh] p-1">
                  {props.ads.map(ad => (
                      <div key={ad.id} className={`flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group relative ${!ad.isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                          
                          <div className="flex-1 min-w-0 pl-3">
                              <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-slate-800 text-sm truncate">{ad.title}</h4>
                                  {!ad.isActive && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border">מוסתר</span>}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                                      {ad.targetCategories?.[0] || 'כללי'}
                                  </span>
                                  <span className="truncate max-w-[200px] ltr text-right text-[10px]">{ad.linkUrl}</span>
                              </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                              {/* Toggle Visibility Button - New Feature */}
                              <button 
                                onClick={() => props.onToggleAdStatus(ad.id, ad.isActive)}
                                className={`p-1.5 rounded-lg transition-colors ${ad.isActive ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-purple-600 bg-purple-50 hover:bg-purple-100'}`}
                                title={ad.isActive ? "הסתר מודעה זמנית" : "הצג מודעה"}
                              >
                                  {ad.isActive ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                              </button>

                              <button onClick={() => handleDuplicateAd(ad)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="שכפל"><Copy className="w-4 h-4"/></button>
                              <button onClick={() => handleEditAdClick(ad)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="ערוך"><Pencil className="w-4 h-4"/></button>
                              <DeleteToggleButton onDelete={() => props.onDeleteAd(ad.id)} />
                              
                              <img 
                                src={ad.imageUrl} 
                                className={`w-16 h-10 object-cover rounded-lg border border-slate-100 shadow-sm ${!ad.isActive ? 'grayscale' : ''}`}
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
                        {['overview', 'users', 'content', 'data', 'ads'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as TabType)}
                                className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white shadow-sm text-brand-700 font-bold ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {tab === 'overview' && <BarChart3 className="w-5 h-5"/>}
                                {tab === 'users' && <Shield className="w-5 h-5"/>}
                                {tab === 'content' && <FileText className="w-5 h-5"/>}
                                {tab === 'data' && <CheckCircle className="w-5 h-5"/>}
                                {tab === 'ads' && <Megaphone className="w-5 h-5"/>}
                                <span className="capitalize hidden sm:inline">{tab}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="order-1 sm:order-2 flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
                    <div className="max-w-4xl mx-auto h-full">
                        {activeTab === 'overview' && renderOverview()}
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
