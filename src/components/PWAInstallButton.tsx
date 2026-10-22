import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  storeName?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  storeName = 'ALTO GALETO',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed as standalone PWA or dismissed, hide
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only render if browser supports beforeinstallprompt OR is an iOS device
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      await install();
    }
  };

  return (
    <>
      {/* Sleek Mobile Install Banner */}
      <div className="bg-stone-900 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-xs border-b border-stone-800 shadow-sm animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone size={16} />
          </div>
          <div className="truncate">
            <span className="font-bold block truncate text-stone-100">
              Instalar App de {storeName}
            </span>
            <span className="text-[10px] text-stone-400 block truncate">
              Accede rápido desde tu pantalla de inicio sin descargas pesadas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Download size={13} />
            <span>Instalar</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-stone-400 hover:text-white p-1 rounded-md"
            aria-label="Cerrar aviso de instalación"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl relative border border-stone-200 text-stone-900">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Smartphone size={24} />
            </div>

            <h3 className="text-base font-extrabold text-center mb-1">
              Instalar en iPhone o iPad
            </h3>
            <p className="text-xs text-stone-500 text-center mb-5">
              Sigue estos 2 sencillos pasos desde Safari para tener el menú como una aplicación:
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 size={16} />
                </div>
                <div>
                  <span className="font-bold block text-stone-900">1. Toca el botón Compartir</span>
                  <span className="text-stone-500">
                    En la barra inferior de Safari, pulsa el ícono de compartir (cuadrado con flecha hacia arriba).
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare size={16} />
                </div>
                <div>
                  <span className="font-bold block text-stone-900">2. "Agregar a pantalla de inicio"</span>
                  <span className="text-stone-500">
                    Baja en las opciones del menú y selecciona <strong>Agregar a pantalla de inicio</strong>.
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition"
            >
              ¡Listo, entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
