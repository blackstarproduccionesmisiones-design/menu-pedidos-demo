import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-stone-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold border border-white/10">
        {type === 'success' ? (
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};
