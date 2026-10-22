import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in duration-200">
      <div className="flex items-center gap-2 bg-stone-900/95 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl text-xs font-semibold border border-amber-500/40">
        <WifiOff size={15} className="text-amber-400 shrink-0" />
        <span>Modo sin conexión — Menú guardado en tu dispositivo</span>
      </div>
    </div>
  );
};
