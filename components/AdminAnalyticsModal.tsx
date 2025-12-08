
import React, { useState } from 'react';
import { X, PieChart, Briefcase, Heart, Plus, Users, BarChart3, Trash2, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';

interface AdminAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  availableCategories: string[];
  availableInterests: string[];
  onAddCategory: (category: string) => void;
  onAddInterest: (interest: string) => void;
  onDeleteCategory: (category: string) => void;
  onDeleteInterest: (interest: string) => void;
}

export const AdminAnalyticsModal: React.FC<AdminAnalyticsModalProps> = ({
  isOpen,
  onClose,
  users,
  availableCategories,
  availableInterests,
  onAddCategory,
  onAddInterest,
  onDeleteCategory,
  onDeleteInterest
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'interests'>('categories');
  const [newInput, setNewInput] = useState('');

  if (!isOpen) return null;

  // Calculate Counts
  const getCategoryCount = (category: string) => {
    return users.filter(u => u.mainField === category).length;
  };

  const getInterestCount = (interest: string) => {
    return users.filter(u => u.interests?.includes(interest)).length;
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-4xl w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-brand-600" />
                    <h3 className="text-lg font-bold text-slate-800">
                        ניתוח נתונים וניהול תחומים
                    </h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        activeTab === 'categories' 
                        ? 'border-b-2 border-brand-600 text-brand-600 bg-brand-50' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Briefcase className="w-4 h-4" />
                    מקצועות ועיסוקים ({availableCategories.length})
                </button>
                <button 
                    onClick={() => setActiveTab('interests')}
                    className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        activeTab === 'interests' 
                        ? 'border-b-2 border-pink-500 text-pink-600 bg-pink-50' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Heart className="w-4 h-4" />
                    תחומי עניין ({availableInterests.length})
                </button>
            </div>

            <div className="p-6 h-[500px] flex flex-col">
                
                {/* Add New Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex gap-3 items-center">
                    <div className="relative flex-1">
                        <input 
                            type="text"
                            value={newInput}
                            onChange={(e) => setNewInput(e.target.value)}
                            placeholder={activeTab === 'categories' ? 'הוסף מקצוע חדש למערכת...' : 'הוסף תחום עניין חדש למערכת...'}
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
                    {(activeTab === 'categories' ? sortedCategories : sortedInterests).map((item) => {
                        const count = activeTab === 'categories' ? getCategoryCount(item) : getInterestCount(item);
                        const percent = Math.round((count / (users.length || 1)) * 100);
                        
                        return (
                            <div key={item} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all bg-white group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-2 h-8 rounded-full ${activeTab === 'categories' ? 'bg-brand-500' : 'bg-pink-500'} opacity-0 group-hover:opacity-100 transition-opacity shrink-0`}></div>
                                    <span className="font-medium text-slate-800 truncate">{item}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold min-w-[3rem] text-center ${
                                        count > 0 
                                        ? (activeTab === 'categories' ? 'bg-brand-100 text-brand-700' : 'bg-pink-100 text-pink-700') 
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {count} <span className="hidden sm:inline">משתמשים</span>
                                    </span>
                                    
                                    <button 
                                        onClick={() => handleDelete(item)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="מחק מהמערכת"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
