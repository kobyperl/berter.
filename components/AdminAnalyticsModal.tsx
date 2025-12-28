
import React, { useState } from 'react';
import { X, Briefcase, Heart, Plus, BarChart3, Trash2, CheckCircle, RefreshCw, ArrowRightLeft, Pencil, Save, GitMerge, CornerDownRight, Check, Users } from 'lucide-react';
import { UserProfile } from '../types';

interface AdminAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  availableCategories: string[];
  availableInterests: string[];
  categoryHierarchy?: Record<string, string>;
  onAddCategory: (category: string) => void;
  onAddInterest: (interest: string) => void;
  onDeleteCategory: (category: string) => void;
  onDeleteInterest: (interest: string) => void;
  // Pending Management
  pendingCategories?: string[];
  pendingInterests?: string[];
  onApproveCategory?: (category: string) => void;
  onRejectCategory?: (category: string) => void;
  onReassignCategory?: (oldCategory: string, newCategory: string) => void;
  onApproveInterest?: (interest: string) => void;
  onRejectInterest?: (interest: string) => void;
  // Edit Existing
  onEditCategory: (oldName: string, newName: string, parentCategory?: string) => void;
  onEditInterest: (oldName: string, newName: string) => void;
  onViewProfile?: (profile: UserProfile) => void; // Added prop for user drilldown
}

export const AdminAnalyticsModal: React.FC<AdminAnalyticsModalProps> = ({
  isOpen,
  onClose,
  users,
  availableCategories,
  availableInterests,
  categoryHierarchy = {},
  onAddCategory,
  onAddInterest,
  onDeleteCategory,
  onDeleteInterest,
  pendingCategories = [],
  pendingInterests = [],
  onApproveCategory,
  onRejectCategory,
  onReassignCategory,
  onApproveInterest,
  onRejectInterest,
  onEditCategory,
  onEditInterest,
  onViewProfile
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'interests' | 'pending'>('categories');
  const [newInput, setNewInput] = useState('');
  
  // Pending Reassign State
  const [reassignTarget, setReassignTarget] = useState<string | null>(null);
  const [reassignDestination, setReassignDestination] = useState('');

  // Editing State
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editParent, setEditParent] = useState('');

  if (!isOpen) return null;

  const getCategoryCount = (category: string) => {
    return users.filter(u => (u.mainField || '').trim().toLowerCase() === category.trim().toLowerCase()).length;
  };

  const getInterestCount = (interest: string) => {
    return users.filter(u => (u.interests || []).some(i => i.trim().toLowerCase() === interest.trim().toLowerCase())).length;
  };

  const sortedCategories = [...availableCategories].sort((a, b) => getCategoryCount(b) - getCategoryCount(a));
  const sortedInterests = [...availableInterests].sort((a, b) => getInterestCount(b) - getInterestCount(a));

  const handleAdd = () => {
    if (!newInput.trim()) return;
    if (activeTab === 'categories') {
        onAddCategory(newInput.trim());
    } else {
        onAddInterest(newInput.trim());
    }
    setNewInput('');
  };

  const handleDelete = (item: string) => {
      const count = activeTab === 'categories' ? getCategoryCount(item) : getInterestCount(item);
      if (count > 0) {
          if (!window.confirm(`שים לב: ישנם ${count} משתמשים הרשומים תחת "${item}". האם אתה בטוח שברצונך למחוק?`)) {
              return;
          }
      } else {
          if (!window.confirm(`האם למחוק את "${item}"?`)) return;
      }

      if (activeTab === 'categories') {
          onDeleteCategory(item);
      } else {
          onDeleteInterest(item);
      }
  };

  const handleStartEdit = (item: string) => {
      setEditingItem(item);
      setEditName(item);
      if (activeTab === 'categories') {
          setEditParent(categoryHierarchy[item] || '');
      }
  };

  const handleSaveEdit = () => {
      if (!editingItem || !editName.trim()) return;
      
      if (activeTab === 'categories') {
          onEditCategory(editingItem, editName.trim(), editParent || undefined);
      } else {
          onEditInterest(editingItem, editName.trim());
      }
      
      setEditingItem(null);
      setEditName('');
      setEditParent('');
  };

  const handleExecuteReassign = () => {
      if (reassignTarget && reassignDestination && onReassignCategory) {
          if (window.confirm(`האם למזג את "${reassignTarget}" לתוך "${reassignDestination}"?`)) {
              onReassignCategory(reassignTarget, reassignDestination);
              setReassignTarget(null);
              setReassignDestination('');
          }
      }
  };

  const activeList = activeTab === 'categories' ? sortedCategories : sortedInterests;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-4xl w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-brand-600" />
                    <h3 className="text-lg font-bold text-slate-800">
                        ניהול טקסונומיה
                    </h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50">
                <button onClick={() => setActiveTab('categories')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'categories' ? 'border-b-2 border-brand-600 text-brand-600 bg-white' : 'text-slate-600 hover:bg-slate-100'}`}>מקצועות</button>
                <button onClick={() => setActiveTab('pending')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'pending' ? 'border-b-2 border-orange-500 text-orange-600 bg-white' : 'text-slate-600 hover:bg-slate-100'}`}>ממתינים ({pendingCategories.length + pendingInterests.length})</button>
                <button onClick={() => setActiveTab('interests')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'interests' ? 'border-b-2 border-pink-500 text-pink-600 bg-white' : 'text-slate-600 hover:bg-slate-100'}`}>תחומי עניין</button>
            </div>

            <div className="p-6 h-[500px] flex flex-col">
                {activeTab !== 'pending' && (
                    <div className="flex gap-2 mb-6">
                        <input className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm" placeholder={activeTab === 'categories' ? 'הוסף מקצוע...' : 'הוסף עניין...'} value={newInput} onChange={e => setNewInput(e.target.value)} />
                        <button onClick={handleAdd} className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold text-sm"><Plus className="w-4 h-4 inline ml-1"/> הוסף</button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {activeTab === 'pending' ? (
                        <>
                            {pendingCategories.map(cat => (
                                <div key={cat} className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold">{cat} (מקצוע)</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => onApproveCategory && onApproveCategory(cat)} className="text-green-600"><CheckCircle className="w-5 h-5"/></button>
                                            <button onClick={() => onRejectCategory && onRejectCategory(cat)} className="text-red-600"><Trash2 className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <select className="flex-1 border rounded text-xs p-1" value={reassignTarget === cat ? reassignDestination : ''} onChange={e => { setReassignTarget(cat); setReassignDestination(e.target.value); }}>
                                            <option value="">מיזוג עם...</option>
                                            {sortedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <button onClick={handleExecuteReassign} disabled={reassignTarget !== cat} className="bg-slate-800 text-white px-2 py-1 rounded text-xs">מזג</button>
                                    </div>
                                </div>
                            ))}
                            {pendingInterests.map(int => (
                                <div key={int} className="bg-pink-50 p-3 rounded-lg border border-pink-100 mb-2 flex justify-between items-center">
                                    <span className="font-bold">{int} (עניין)</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => onApproveInterest && onApproveInterest(int)} className="text-green-600"><CheckCircle className="w-5 h-5"/></button>
                                        <button onClick={() => onRejectInterest && onRejectInterest(int)} className="text-red-600"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        activeList.map(item => {
                            const isEditingThis = editingItem === item;
                            const count = activeTab === 'categories' ? getCategoryCount(item) : getInterestCount(item);
                            return (
                                <div key={item} className="flex justify-between items-center p-3 border-b hover:bg-slate-50">
                                    {isEditingThis ? (
                                        <div className="flex gap-2 flex-1 ml-4">
                                            <input value={editName} onChange={e => setEditName(e.target.value)} className="border rounded px-2 py-1 flex-1 text-sm" />
                                            <button onClick={handleSaveEdit} className="text-green-600"><Save className="w-4 h-4"/></button>
                                            <button onClick={() => setEditingItem(null)} className="text-slate-400"><X className="w-4 h-4"/></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{item}</span>
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{count}</span>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        {!isEditingThis && (
                                            <>
                                                <button onClick={() => handleStartEdit(item)} className="text-blue-400 hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
                                                <button onClick={() => handleDelete(item)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
