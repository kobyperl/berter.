
import React from 'react';
import { Mail, Settings } from 'lucide-react';

interface AdminEmailButtonProps {
  onClick: () => void;
}

export const AdminEmailButton: React.FC<AdminEmailButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="hidden lg:flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm border border-slate-700 ml-2"
      title="מרכז שליטה לאימיילים"
    >
      <Mail className="w-4 h-4 text-emerald-400" />
      <span>אימיילים</span>
    </button>
  );
};
