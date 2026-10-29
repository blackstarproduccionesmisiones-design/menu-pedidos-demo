import React, { useState } from 'react';
import { StoreInfo } from '../types';
import { STORE_SCHEDULE_DETAILS } from '../data/defaultMenu';
import { formatPrice } from '../utils/formatters';
import { Clock, MapPin, Phone, Info, X, ShieldCheck, Calendar, Instagram, MessageCircle } from 'lucide-react';

interface HeaderBannerProps {
  store: StoreInfo;
  onOpenAdmin: () => void;
  isAdminOpen: boolean;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  store,
  onOpenAdmin,
  isAdminOpen,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <header className="relative w-full bg-white border-b border-stone-200">
      {/* Cover Image Container */}
      <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-stone-900">
        <img
          src={store.coverUrl}
          alt={store.name}
          className="w-full h-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

        {/* Top Floating Controls on Cover */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                store.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span>{store.isOpen ? 'Abierto' : 'Cerrado temporalmente'}</span>
          </div>

          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition shadow-sm ${
              isAdminOpen
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white/90 text-stone-800 hover:bg-white'
            }`}
            title="Administrar menú y precios"
          >
            <ShieldCheck size={14} className={isAdminOpen ? 'text-white' : 'text-red-600'} />
            <span>{isAdminOpen ? 'Cerrar Admin' : 'Panel Admin'}</span>
          </button>
        </div>

        {/* Floating Quick Info Badge inside cover image */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <div className="bg-white/95 backdrop-blur-md rounded-lg px-2.5 py-1 shadow-md text-stone-800 flex items-center gap-1.5 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-emerald-700">Abierto</span>
            </div>
            <button
              onClick={() => setShowInfoModal(true)}
              className="text-stone-400 hover:text-stone-700"
              title="Información y horarios del local"
            >
              <Info size={13} />
            </button>
            <span className="border-l border-stone-200 pl-1.5 text-stone-500 text-[10px] hidden xs:inline">
              Envío: {formatPrice(store.shippingFee, store.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Restaurant Header Information Row with Overlapping Logo */}
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <div className="flex items-start gap-3 sm:gap-4 -mt-10 sm:-mt-12 relative z-10">
          {/* Logo Badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5 shrink-0 overflow-hidden">
            <img
              src={store.logoUrl}
              alt="Logo"
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Name & Subtitle: "ALTO GALETO" */}
          <div className="pt-2 sm:pt-3 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight truncate">
                {store.name}
              </h1>
            </div>

            {store.tagline?.trim() && (
              <p className="text-xs sm:text-sm font-semibold text-red-600 mt-0.5">
                {store.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-2 text-xs text-stone-600">
              <span className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <Clock size={12} />
                {store.deliveryTimeEstimate}
              </span>

              <span className="flex items-center gap-1 text-stone-600">
                <MapPin size={12} className="text-red-500" />
                <span className="truncate max-w-[220px]">{store.address}</span>
              </span>

              <button
                onClick={() => setShowInfoModal(true)}
                className="text-red-600 hover:text-red-700 font-semibold underline text-xs"
              >
                Ver Horarios
              </button>
            </div>
            {(store.whatsappUrl || store.instagramUrl) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {store.whatsappUrl && (
                  <a href={store.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
                {store.instagramUrl && (
                  <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Visitar Instagram" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition opacity-95 hover:opacity-100">
                    <Instagram size={16} /> Instagram
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info & Detailed Schedule Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-stone-200">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <Info size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">{store.name}</h3>
                <span className="text-xs text-stone-500">{store.address}</span>
              </div>
            </div>

            <div className="space-y-3.5 text-sm text-stone-600">
              <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-stone-900 text-xs">Dirección</span>
                  <span className="text-xs sm:text-sm text-stone-700 font-medium">{store.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <Phone size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-stone-900 text-xs">WhatsApp de Pedidos</span>
                  <span className="text-xs sm:text-sm text-stone-800 font-mono font-bold">+{store.phone}</span>
                </div>
              </div>

              {/* Weekly Structured Schedule */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  <Calendar size={14} className="text-red-600" />
                  <span>Horarios de Atención Semanales</span>
                </div>

                <div className="space-y-1.5 text-xs divide-y divide-stone-200/80">
                  {STORE_SCHEDULE_DETAILS.map((s, idx) => (
                    <div key={idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2">
                      <span className="font-bold text-stone-900 w-20">{s.day}</span>
                      <div className="text-right text-stone-600 font-medium">
                        <div>{s.lunch}</div>
                        <div>{s.dinner}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs space-y-1">
                <p className="flex justify-between">
                  <span className="text-stone-500">Costo de envío:</span>
                  <span className="font-bold text-stone-800">{formatPrice(store.shippingFee, store.currencySymbol)}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-stone-500">Tiempo estimado:</span>
                  <span className="font-bold text-stone-800">{store.deliveryTimeEstimate}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-5 w-full py-2.5 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
