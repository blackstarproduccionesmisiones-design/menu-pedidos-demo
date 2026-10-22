/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Category, Product, StoreInfo, CartItem, SavedOrder, OrderType } from './types';
import {
  getStoredCategories,
  getStoredProducts,
  getStoredStoreInfo,
  getStoredOrders,
  saveStoredCategories,
  saveStoredProducts,
  saveStoredStoreInfo,
  saveNewOrder,
  resetAllToDefault,
} from './utils/storage';
import { HeaderBanner } from './components/HeaderBanner';
import { CategoryCarousel } from './components/CategoryCarousel';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { FloatingCartButton } from './components/FloatingCartButton';
import { AdminPanel } from './components/AdminPanel';
import { Toast } from './components/Toast';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Sparkles, Utensils, CheckCircle, Search, Lock, X, LogOut } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firestore, firebaseConfigured, firebaseConfigMissing } from './firebase';

export default function App() {
  // Application Data States
  const [store, setStore] = useState<StoreInfo>(getStoredStoreInfo);
  const [categories, setCategories] = useState<Category[]>(getStoredCategories);
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [orders, setOrders] = useState<SavedOrder[]>(getStoredOrders);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // UI Navigation & Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyDiscounts, setFilterOnlyDiscounts] = useState(false);
  const [filterOnlyFeatured, setFilterOnlyFeatured] = useState(false);

  // Modals & Panels
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [detectedTable, setDetectedTable] = useState<string | null>(null);

  // Read URL query parameters for table QR scans (e.g. ?mesa=4 or ?table=4)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mesaParam = params.get('mesa') || params.get('table');
      if (mesaParam) {
        setDetectedTable(mesaParam);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleOpenAdmin = () => {
    if (isAdminOpen) {
      setIsAdminOpen(false);
      return;
    }
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setIsPinModalOpen(true);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!firebaseConfigured || !firebaseAuth || !firestore) {
      setLoginError('Falta configurar Firebase en el archivo .env.local.');
      return;
    }
    setLoginBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, loginEmail.trim(), loginPassword);
      const userDoc = await getDoc(doc(firestore, 'usuarios', credential.user.uid));
      if (!userDoc.exists()) {
        await signOut(firebaseAuth);
        setLoginError('La cuenta no tiene un perfil autorizado en NEXO+.');
        return;
      }
      const profile = userDoc.data();
      if (profile.rol !== 'admin' || profile.activo !== true) {
        await signOut(firebaseAuth);
        setLoginError('Esta cuenta no tiene permisos de administrador NEXO+.');
        return;
      }
      setAdminEmail(credential.user.email ?? loginEmail.trim());
      setIsPinModalOpen(false);
      setIsAdminOpen(true);
      setLoginPassword('');
      showToast('Acceso autorizado al panel de NEXO+');
    } catch (error: any) {
      console.error('Error de inicio de sesión', error);
      const code = error?.code as string | undefined;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setLoginError('Correo o contraseña incorrectos.');
      } else if (code === 'permission-denied') {
        setLoginError('Firestore todavía no permite consultar tu perfil. Hay que configurar las reglas seguras antes de probar el acceso.');
      } else {
        setLoginError('No se pudo iniciar sesión. Revisá la conexión y la configuración de Firebase.');
      }
    } finally {
      setLoginBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!firebaseAuth || !loginEmail.trim()) {
      setLoginError('Escribí tu correo para enviarte el enlace de recuperación.');
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, loginEmail.trim());
      setLoginError('Si la cuenta existe, Firebase enviará un enlace de recuperación a ese correo.');
    } catch (error) {
      console.error('Error al solicitar recuperación', error);
      setLoginError('No se pudo enviar el enlace. Revisá el correo y la configuración de Firebase.');
    }
  };

  const handleAdminLogout = async () => {
    if (firebaseAuth) await signOut(firebaseAuth);
    setAdminEmail(null);
    setIsAdminOpen(false);
    showToast('Sesión cerrada');
  };

  // Sync state changes to storage
  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
    showToast('Menú actualizado correctamente');
  };

  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    saveStoredCategories(newCategories);
    showToast('Categorías actualizadas');
  };

  const handleUpdateStore = (newStore: StoreInfo) => {
    setStore(newStore);
    saveStoredStoreInfo(newStore);
    showToast('Configuración del comercio guardada');
  };

  const handleResetDefaults = () => {
    const defaults = resetAllToDefault();
    setProducts(defaults.products);
    setCategories(defaults.categories);
    setStore(defaults.storeInfo);
    setCart([]);
    setOrders([]);
    showToast('Datos demo restaurados con éxito');
  };


  // Cart Operations
  const handleAddToCart = (product: Product, quantity = 1, notes = '') => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && (item.notes || '') === notes
      );
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += quantity;
        return copy;
      }
      return [...prev, { product, quantity, notes }];
    });
    showToast(`+${quantity} ${product.name} agregado`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderCompleted = (orderData: {
    items: any[];
    total: number;
    customerName: string;
    orderType: OrderType;
    whatsappUrl: string;
  }) => {
    const newOrd: SavedOrder = {
      id: `ord_${Date.now()}`,
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      items: orderData.items,
      total: orderData.total,
      customerName: orderData.customerName,
      orderType: orderData.orderType,
      whatsappUrl: orderData.whatsappUrl,
    };
    saveNewOrder(newOrd);
    setOrders((prev) => [newOrd, ...prev]);
    showToast('¡Pedido enviado por WhatsApp!');
  };

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      // Discount filter
      if (filterOnlyDiscounts && (!p.originalPrice || p.originalPrice <= p.price)) {
        return false;
      }

      // Featured filter
      if (filterOnlyFeatured && !p.isFeatured) {
        return false;
      }

      return true;
    });
  }, [products, selectedCategoryId, searchQuery, filterOnlyDiscounts, filterOnlyFeatured]);

  // Group products by Category for neat categorical presentation (matching screenshot)
  const groupedCategories = useMemo(() => {
    if (selectedCategoryId !== 'all') {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      if (!cat) return [];
      return [
        {
          category: cat,
          items: filteredProducts,
        },
      ];
    }

    // When 'all', group each category in order
    return categories
      .map((cat) => ({
        category: cat,
        items: filteredProducts.filter((p) => p.categoryId === cat.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, filteredProducts, selectedCategoryId]);

  // Total items and amount in cart
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col antialiased">
      {/* Toast Feedback */}
      <Toast message={toastMessage} />

      {/* Main Container */}
      <div className="w-full max-w-2xl mx-auto bg-stone-50 min-h-screen shadow-xl flex flex-col pb-24 relative">
        {/* PWA In-App Install Prompt Banner */}
        <PWAInstallButton storeName={store.name} />

        {/* Offline Status Toast */}
        <OfflineIndicator />

        {/* Header Banner */}
        <HeaderBanner
          store={store}
          onOpenAdmin={handleOpenAdmin}
          isAdminOpen={isAdminOpen}
        />

        {/* Table QR banner if comensal entered through specific table QR */}
        {detectedTable && (
          <div className="bg-emerald-600 text-white px-4 py-1.5 flex items-center justify-between text-xs font-bold shadow-inner">
            <div className="flex items-center gap-1.5">
              <span>🍽️</span>
              <span>Ordenando para la Mesa {detectedTable}</span>
            </div>
            <button
              onClick={() => setDetectedTable(null)}
              className="text-white/80 hover:text-white underline text-[11px]"
            >
              Cambiar
            </button>
          </div>
        )}

        {/* Categories Carousel */}
        <CategoryCarousel
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(id) => {
            setSelectedCategoryId(id);
          }}
          onToggleSearch={() => setIsSearchActive(!isSearchActive)}
          isSearchActive={isSearchActive}
        />

        {/* Quick Search & Filters Bar */}
        {isSearchActive && (
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterOnlyDiscounts={filterOnlyDiscounts}
            onToggleDiscounts={() => setFilterOnlyDiscounts(!filterOnlyDiscounts)}
            filterOnlyFeatured={filterOnlyFeatured}
            onToggleFeatured={() => setFilterOnlyFeatured(!filterOnlyFeatured)}
            resultsCount={filteredProducts.length}
            onClose={() => {
              setIsSearchActive(false);
              setSearchQuery('');
              setFilterOnlyDiscounts(false);
              setFilterOnlyFeatured(false);
            }}
          />
        )}

        {/* Products List Area */}
        <main className="flex-1 px-3 sm:px-4 py-4 space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-stone-200 shadow-xs">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={28} />
              </div>
              <h3 className="font-extrabold text-stone-800 text-lg mb-1">
                No encontramos productos
              </h3>
              <p className="text-stone-500 text-xs sm:text-sm max-w-sm mx-auto mb-4">
                Prueba buscando con otra palabra o selecciona "Todos" en las categorías superiores.
              </p>
              <button
                onClick={() => {
                  setSelectedCategoryId('all');
                  setSearchQuery('');
                  setFilterOnlyDiscounts(false);
                  setFilterOnlyFeatured(false);
                  setIsSearchActive(false);
                }}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition"
              >
                Ver todo el menú
              </button>
            </div>
          ) : (
            groupedCategories.map((group) => (
              <section key={group.category.id} className="space-y-3">
                {/* Category Heading matching screenshot (Red title like 'Platos especiales', 'Bebidas') */}
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-base sm:text-lg font-black text-red-600 tracking-tight">
                    {group.category.name}
                  </h2>
                  <span className="text-[11px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                    {group.items.length}
                  </span>
                </div>

                {/* Product Cards Grid */}
                <div className="space-y-2.5">
                  {group.items.map((prod) => {
                    const cartItem = cart.find(
                      (item) => item.product.id === prod.id
                    );
                    const quantityInCart = cartItem ? cartItem.quantity : 0;

                    return (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        currencySymbol={store.currencySymbol}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                        onSelectProduct={(p) => setSelectedProduct(p)}
                        cartQuantity={quantityInCart}
                      />
                    );
                  })}
                </div>
              </section>
            ))
          )}

          {/* Bottom Store Footer */}
          <footer className="pt-8 pb-4 text-center text-xs text-stone-400 space-y-1">
            <p className="font-semibold text-stone-600">
              {store.name} — Menú Digital Interactivo
            </p>
            <p>{store.address}</p>
            <p>Pedidos automáticos directos por WhatsApp</p>
          </footer>
        </main>

        {/* Floating Cart Trigger Bar */}
        <FloatingCartButton
          itemCount={cartItemCount}
          total={cartTotal}
          currencySymbol={store.currencySymbol}
          onClick={() => setIsCartOpen(true)}
        />

        {/* Product Customization / Details Modal */}
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            currencySymbol={store.currencySymbol}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* Cart & Checkout Drawer with WhatsApp integration */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cart}
          store={store}
          defaultTable={detectedTable}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onOrderCompleted={handleOrderCompleted}
        />

        {/* Session controls for the authenticated NEXO+ administrator */}
        {isAdminOpen && adminEmail && (
          <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-xl">
            <span className="max-w-[180px] truncate text-[11px] font-semibold text-stone-600">{adminEmail}</span>
            <button onClick={handleAdminLogout} className="flex items-center gap-1 rounded-xl bg-stone-900 px-3 py-2 text-xs font-bold text-white hover:bg-stone-700" aria-label="Cerrar sesión">
              <LogOut size={14} /> Salir
            </button>
          </div>
        )}

        {/* Administration Panel */}
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          products={products}
          categories={categories}
          store={store}
          orders={orders}
          onUpdateProducts={handleUpdateProducts}
          onUpdateCategories={handleUpdateCategories}
          onUpdateStore={handleUpdateStore}
          onResetDefaults={handleResetDefaults}
        />

        {/* Firebase administrator sign-in modal */}
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-stone-200 text-center">
              <button onClick={() => { setIsPinModalOpen(false); setLoginPassword(''); setLoginError(''); }} className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition" aria-label="Cerrar ventana"><X size={18} /></button>
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-inner"><Lock size={22} /></div>
              <h3 className="text-base font-extrabold text-stone-900 mb-1">Acceso administrador NEXO+</h3>
              <p className="text-xs text-stone-500 mb-4">Ingresá con el correo y la contraseña autorizados en Firebase.</p>
              {!firebaseConfigured && <div className="mb-3 rounded-xl bg-amber-50 p-3 text-left text-xs text-amber-800">Falta configurar Firebase. Variables pendientes: {firebaseConfigMissing.join(', ')}. Copiá .env.example como .env.local y completá los valores.</div>}
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <input type="email" autoComplete="username" required placeholder="Correo electrónico" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); if (loginError) setLoginError(''); }} className="w-full py-3 px-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
                <input type="password" autoComplete="current-password" required placeholder="Contraseña" value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); if (loginError) setLoginError(''); }} className="w-full py-3 px-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
                {loginError && <p role="alert" className="text-xs text-rose-600 font-semibold text-left">{loginError}</p>}
                <button type="submit" disabled={loginBusy || !firebaseConfigured} className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition">{loginBusy ? 'Verificando…' : 'Ingresar'}</button>
                <button type="button" onClick={handlePasswordReset} className="w-full py-2 text-xs font-semibold text-stone-600 hover:text-red-600">Olvidé mi contraseña</button>
                <button type="button" onClick={() => { setIsPinModalOpen(false); setLoginPassword(''); setLoginError(''); }} className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition">Cancelar</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
