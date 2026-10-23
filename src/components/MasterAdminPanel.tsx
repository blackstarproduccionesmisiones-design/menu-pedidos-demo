import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ExternalLink, RefreshCw, Store, X, ShieldCheck } from 'lucide-react';
import { firestore } from '../firebase';

type Commerce = { id: string; name: string };

interface MasterAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const MasterAdminPanel: React.FC<MasterAdminPanelProps> = ({ isOpen, onClose, onLogout }) => {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCommerces = async () => {
    if (!firestore) {
      setError('Firebase no está configurado en este entorno.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const snapshot = await getDocs(collection(firestore, 'comercios'));
      const items = snapshot.docs
        .filter((item) => {
          const data = item.data();
          // Excluir perfiles de administrador que hayan quedado guardados por error en "comercios".
          return data.rol !== 'admin' && data.rol !== 'admin_maestro';
        })
        .map((item) => {
          const data = item.data();
          return { id: item.id, name: String(data.nombre || data.name || data.nombreComercial || item.id) };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
      setCommerces(items);
      if (items.length === 0) setNotice('Todavía no se encontraron comercios en la colección principal.');
    } catch (e) {
      console.error('No se pudieron cargar los comercios:', e);
      setError('No se pudieron consultar los comercios. Verificá las reglas de lectura de Firestore.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadCommerces();
  }, [isOpen]);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  return (
    <div className="fixed inset-0 z-[60] bg-stone-950/70 backdrop-blur-sm overflow-y-auto p-3 sm:p-6">
      <section className="mx-auto my-4 max-w-3xl overflow-hidden rounded-3xl bg-stone-50 shadow-2xl">
        <header className="flex items-center justify-between gap-3 bg-stone-950 px-5 py-5 text-white sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600"><ShieldCheck size={23} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">NEXO+</p>
              <h2 className="text-xl font-black sm:text-2xl">Panel maestro</h2>
              <p className="text-xs text-stone-300">Administración general de comercios</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-stone-300 hover:bg-white/10 hover:text-white" aria-label="Cerrar panel"><X size={20} /></button>
        </header>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <strong>Modo inicial de consulta.</strong> Este panel permite revisar los comercios y abrir sus menús. La creación de comercios y administradores se habilitará cuando estén listas las reglas seguras de Firestore y el proceso de alta de usuarios.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-stone-900">Comercios registrados</h3>
              <p className="text-xs text-stone-500">Listado de la colección principal de Firestore</p>
            </div>
            <button onClick={() => void loadCommerces()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-stone-700 disabled:opacity-50">
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Actualizar
            </button>
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          {notice && <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-600">{notice}</p>}

          <div className="space-y-3">
            {commerces.map((commerce) => (
              <article key={commerce.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><Store size={19} /></div>
                  <div className="min-w-0">
                    <h4 className="truncate font-extrabold text-stone-900">{commerce.name}</h4>
                    <p className="break-all text-xs text-stone-500">ID: {commerce.id}</p>
                  </div>
                </div>
                <a href={baseUrl + '?comercio=' + encodeURIComponent(commerce.id)} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700 hover:border-red-300 hover:text-red-700">
                  Abrir menú <ExternalLink size={14} />
                </a>
              </article>
            ))}
            {busy && <p className="py-5 text-center text-sm text-stone-500">Cargando comercios…</p>}
          </div>

          <div className="flex justify-end border-t border-stone-200 pt-4">
            <button onClick={onLogout} className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-red-700">Cerrar sesión</button>
          </div>
        </div>
      </section>
    </div>
  );
};
