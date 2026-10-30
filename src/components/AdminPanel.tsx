import React, { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { Category, Product, SavedOrder, StoreInfo } from '../types';
import { formatPrice } from '../utils/formatters';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Store,
  Layers,
  Utensils,
  History,
  RotateCcw,
  Check,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Phone,
  Image,
  Tag,
  AlertCircle,
  ExternalLink,
  QrCode,
  Share2,
  Printer,
  Download,
  Copy,
  Lock,
  FileDown,
  FileUp,
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  commerceId: string;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  store: StoreInfo;
  orders: SavedOrder[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateStore: (store: StoreInfo) => void;
  onResetDefaults: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  commerceId,
  onClose,
  products,
  categories,
  store,
  orders,
  onUpdateProducts,
  onUpdateCategories,
  onUpdateStore,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'store' | 'orders' | 'qr'>('products');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // QR and Sharing state
  const [qrTableMode, setQrTableMode] = useState<string>('general');
  const [customTableNumber, setCustomTableNumber] = useState<string>('1');
  const [copiedLink, setCopiedLink] = useState(false);

  // Product Editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // Category Editing state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Store form state
  const [storeForm, setStoreForm] = useState<StoreInfo>(store);
  const [storeSavedNotification, setStoreSavedNotification] = useState(false);

  if (!isOpen) return null;

  // Curated food images suggestions for quick selection
  const SAMPLE_IMAGES = [
    { label: 'Galeto al Spiedo', url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80' },
    { label: 'Pollo a las Brasas', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80' },
    { label: 'Milanesa con Fritas', url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80' },
    { label: 'Papas Fritas', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80' },
    { label: 'Papas Cheddar', url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80' },
    { label: 'Empanadas', url: 'https://images.unsplash.com/photo-1649704207936-cb7db2b535d5?auto=format&fit=crop&w=600&q=80' },
    { label: 'Gaseosa', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
    { label: 'Cerveza 1L', url: 'https://images.unsplash.com/photo-1608270546103-ac6874cc7dd1?auto=format&fit=crop&w=600&q=80' },
    { label: 'Flan Casero', url: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&w=600&q=80' },
  ];

  // Handlers for products
  const handleToggleProductAvailability = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p
    );
    onUpdateProducts(updated);
  };

  const handleInlinePriceChange = (productId: string, newPriceStr: string) => {
    const val = parseFloat(newPriceStr);
    if (!isNaN(val) && val >= 0) {
      const updated = products.map((p) =>
        p.id === productId ? { ...p, price: val } : p
      );
      onUpdateProducts(updated);
    }
  };

  const handleDeleteProduct = (productId: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar "${name}" del menú?`)) {
      const updated = products.filter((p) => p.id !== productId);
      onUpdateProducts(updated);
    }
  };

  const handleStartCreateProduct = () => {
    const firstCat = categories[0]?.id || 'cat_default';
    setEditingProduct({
      id: `prod_${Date.now()}`,
      name: '',
      categoryId: firstCat,
      description: '',
      price: 10.0,
      originalPrice: undefined,
      imageUrl: SAMPLE_IMAGES[0].url,
      isAvailable: true,
      isFeatured: false,
      badge: '',
    });
    setIsNewProduct(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name.trim()) return;

    if (isNewProduct) {
      onUpdateProducts([...products, editingProduct]);
    } else {
      onUpdateProducts(
        products.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      );
    }
    setEditingProduct(null);
  };

  // Handlers for categories
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      order: categories.length + 1,
    };
    onUpdateCategories([...categories, newCat]);
    setNewCategoryName('');
  };

  const handleStartEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveCategory = (catId: string) => {
    const name = editingCategoryName.trim();
    if (!name) return;
    const updated = categories.map((category) =>
      category.id === catId ? { ...category, name } : category
    );
    onUpdateCategories(updated);
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    const hasItems = products.some((p) => p.categoryId === catId);
    if (
      hasItems &&
      !window.confirm(
        `La categoría "${catName}" contiene artículos. Al borrarla, los artículos seguirán existiendo pero sin categoría asignada. ¿Continuar?`
      )
    ) {
      return;
    }
    onUpdateCategories(categories.filter((c) => c.id !== catId));
  };

  // Save store settings
  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStore(storeForm);
    setStoreSavedNotification(true);
    setTimeout(() => setStoreSavedNotification(false), 2500);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      store: storeForm,
      categories,
      products,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-${storeForm.name.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.products && json.categories && json.store) {
          if (window.confirm('¿Deseas restaurar este menú? Reemplazará los productos, categorías y configuración actuales.')) {
            onUpdateProducts(json.products);
            onUpdateCategories(json.categories);
            onUpdateStore(json.store);
            setStoreForm(json.store);
            alert('¡Menú restaurado exitosamente!');
          }
        } else {
          alert('El archivo no tiene el formato válido de copia de seguridad.');
        }
      } catch (err) {
        alert('Error al leer el archivo de copia de seguridad.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchCat = filterCategory === 'all' || p.categoryId === filterCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Admin Header */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center font-bold text-white shadow-md">
              <Utensils size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Panel de Administración
              </h2>
              <p className="text-xs text-stone-400">
                Gestiona productos, precios, categorías y datos del comercio en tiempo real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
            aria-label="Cerrar panel de administración"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-stone-100 border-b border-stone-200 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'products'
                ? 'border-red-600 text-red-600 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Utensils size={16} />
            <span>Artículos & Precios ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'categories'
                ? 'border-red-600 text-red-600 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers size={16} />
            <span>Categorías ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'store'
                ? 'border-red-600 text-red-600 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store size={16} />
            <span>Datos del Negocio & WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'orders'
                ? 'border-red-600 text-red-600 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <History size={16} />
            <span>Historial ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'qr'
                ? 'border-red-600 text-red-600 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode size={16} />
            <span>QR & Enlace para Clientes</span>
          </button>
        </div>

        {/* Tab 1: Products Management */}
        {activeTab === 'products' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Top Bar with actions & filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Filtrar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-stone-50 border border-stone-300 px-3 py-1.5 rounded-xl text-xs sm:text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-stone-50 border border-stone-300 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartCreateProduct}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Plus size={16} />
                <span>Agregar Artículo</span>
              </button>
            </div>

            {/* Quick helper tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-600" />
              <span>
                💡 Puedes cambiar el precio de cualquier artículo en tiempo real escribiendo directamente en la casilla de precio.
              </span>
            </div>

            {/* Products Table / Cards */}
            <div className="space-y-2.5">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <Utensils size={36} className="mx-auto mb-2 opacity-50" />
                  <p>No se encontraron artículos con los filtros actuales.</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const catName = categories.find((c) => c.id === p.categoryId)?.name || 'Sin categoría';
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200 gap-3 hover:border-stone-300 transition"
                    >
                      {/* Left: Thumbnail and info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-stone-200 border border-stone-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-stone-900 truncate">
                              {p.name}
                            </h4>
                            <span className="text-[10px] font-semibold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md">
                              {catName}
                            </span>
                            {p.badge && (
                              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                                {p.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Price editor, availability toggle & actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                        {/* Price Input with currency */}
                        <div className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-xl px-2 py-1 shadow-2xs">
                          <span className="text-xs font-bold text-stone-500">
                            {store.currencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            defaultValue={p.price}
                            onBlur={(e) =>
                              handleInlinePriceChange(p.id, e.target.value)
                            }
                            className="w-16 text-xs sm:text-sm font-extrabold text-red-600 focus:outline-none"
                            title="Precio actual"
                          />
                        </div>

                        {/* Availability toggle */}
                        <button
                          onClick={() => handleToggleProductAvailability(p.id)}
                          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition ${
                            p.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                          title="Alternar disponibilidad"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{p.isAvailable ? 'Disponible' : 'Agotado'}</span>
                        </button>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsNewProduct(false);
                            }}
                            className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition"
                            title="Editar detalles completos"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Eliminar del menú"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Categories Management */}
        {activeTab === 'categories' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <h3 className="font-bold text-sm text-stone-900">
                Agregar Nueva Categoría
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ej: Tragos, Pastas, Ensaladas..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="flex-1 bg-white border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition"
                >
                  <Plus size={16} />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Categorías activas ({categories.length})
              </h4>
              <div className="divide-y divide-stone-200 bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden">
                {categories.map((c, idx) => {
                  const count = products.filter((p) => p.categoryId === c.id).length;
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-stone-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          {editingCategoryId === c.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                autoFocus
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCategory(c.id);
                                  if (e.key === 'Escape') handleCancelEditCategory();
                                }}
                                className="min-w-0 flex-1 bg-white border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                aria-label="Nombre de la categoría"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCategory(c.id)}
                                disabled={!editingCategoryName.trim()}
                                className="text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 p-2 rounded-xl transition"
                                title="Guardar nombre"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditCategory}
                                className="text-stone-400 hover:bg-stone-100 p-2 rounded-xl transition"
                                title="Cancelar edición"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-bold text-sm text-stone-900">
                                {c.name}
                              </span>
                              <span className="text-xs text-stone-400 block">
                                {count} {count === 1 ? 'artículo' : 'artículos'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {editingCategoryId !== c.id && (
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(c)}
                          className="text-stone-500 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition"
                          title="Editar categoría"
                          aria-label={`Editar categoría ${c.name}`}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="text-stone-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition"
                        title="Eliminar categoría"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Store & WhatsApp Configuration */}
        {activeTab === 'store' && (
          <form
            onSubmit={handleSaveStore}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
          >
            {storeSavedNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Check size={18} />
                <span>¡Configuración del negocio guardada con éxito!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre del Restaurante / Comercio
                </label>
                <input
                  type="text"
                  value={storeForm.name}
                  onChange={(e) =>
                    setStoreForm({ ...storeForm, name: e.target.value })
                  }
                  required
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Eslogan / Subtítulo
                </label>
                <input
                  type="text"
                  value={storeForm.tagline}
                  onChange={(e) =>
                    setStoreForm({ ...storeForm, tagline: e.target.value })
                  }
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Número de WhatsApp para Pedidos (con código de país)
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={storeForm.phone}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, phone: e.target.value })
                    }
                    placeholder="Ej: 5491123456789 (sin + ni guiones)"
                    required
                    className="w-full bg-stone-50 border border-stone-300 pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  A este número se enviarán los mensajes automáticos de compra.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Símbolo de Moneda
                </label>
                <input
                  type="text"
                  value={storeForm.currencySymbol}
                  onChange={(e) =>
                    setStoreForm({ ...storeForm, currencySymbol: e.target.value })
                  }
                  placeholder="US$, $, S/., €, MXN..."
                  required
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Costo de Envío Regular ({storeForm.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={storeForm.shippingFee}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      shippingFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>


              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tiempo estimado de entrega
                </label>
                <input
                  type="text"
                  value={storeForm.deliveryTimeEstimate}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      deliveryTimeEstimate: e.target.value,
                    })
                  }
                  placeholder="Ej: 25 - 40 min"
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Estado del Local
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setStoreForm({ ...storeForm, isOpen: !storeForm.isOpen })
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs border transition ${
                      storeForm.isOpen
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        storeForm.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span>{storeForm.isOpen ? 'Abierto (recibiendo pedidos)' : 'Cerrado temporalmente'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Banner announcement row */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Barra Promocional Superior (Banner Rojo)
                </span>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeForm.showAnnouncement}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        showAnnouncement: e.target.checked,
                      })
                    }
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Mostrar banner</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Texto promocional (Ej: 50% discount en segundos platos!)"
                  value={storeForm.announcementText}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      announcementText: e.target.value,
                    })
                  }
                  className="bg-white border border-stone-300 px-3 py-2 rounded-xl text-xs sm:text-sm"
                />

                <input
                  type="text"
                  placeholder="Etiqueta destacada (Ej: 50% OFF)"
                  value={storeForm.announcementDiscount}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      announcementDiscount: e.target.value,
                    })
                  }
                  className="bg-white border border-stone-300 px-3 py-2 rounded-xl text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Social media contact links */}
            <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">Redes sociales y contacto</h4>
                <p className="mt-1 text-xs text-stone-500">Pegá los enlaces de contacto del comercio. Los íconos aparecerán debajo de los datos del negocio.</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">Enlace de WhatsApp</label>
                <input type="url" value={storeForm.whatsappUrl || ''} onChange={(e) => setStoreForm({ ...storeForm, whatsappUrl: e.target.value })} placeholder="https://wa.me/549376..." className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">Perfil de Instagram</label>
                <input type="url" value={storeForm.instagramUrl || ''} onChange={(e) => setStoreForm({ ...storeForm, instagramUrl: e.target.value })} placeholder="https://www.instagram.com/tucomercio/" className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm" />
              </div>
            </div>

            {/* Cover & Logo URLs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Foto de portada del comercio
                </label>
                <ImageUploader
                  commerceId={commerceId}
                  kind="cover"
                  currentUrl={storeForm.coverUrl}
                  onUploaded={(url) => setStoreForm({ ...storeForm, coverUrl: url })}
                />
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] text-stone-500">Ingresar una URL manualmente</summary>
                  <input
                    type="url"
                    value={storeForm.coverUrl}
                    onChange={(e) => setStoreForm({ ...storeForm, coverUrl: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm"
                  />
                </details>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Logo del comercio
                </label>
                <ImageUploader
                  commerceId={commerceId}
                  kind="logo"
                  currentUrl={storeForm.logoUrl}
                  onUploaded={(url) => setStoreForm({ ...storeForm, logoUrl: url })}
                />
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] text-stone-500">Ingresar una URL manualmente</summary>
                  <input
                    type="url"
                    value={storeForm.logoUrl}
                    onChange={(e) => setStoreForm({ ...storeForm, logoUrl: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm"
                  />
                </details>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Lock size={13} className="text-stone-500" />
                  <span>PIN de Seguridad para Panel Admin</span>
                </label>
                <input
                  type="text"
                  value={storeForm.adminPin || '1234'}
                  onChange={(e) =>
                    setStoreForm({ ...storeForm, adminPin: e.target.value })
                  }
                  placeholder="••••"
                  maxLength={6}
                  className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold"
                />
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  Protege el panel de cambios no autorizados. Elige un PIN numérico de 4 a 6 dígitos.
                </span>
              </div>
            </div>

            {/* Backup & Restore section */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Copia de Seguridad del Menú
                </h4>
                <p className="text-xs text-stone-500">
                  Descarga todos tus productos y precios en un archivo para guardarlo o transferirlo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <FileDown size={14} />
                  <span>Exportar Copia (JSON)</span>
                </button>
                <label className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-2xs cursor-pointer">
                  <FileUp size={14} />
                  <span>Restaurar Copia</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas restaurar el menú y los datos por defecto?')) {
                    onResetDefaults();
                    onClose();
                  }
                }}
                className="text-stone-400 hover:text-rose-600 text-xs flex items-center gap-1 font-semibold"
              >
                <RotateCcw size={14} />
                <span>Restablecer Datos Demo</span>
              </button>

              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md transition"
              >
                <Save size={16} />
                <span>Guardar Cambios del Comercio</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Orders History */}
        {activeTab === 'orders' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-800">
                Registro de Pedidos Generados
              </h3>
              <span className="text-xs text-stone-500">
                Se guardan localmente para referencia rápida
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <History size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay pedidos registrados todavía.</p>
                <p className="text-xs text-stone-400 mt-1">
                  Cuando un cliente arme su carrito y presione "Pedir por WhatsApp", aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs sm:text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-stone-900 block">
                          {ord.customerName}
                        </span>
                        <span className="text-stone-400 text-xs">{ord.date}</span>
                      </div>
                      <span className="font-extrabold text-red-600 text-base">
                        {formatPrice(ord.total, store.currencySymbol)}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {it.quantity}x {it.name}
                          </span>
                          <span className="font-semibold text-stone-800">
                            {formatPrice(it.price * it.quantity, store.currencySymbol)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {ord.whatsappUrl && (
                      <div className="flex justify-end">
                        <a
                          href={ord.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                        >
                          <span>Reabrir mensaje en WhatsApp</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: QR Code & Business Implementation */}
        {activeTab === 'qr' && (() => {
          const baseUrl = window.location.origin + window.location.pathname;
          const targetUrl =
            qrTableMode === 'table'
              ? `${baseUrl}?mesa=${encodeURIComponent(customTableNumber)}`
              : baseUrl;
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=12&data=${encodeURIComponent(
            targetUrl
          )}`;

          const handleCopyLink = () => {
            navigator.clipboard.writeText(targetUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
          };

          const handlePrintCard = () => {
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>Cartel Mesa - ${store.name}</title>
                <style>
                  body { font-family: system-ui, sans-serif; text-align: center; padding: 40px 20px; background: #fff; color: #1c1917; }
                  .card { max-width: 380px; margin: 0 auto; border: 3px solid #e11d48; border-radius: 28px; padding: 32px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                  .logo { width: 72px; height: 72px; border-radius: 16px; object-fit: cover; margin-bottom: 12px; }
                  h1 { font-size: 24px; margin: 0 0 4px 0; color: #1c1917; }
                  p.tagline { font-size: 13px; color: #78716c; margin: 0 0 16px 0; }
                  .badge { display: inline-block; background: #ffe4e6; color: #e11d48; font-weight: bold; font-size: 14px; padding: 6px 16px; border-radius: 999px; margin-bottom: 20px; }
                  .qr-box { background: #f5f5f4; border-radius: 20px; padding: 16px; display: inline-block; margin-bottom: 20px; }
                  .qr-img { width: 220px; height: 220px; display: block; border-radius: 12px; }
                  .steps { text-align: left; background: #fafaf9; border-radius: 16px; padding: 14px 18px; font-size: 13px; line-height: 1.6; color: #44403c; margin-bottom: 16px; }
                  .steps strong { color: #e11d48; }
                  .footer { font-size: 11px; color: #a8a29e; }
                  @media print {
                    body { padding: 0; }
                    .card { box-shadow: none; border-color: #000; }
                  }
                </style>
              </head>
              <body>
                <div class="card">
                  <img src="${store.logoUrl}" class="logo" alt="Logo" />
                  <h1>${store.name}</h1>
                  <p class="tagline">${store.tagline}</p>
                  ${
                    qrTableMode === 'table'
                      ? `<div class="badge">🍽️ MESA ${customTableNumber}</div>`
                      : '<div class="badge">📲 MENÚ DIGITAL INTERACTIVO</div>'
                  }
                  <div class="qr-box">
                    <img src="${qrImageUrl}" class="qr-img" alt="Código QR" />
                  </div>
                  <div class="steps">
                    <div><strong>1.</strong> Abre la cámara de tu celular.</div>
                    <div><strong>2.</strong> Escanea el código para ver el menú.</div>
                    <div><strong>3.</strong> ¡Arma tu pedido y pídelo por WhatsApp!</div>
                  </div>
                  <div class="footer">Pedidos directos a WhatsApp: +${store.phone}</div>
                </div>
                <script>
                  window.onload = function() { window.print(); }
                </script>
              </body>
              </html>
            `);
            printWindow.document.close();
          };

          return (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Header guide */}
              <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-5 rounded-3xl shadow-md space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                  Puesta en marcha en tu local
                </span>
                <h3 className="text-xl font-extrabold tracking-tight">
                  ¿Cómo implementar este menú en tu negocio hoy mismo?
                </h3>
                <p className="text-xs sm:text-sm text-red-50 leading-relaxed">
                  Tus clientes podrán escanear el código QR con la cámara de su teléfono, ver las fotos de tus platos con precios actualizados y enviar su pedido formateado directamente a tu WhatsApp.
                </p>
              </div>

              {/* 4 Steps to launch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                    <h4 className="font-bold text-sm text-stone-900">Configura tu WhatsApp</h4>
                  </div>
                  <p className="text-xs text-stone-500 pl-8">
                    En la pestaña "Datos del Negocio", ingresa tu número con código de país (ej: <code>54911...</code>) y el nombre de tu local.
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                    <h4 className="font-bold text-sm text-stone-900">Personaliza tus Artículos</h4>
                  </div>
                  <p className="text-xs text-stone-500 pl-8">
                    Carga tus platos, bebidas y precios. Si un plato se agota durante el servicio, apágalo en un clic con el botón "Agotado".
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                    <h4 className="font-bold text-sm text-stone-900">Imprime el QR para Mesas</h4>
                  </div>
                  <p className="text-xs text-stone-500 pl-8">
                    Usa el generador inferior para imprimir carteles para cada mesa o un QR general para tu mostrador o vitrina.
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                    <h4 className="font-bold text-sm text-stone-900">Publica en Redes Sociales</h4>
                  </div>
                  <p className="text-xs text-stone-500 pl-8">
                    Pega el enlace en tu perfil de Instagram, catálogo de WhatsApp Business y Google Maps para recibir pedidos a domicilio.
                  </p>
                </div>
              </div>

              {/* QR Generator Box */}
              <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-base text-stone-900">
                      Generador de Código QR & Enlace
                    </h4>
                    <p className="text-xs text-stone-500">
                      Elige si deseas un QR general o uno que asigne automáticamente el número de mesa
                    </p>
                  </div>

                  {/* Mode switcher */}
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setQrTableMode('general')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        qrTableMode === 'general'
                          ? 'bg-white text-red-600 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Menú General
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTableMode('table')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        qrTableMode === 'table'
                          ? 'bg-white text-red-600 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Por Mesa Específica
                    </button>
                  </div>
                </div>

                {qrTableMode === 'table' && (
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 flex items-center gap-3">
                    <label className="text-xs font-bold text-stone-700 whitespace-nowrap">
                      Número o Nombre de la Mesa:
                    </label>
                    <input
                      type="text"
                      value={customTableNumber}
                      onChange={(e) => setCustomTableNumber(e.target.value)}
                      placeholder="Ej: 1, 2, Terraza A, Barra 3..."
                      className="bg-white border border-stone-300 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-stone-800 w-40 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <span className="text-xs text-stone-400 hidden sm:inline">
                      (El cliente no tendrá que escribir su mesa manualmente)
                    </span>
                  </div>
                )}

                {/* Display QR Card & Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl shadow-inner shrink-0 text-center">
                    <img
                      src={qrImageUrl}
                      alt="Código QR del Menú"
                      className="w-48 h-48 rounded-xl object-contain bg-white p-2 border border-stone-100"
                    />
                    <span className="text-[11px] font-bold text-stone-600 block mt-2">
                      {qrTableMode === 'table'
                        ? `QR exclusivo para Mesa ${customTableNumber}`
                        : 'QR General del Menú'}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1">
                        Enlace web de tu menú digital:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={targetUrl}
                          className="bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-xs text-stone-700 font-mono flex-1 select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
                        >
                          {copiedLink ? (
                            <>
                              <Check size={14} className="text-emerald-400" />
                              <span>¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handlePrintCard}
                        className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition"
                      >
                        <Printer size={16} />
                        <span>Imprimir Cartelito para Mesa</span>
                      </button>

                      <a
                        href={qrImageUrl}
                        download={`qr-menu-${store.name.toLowerCase()}${qrTableMode === 'table' ? `-mesa-${customTableNumber}` : ''}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-stone-300 transition"
                      >
                        <Download size={16} />
                        <span>Descargar PNG</span>
                      </a>
                    </div>

                    <p className="text-[11px] text-stone-400 leading-tight">
                      💡 Consejo: Imprime este cartelito y colócalo en un portarretratos o plastificado en cada mesa. Tus comensales solo abren su cámara y ordenan de inmediato.
                    </p>
                  </div>
                </div>
              </div>

              {/* PWA Mobile Installation Info Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 text-xs">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 text-base shadow-xs">
                  📲
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-stone-900">
                    Menú PWA Instalable en Móviles (Android e iOS)
                  </h5>
                  <p className="text-stone-600 leading-relaxed">
                    Tu aplicación cuenta con tecnología <strong>PWA (Progressive Web App)</strong>. Cuando tus clientes abran el enlace o escaneen el QR desde su celular, verán el botón para <strong>"Instalar App"</strong>. Se añadirá directamente a su pantalla de inicio con el ícono y nombre de <strong>ALTO GALETO</strong>, abriéndose en pantalla completa como una app nativa sin ocupar almacenamiento pesado ni pasar por tiendas de aplicaciones.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Edit / Create Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-stone-200">
              <button
                onClick={() => setEditingProduct(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1"
              >
                <X size={20} />
              </button>

              <h3 className="text-lg font-extrabold text-stone-900 mb-4">
                {isNewProduct ? 'Nuevo Artículo en el Menú' : 'Editar Artículo'}
              </h3>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nombre del Plato o Bebida *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    placeholder="Ej: Hamburguesa Royal con Queso"
                    className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={editingProduct.categoryId}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          categoryId: e.target.value,
                        })
                      }
                      className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Etiqueta destacada
                    </label>
                    <input
                      type="text"
                      value={editingProduct.badge || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          badge: e.target.value,
                        })
                      }
                      placeholder="Ej: Más vendido, Nuevo"
                      className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Single Price */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Precio ({store.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0,
                        originalPrice: undefined,
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Descripción del Plato
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.description}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ingredientes, preparación, acompañamientos..."
                    className="w-full bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>

                {/* Image URL with quick presets */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Foto del producto
                  </label>
                  <ImageUploader
                    commerceId={commerceId}
                    kind="product"
                    currentUrl={editingProduct.imageUrl}
                    onUploaded={(url) => setEditingProduct({ ...editingProduct, imageUrl: url })}
                  />
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] text-stone-500">Ingresar una URL manualmente</summary>
                    <input
                      type="url"
                      required
                      value={editingProduct.imageUrl}
                      onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm"
                    />
                  </details>

                  {/* Preset quick image picks */}
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-stone-500 block mb-1">
                      O selecciona una foto rápida de muestra:
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {SAMPLE_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              imageUrl: img.url,
                            })
                          }
                          className="shrink-0 flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-medium border border-stone-200"
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>{img.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Availability and Featured toggles */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isAvailable}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          isAvailable: e.target.checked,
                        })
                      }
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span>Disponible para ordenar</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isFeatured || false}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          isFeatured: e.target.checked,
                        })
                      }
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span>Destacado / Popular</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm shadow-md transition"
                  >
                    Guardar Artículo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
