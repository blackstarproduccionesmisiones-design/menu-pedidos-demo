import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Store, X, ShieldCheck, Plus, Pencil, Save, Ban } from 'lucide-react';
import { firebaseAuth } from '../firebase';

type Commerce = { id: string; nombre: string; activo: boolean };

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
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [id, setId] = useState('');

  const request = async (method: 'GET' | 'POST' | 'PATCH', body?: Record<string, string>) => {
    if (!firebaseAuth?.currentUser) throw new Error('Tu sesión no está disponible. Volvé a ingresar.');
    const token = await firebaseAuth.currentUser.getIdToken();
    const response = await fetch('/api/master/commerces', {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'No se pudo completar la operación.');
    return result;
  };

  const loadCommerces = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await request('GET');
      setCommerces(result.commerces || []);
      if ((result.commerces || []).length === 0) setNotice('Todavía no se encontraron comercios registrados.');
    } catch (e: any) {
      console.error('No se pudieron cargar los comercios:', e);
      setError(e?.message || 'No se pudieron consultar los comercios.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadCommerces();
  }, [isOpen]);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  const startCreate = () => {
    setEditingId(null);
    setName('');
    setId('');
    setError('');
    setNotice('');
    setFormOpen(true);
  };

  const startEdit = (commerce: Commerce) => {
    setEditingId(commerce.id);
    setName(commerce.nombre);
    setId(commerce.id);
    setError('');
    setNotice('');
    setFormOpen(true);
  };

  const saveCommerce = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (editingId) {
        await request('PATCH', { id: editingId, nombre: name.trim() });
        setNotice('Comercio actualizado correctamente.');
      } else {
        await request('POST', { id: id.trim(), nombre: name.trim() });
        setNotice('Comercio creado correctamente.');
      }
      setFormOpen(false);
      await loadCommerces();
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el comercio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-stone-950/70 p-3 backdrop-blur-sm sm:p-6">
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
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <strong>Gestión de comercios.</strong> Desde aquí podés registrar comercios nuevos y editar sus nombres. La administración de usuarios se agregará en una etapa separada.
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{notice}</p>}

          {formOpen && (
            <form onSubmit={saveCommerce} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
              <h3 className="font-extrabold text-stone-900">{editingId ? 'Editar comercio' : 'Nuevo comercio'}</h3>
              <label className="block space-y-1 text-xs font-bold text-stone-600">
                Nombre del comercio
                <input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: ALTO GALETO" className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-normal text-stone-900 outline-none focus:border-red-500" />
              </label>
              {!editingId && (
                <label className="block space-y-1 text-xs font-bold text-stone-600">
                  Identificador del menú (sin espacios ni acentos)
                  <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={60} value={id} onChange={(e) => setId(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="Ej.: alto-galeto" className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-normal text-stone-900 outline-none focus:border-red-500" />
                  <span className="block font-normal text-stone-500">Este identificador formará parte del enlace: ?comercio={id || 'identificador'}</span>
                </label>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"><Save size={14} />{busy ? 'Guardando…' : 'Guardar'}</button>
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-200">Cancelar</button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-stone-900">Comercios registrados</h3>
              <p className="text-xs text-stone-500">Colección principal de Firestore</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700"><Plus size={14} /> Nuevo comercio</button>
              <button onClick={() => void loadCommerces()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-stone-700 disabled:opacity-50">
                <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Actualizar
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {commerces.map((commerce) => (
              <article key={commerce.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><Store size={19} /></div>
                  <div className="min-w-0">
                    <h4 className="truncate font-extrabold text-stone-900">{commerce.nombre}</h4>
                    <p className="break-all text-xs text-stone-500">ID: {commerce.id}</p>
                    <p className="text-xs font-semibold text-emerald-700">{commerce.activo ? 'Registrado' : 'Inactivo'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => startEdit(commerce)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700 hover:border-red-300 hover:text-red-700"><Pencil size={14} /> Editar</button>
                  <a href={baseUrl + '?comercio=' + encodeURIComponent(commerce.id)} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-700 hover:border-red-300 hover:text-red-700">
                    Abrir menú <ExternalLink size={14} />
                  </a>
                </div>
              </article>
            ))}
            {busy && <p className="py-5 text-center text-sm text-stone-500">Procesando…</p>}
            {!busy && commerces.length === 0 && !error && <p className="rounded-xl bg-stone-100 p-4 text-center text-sm text-stone-500">No hay comercios para mostrar.</p>}
          </div>

          <div className="flex justify-end border-t border-stone-200 pt-4">
            <button onClick={onLogout} className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-red-700">Cerrar sesión</button>
          </div>
        </div>
      </section>
    </div>
  );
};
