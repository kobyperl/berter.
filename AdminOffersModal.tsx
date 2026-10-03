

import React, { useState } from 'react';
import { X, Trash2, Calendar, ShieldAlert, CheckCircle, Clock, Edit } from 'lucide-react';
import { BarterOffer, UserProfile } from '../types';

interface AdminOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  offers: BarterOffer[];
  onDeleteOffer: (offerId: string) => void;
  onBulkDelete: (dateThreshold: string) => void;
  onApproveOffer: (offerId: string) => void;
  onEditOffer: (offer: BarterOffer) => void;
  onViewProfile?: (profile: UserProfile) => void;
}

export const AdminOffersModal: React.FC<AdminOffersModalProps> = ({
  isOpen,
  onClose,
  offers,
  onDeleteOffer,
  onBulkDelete,
  onApproveOffer,
  onEditOffer,
  onViewProfile
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [dateThreshold, setDateThreshold] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const pendingOffers = offers.filter(o => o.status === 'pending');
  const allOffers = offers;

  // Calculate how many offers would be deleted
  const offersToDeleteCount = dateThreshold 
    ? offers.filter(o => new Date(o.createdAt) < new Date(dateThreshold)).length
    : 0;

  const handleBulkDelete = () => {
    if (confirmDelete) {
        onBulkDelete(dateThreshold);
        setConfirmDelete(false);
        setDateThreshold('');
    } else {
        setConfirmDelete(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:max-w-4xl w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-red-50">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-bold text-slate-800">
                        ניהול תוכן (מנהל מערכת)
                    </h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        activeTab === 'pending' 
                        ? 'border-b-2 border-red-600 text-red-600 bg-red-50' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    ממתינות לאישור ({pendingOffers.length})
                </button>
                <button 
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${
                        activeTab === 'all' 
                        ? 'border-b-2 border-red-600 text-red-600 bg-red-50' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    כל המודעות ({allOffers.length})
                </button>
            </div>
            
            <div className="p-6">
                {activeTab === 'pending' ? (
                    <div className="space-y-4">
                        {pendingOffers.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                                <p>אין מודעות הממתינות לאישור.</p>
                            </div>
                        ) : (
                            pendingOffers.map(offer => (
                                <div key={offer.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 text-lg">{offer.title}</h4>
                                        <div 
                                            className="flex items-center gap-2 mt-1 cursor-pointer hover:bg-orange-100/50 p-1 rounded-lg transition-colors w-fit"
                                            onClick={() => onViewProfile && onViewProfile(offer.profile)}
                                            title="צפה בפרופיל המשתמש"
                                        >
                                            <img src={offer.profile.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                                            <p className="text-xs text-slate-700 font-bold hover:text-brand-700 underline decoration-dotted">מאת: {offer.profile.name}</p>
                                            <span className="text-xs text-slate-500">• {new Date(offer.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="mt-2 text-sm text-slate-700 bg-white/50 p-2 rounded">
                                            <span className="font-bold text-xs block text-slate-500">תיאור:</span>
                                            {offer.description}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                                        <button 
                                            onClick={() => onApproveOffer(offer.id)}
                                            className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            אשר
                                        </button>
                                        <button 
                                            onClick={() => onEditOffer(offer)}
                                            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            ערוך
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(window.confirm('לדחות ולמחוק את המודעה?')) onDeleteOffer(offer.id);
                                            }}
                                            className="flex-1 sm:flex-none bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            דחה
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <>
                        {/* Bulk Actions Panel */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-brand-600" />
                                מחיקה מרוכזת לפי תאריך
                            </h4>
                            <div className="flex flex-col sm:flex-row items-end gap-4">
                                <div className="w-full sm:w-auto flex-1">
                                    <label className="block text-sm text-slate-600 mb-1">מחק את כל המודעות שפורסמו לפני:</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition-all"
                                        value={dateThreshold}
                                        onChange={(e) => {
                                            setDateThreshold(e.target.value);
                                            setConfirmDelete(false);
                                        }}
                                    />
                                </div>
                                <button 
                                    onClick={handleBulkDelete}
                                    disabled={!dateThreshold || offersToDeleteCount === 0}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2 ${
                                        confirmDelete 
                                            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                                            : 'bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {confirmDelete ? 'לחץ שוב לאישור סופי' : `מחק ${offersToDeleteCount} מודעות`}
                                </button>
                            </div>
                            {dateThreshold && (
                                <p className="text-xs text-slate-500 mt-2">
                                    * פעולה זו תמחק לצמיתות {offersToDeleteCount} מודעות ישנות יותר מהתאריך הנבחר. לא ניתן לשחזר.
                                </p>
                            )}
                        </div>

                        {/* Individual Offers List */}
                        <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[400px] custom-scrollbar">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">סטטוס</th>
                                        <th className="px-4 py-3">כותרת</th>
                                        <th className="px-4 py-3">מפרסם</th>
                                        <th className="px-4 py-3">תאריך</th>
                                        <th className="px-4 py-3">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {offers.map(offer => (
                                        <tr key={offer.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                {offer.status === 'pending' ? (
                                                    <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full text-xs font-bold">ממתין</span>
                                                ) : (
                                                    <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs font-bold">פעיל</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                                                {offer.title}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {offer.profile.name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {new Date(offer.createdAt).toLocaleDateString('he-IL')}
                                            </td>
                                            <td className="px-4 py-3 flex gap-2">
                                                <button 
                                                    onClick={() => onEditOffer(offer)}
                                                    className="text-blue-500 hover:bg-blue-50 p-2 rounded transition-colors"
                                                    title="ערוך מודעה"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm('למחוק מודעה זו?')) onDeleteOffer(offer.id);
                                                    }}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                                    title="מחק מודעה"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};