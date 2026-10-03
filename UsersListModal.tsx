
import React, { useState } from 'react';
import { X, Search, Shield, User, Trash2, Mail, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface UsersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUser: UserProfile | null;
  onDeleteUser?: (userId: string) => void;
  onApproveUpdate?: (userId: string) => void;
  onRejectUpdate?: (userId: string) => void;
  onViewProfile?: (profile: UserProfile) => void;
}

export const UsersListModal: React.FC<UsersListModalProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  currentUser,
  onDeleteUser,
  onApproveUpdate,
  onRejectUpdate,
  onViewProfile
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;
  if (currentUser?.role !== 'admin') return null;

  // SAFE filtering to prevent crashes
  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.mainField || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingUpdatesCount = users.filter(u => u.pendingUpdate).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-5xl w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-brand-600" />
                    <h3 className="text-lg font-bold text-slate-800">
                        ניהול משתמשים
                    </h3>
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                        {users.length} רשומים
                    </span>
                    {pendingUpdatesCount > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                            {pendingUpdatesCount} עדכונים ממתינים
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-6">
                {/* Search Bar - Updated Input Style */}
                <div className="mb-6 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text"
                        className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm"
                        placeholder="חיפוש לפי שם, מייל או תחום עיסוק..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[500px] custom-scrollbar">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3">משתמש</th>
                                <th className="px-4 py-3">אימייל</th>
                                <th className="px-4 py-3">תחום</th>
                                <th className="px-4 py-3">סטטוס</th>
                                <th className="px-4 py-3">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${user.pendingUpdate ? 'bg-yellow-50/50' : ''}`}>
                                    <td 
                                        className="px-4 py-3 flex items-center gap-3 cursor-pointer group"
                                        onClick={() => onViewProfile && onViewProfile(user)}
                                    >
                                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 object-cover group-hover:border-brand-500" />
                                        <div>
                                            <span className="font-semibold text-slate-900 block group-hover:text-brand-600 transition-colors">{user.name}</span>
                                            <span className="text-xs text-slate-500">{user.role === 'admin' ? 'מנהל' : 'משתמש'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                                        {user.email || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{user.mainField}</td>
                                    <td className="px-4 py-3">
                                        {user.pendingUpdate ? (
                                            <button 
                                                onClick={() => onViewProfile && onViewProfile(user)}
                                                className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold hover:bg-yellow-200 transition-colors"
                                                title="לחץ לצפייה ואישור השינויים"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                ממתין לאישור
                                            </button>
                                        ) : (
                                            <span className="text-green-600 text-xs">פעיל</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <a 
                                                href={`mailto:${user.email}`}
                                                className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded block"
                                                onClick={(e) => e.stopPropagation()} // Prevent row click
                                                title="שלח אימייל"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </a>
                                            {onDeleteUser && user.id !== currentUser?.id && (
                                                <button 
                                                    onClick={() => onDeleteUser(user.id)}
                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {filteredUsers.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            לא נמצאו משתמשים התואמים את החיפוש.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
