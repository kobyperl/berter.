
import React, { useState } from 'react';
import { 
  X, Shield, FileText, BarChart3, Megaphone, 
  Search, RefreshCw, Mail, Trash2, CheckCircle, 
  Edit, Plus, Copy, Pencil, LayoutDashboard, Check, CornerDownRight, GitMerge, Users, Save, ArrowRightLeft
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

type TabType = 'users' | 'content' | 'data' | 'ads';

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
                                  <td className="px-4 py-3">{user.pendingUpdate ? <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold">ממתין</span> : <span className="text-green-600 text-xs">פעיל</span>}</td>
                                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => props.onDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button></div></td>
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
      
      return (
          <div className="space-y-4 h-full flex flex-col">
              <div className="flex border-b border-slate-200 bg-slate-50">
                  <button onClick={() => setDataSubTab('categories')} className={`flex-1 py-2 text-sm font-bold ${dataSubTab === 'categories' ? 'border-b-2 border-brand-600 text-brand-600 bg-white' : 'text-slate-500'}`}>תחומים</button>
                  <button onClick={() => setDataSubTab('pending')} className={`flex-1 py-2 text-sm font-bold ${dataSubTab === 'pending' ? 'border-b-2 border-orange-500 text-orange-600 bg-white' : 'text-slate-500'}`}>ממתינים ({pendingDataCount})</button>
                  <button onClick={() => setDataSubTab('interests')} className={`flex-1 py-2 text-sm font-bold ${dataSubTab === 'interests' ? 'border-b-2 border-pink-500 text-pink-600 bg-white' : 'text-slate-500'}`}>עניין</button>
              </div>
              {dataSubTab !== 'pending' && <div className="flex gap-2"><input className="flex-1 border rounded-xl px-3 py-2 text-sm" placeholder="הוסף..." value={newDataInput} onChange={e => setNewDataInput(e.target.value)} /><button onClick={handleAddData} className="bg-slate-800 text-white px-4 rounded-xl text-sm font-bold">הוסף</button></div>}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-2">
                  {dataSubTab === 'pending' ? (
                      safePendingCategories.map(c => <div key={c} className="bg-orange-50 p-2 rounded flex justify-between"><span>{c} (מקצוע)</span><div className="flex gap-2"><button onClick={() => props.onApproveCategory(c)} className="text-green-600"><CheckCircle className="w-4 h-4"/></button><button onClick={() => props.onRejectCategory(c)} className="text-red-600"><Trash2 className="w-4 h-4"/></button></div></div>)
                  ) : (
                      activeList.map(item => (
                          <div key={item} className="flex justify-between items-center p-2 border-b hover:bg-slate-50">
                              <span>{item} ({dataSubTab === 'categories' ? getCategoryCount(item) : getInterestCount(item)})</span>
                              <div className="flex gap-2">
                                  <button onClick={() => { if(window.confirm(`למחוק את ${item}?`)) dataSubTab === 'categories' ? props.onDeleteCategory(item) : props.onDeleteInterest(item); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      );
  };

  const renderAds = () => {
      return (
          <div className="space-y-4">
              <button onClick={() => { setAdEditId('new'); setAdForm({ title: '', description: '', ctaText: 'לפרטים', linkUrl: '', imageUrl: '', subLabel: '', isActive: true }); }} className="w-full py-4 border-2 border-dashed border-purple-200 text-purple-600 rounded-2xl font-bold hover:bg-purple-50 flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> יצירת קמפיין חדש</button>
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
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-200 bg-white shrink-0"><h3 className="text-lg font-bold text-slate-800">מרכז ניהול</h3><button onClick={props.onClose}><X className="w-5 h-5" /></button></div>
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
