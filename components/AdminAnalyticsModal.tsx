
import React, { useState } from 'react';
import { X, Briefcase, Heart, Plus, BarChart3, Trash2, CheckCircle, RefreshCw, ArrowRightLeft, Pencil, Save, GitMerge, CornerDownRight, Check } from 'lucide-react';
import { UserProfile } from '../types';

interface AdminAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  availableCategories: string[];
  availableInterests: string[];
  categoryHierarchy?: Record<string, string>; // New prop
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
  onEditInterest
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'interests' | 'pending'>('categories');
  const [newInput, setNewInput] = useState('');
  
  // Pending Reassign State
  const [reassignTarget, setReassignTarget] = useState<string | null>(null);
  const [reassignDestination, setReassignDestination] = useState('');

  // Editing State (For Approved Items)
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editParent, setEditParent] = useState('');

  if (!isOpen) return null;

  // Calculate Counts with Case-Insensitive Matching
  const getCategoryCount = (category: string) => {
    return users.filter(u => (u.mainField || '').trim().toLowerCase() === category.trim().toLowerCase()).length;
  };

  const getInterestCount = (interest: string) => {
    return users.filter(u => (u.interests || []).some(i => i.trim().toLowerCase() === interest.trim().toLowerCase())).length;
  };

  // Sort by popularity (count) descending
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
          if (!window.confirm(`שים לב: ישנם ${count} משתמשים הרשומים תחת "${item}". מחיקת התחום לא תמחק אותם, אך תסיר אותו מהרשימה לרישום חדש. האם להמשיך?`)) {
              return;
          }
      } else {
          if (!window.confirm(`האם למחוק את "${item}" מהמערכת?`)) return;
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
          if (window.confirm(`האם אתה בטוח שברצונך להעביר את כל המשתמשים מ-"${reassignTarget}" ל-"${reassignDestination}"?`)) {
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
                        ניהול תחומים ונתונים
                    </h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50">
                <button 
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        activeTab === 'categories' 
                        ? 'border-b-2 border-brand-600 text-brand-600 bg-white' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Briefcase className="w-4 h-4" />
                    תחומים מאושרים
                </button>
                <button 
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        activeTab === 'pending' 
                        ? 'border-b-2 border-orange-500 text-orange-600 bg-white' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <RefreshCw className="w-4 h-4" />
                    ממתינים לאישור ({pendingCategories.length + pendingInterests.length})
                </button>
                <button 
                    onClick={() => setActiveTab('interests')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        activeTab === 'interests' 
                        ? 'border-b-2 border-pink-500 text-pink-600 bg-white' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Heart className="w-4 h-4" />
                    תחומי עניין
                </button>
            </div>

            <div className="p-6 h-[500px] flex flex-col">
                
                {activeTab === 'pending' ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                        {pendingCategories.length === 0 && pendingInterests.length === 0 && (
                            <div className="text-center py-10 text-slate-500">
                                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                                <p>אין תחומים חדשים הממתינים לאישור.</p>
                            </div>
                        )}
                        
                        {/* Pending Categories Section */}
                        {pendingCategories.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b pb-1">מקצועות וקטגוריות</h4>
                                {pendingCategories.map(cat => (
                                    <div key={cat} className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-3">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg">{cat}</h4>
                                                <span className="text-xs text-slate-500">
                                                    בשימוש ע"י {getCategoryCount(cat)} משתמשים
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => onApproveCategory && onApproveCategory(cat)}
                                                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> אשר
                                                </button>
                                                <button 
                                                    onClick={() => onRejectCategory && onRejectCategory(cat)}
                                                    className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4" /> מחק
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Reassign Section */}
                                        <div className="bg-white p-3 rounded border border-orange-200 flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                                                <ArrowRightLeft className="w-3 h-3 inline mr-1" />
                                                או מזג עם קיים:
                                            </span>
                                            <select 
                                                className="flex-1 border border-slate-300 rounded text-sm p-1.5"
                                                value={reassignTarget === cat ? reassignDestination : ''}
                                                onChange={(e) => {
                                                    setReassignTarget(cat);
                                                    setReassignDestination(e.target.value);
                                                }}
                                            >
                                                <option value="">בחר תחום קיים...</option>
                                                {availableCategories.map(existing => (
                                                    <option key={existing} value={existing}>{existing}</option>
                                                ))}
                                            </select>
                                            <button 
                                                onClick={handleExecuteReassign}
                                                disabled={reassignTarget !== cat || !reassignDestination}
                                                className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50"
                                            >
                                                בצע מיזוג
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pending Interests Section */}
                        {pendingInterests.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b pb-1">תחומי עניין</h4>
                                {pendingInterests.map(interest => (
                                    <div key={interest} className="bg-pink-50 border border-pink-100 rounded-lg p-4 mb-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg">{interest}</h4>
                                                <span className="text-xs text-slate-500">
                                                    בשימוש ע"י {getInterestCount(interest)} משתמשים
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => onApproveInterest && onApproveInterest(interest)}
                                                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> אשר
                                                </button>
                                                <button 
                                                    onClick={() => onRejectInterest && onRejectInterest(interest)}
                                                    className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4" /> מחק
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Add New Section (For Categories/Interests tabs) */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex gap-3 items-center">
                            <div className="relative flex-1">
                                <input 
                                    type="text"
                                    value={newInput}
                                    onChange={(e) => setNewInput(e.target.value)}
                                    placeholder={activeTab === 'categories' ? 'הוסף מקצוע חדש לרשימה המאושרת...' : 'הוסף תחום עניין חדש למערכת...'}
                                    className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                                />
                            </div>
                            <button 
                                onClick={handleAdd}
                                disabled={!newInput.trim()}
                                className={`px-4 py-2.5 rounded-lg text-white font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${
                                    activeTab === 'categories' ? 'bg-brand-600 hover:bg-brand-700' : 'bg-pink-500 hover:bg-pink-600'
                                } disabled:opacity-50`}
                            >
                                <Plus className="w-4 h-4" />
                                הוסף למערכת
                            </button>
                        </div>

                        {/* List Header */}
                        <div className="flex justify-between text-xs font-bold text-slate-400 px-4 mb-2">
                            <span>שם {activeTab === 'categories' ? 'המקצוע' : 'תחום העניין'}</span>
                            <span>ניהול</span>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                            {activeList.map((item) => {
                                const count = activeTab === 'categories' ? getCategoryCount(item) : getInterestCount(item);
                                const isEditingThis = editingItem === item;
                                const parent = activeTab === 'categories' ? categoryHierarchy[item] : null;

                                return (
                                    <div key={item} className={`flex flex-col p-3 rounded-lg border transition-all bg-white group ${isEditingThis ? 'border-brand-500 shadow-md' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}>
                                        
                                        {/* Row Content */}
                                        <div className="flex justify-between items-center w-full">
                                            {isEditingThis ? (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <div className="flex gap-2 items-center">
                                                        <input 
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm font-bold bg-white focus:border-brand-500 outline-none"
                                                            autoFocus
                                                        />
                                                        {activeTab === 'categories' && (
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
                                                    
                                                    {/* Merge Dropdown */}
                                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                                                        <GitMerge className="w-4 h-4 text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">או מזג לתוך:</span>
                                                        <select 
                                                            className="flex-1 text-xs border-transparent rounded focus:ring-0 text-slate-700 bg-transparent py-0.5 cursor-pointer hover:bg-slate-100"
                                                            onChange={(e) => {
                                                                if(e.target.value) setEditName(e.target.value);
                                                            }}
                                                            value=""
                                                        >
                                                            <option value="">בחר תחום קיים...</option>
                                                            {activeList.filter(x => x !== item).map(x => (
                                                                <option key={x} value={x}>{x}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`w-2 h-8 rounded-full ${activeTab === 'categories' ? 'bg-brand-500' : 'bg-pink-500'} opacity-0 group-hover:opacity-100 transition-opacity shrink-0`}></div>
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
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold min-w-[3rem] text-center ${
                                                        count > 0 
                                                        ? (activeTab === 'categories' ? 'bg-brand-100 text-brand-700' : 'bg-pink-100 text-pink-700') 
                                                        : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {count} <span className="hidden sm:inline">משתמשים</span>
                                                    </span>
                                                )}
                                                
                                                {isEditingThis ? (
                                                    <div className="flex flex-col gap-1 ml-2">
                                                        <button 
                                                            onClick={handleSaveEdit} 
                                                            className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
                                                            title="שמור שינויים"
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
                                                            className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="ערוך / מזג"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item)}
                                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="מחק מהמערכת"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Merge Info Tip */}
                                        {isEditingThis && (
                                            <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded flex items-center gap-1 border border-slate-100">
                                                <Check className="w-3 h-3 text-green-500" />
                                                <span>שינוי השם יעדכן את כל המשתמשים. אם השם קיים, יבוצע מיזוג אוטומטי.</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
