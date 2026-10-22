import React, { useState } from 'react';
import { CartItem, CheckoutDetails, OrderType, PaymentMethod, StoreInfo } from '../types';
import { formatPrice, generateWhatsAppMessage, createWhatsAppLink } from '../utils/formatters';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Send,
  Copy,
  Check,
  ShoppingBag,
  ArrowRight,
  Motorbike,
  Store,
  UtensilsCrossed,
  CreditCard,
  Banknote,
  Sparkles,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  store: StoreInfo;
  defaultTable?: string | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderCompleted: (orderSummary: { items: any[]; total: number; customerName: string; orderType: OrderType; whatsappUrl: string }) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  store,
  defaultTable,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
}) => {
  const [details, setDetails] = useState<CheckoutDetails>({
    customerName: '',
    customerPhone: '',
    orderType: defaultTable ? 'dine_in' : 'delivery',
    deliveryAddress: '',
    tableNumber: defaultTable || '',
    paymentMethod: 'cash',
    cashAmountToPay: '',
    notes: '',
  });

  React.useEffect(() => {
    if (defaultTable) {
      setDetails((prev) => ({
        ...prev,
        orderType: 'dine_in',
        tableNumber: defaultTable,
      }));
    }
  }, [defaultTable]);

  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const isDelivery = details.orderType === 'delivery';
  const shippingFee = isDelivery ? store.shippingFee : 0;
  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    // Validate required fields
    if (!details.customerName.trim()) {
      setValidationError('Por favor ingresa tu nombre para el pedido.');
      return;
    }

    if (details.orderType === 'delivery' && !details.deliveryAddress.trim()) {
      setValidationError('Por favor indica tu dirección de entrega.');
      return;
    }

    if (details.orderType === 'dine_in' && !details.tableNumber?.trim()) {
      setValidationError('Por favor indica el número de tu mesa.');
      return;
    }

    setValidationError('');

    const text = generateWhatsAppMessage(
      items,
      details,
      store,
      subtotal,
      shippingFee,
      total
    );

    const waUrl = createWhatsAppLink(store.phone, text);

    onOrderCompleted({
      items: items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
      })),
      total,
      customerName: details.customerName,
      orderType: details.orderType,
      whatsappUrl: waUrl,
    });

    // Open WhatsApp link in new tab
    window.open(waUrl, '_blank');
  };

  const handleCopySummary = () => {
    const text = generateWhatsAppMessage(
      items,
      details,
      store,
      subtotal,
      shippingFee,
      total
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-stone-900 text-base">
                Tu Carrito de Pedido
              </h2>
              <span className="text-xs text-stone-500">
                {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg text-xs flex items-center gap-1 transition"
                title="Vaciar carrito"
              >
                <Trash2 size={15} />
                <span className="hidden sm:inline">Vaciar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200 transition"
              aria-label="Cerrar carrito"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-4">
              <ShoppingBag size={36} />
            </div>
            <h3 className="font-bold text-stone-800 text-lg mb-1">
              Tu carrito está vacío
            </h3>
            <p className="text-sm text-stone-500 max-w-xs mb-6">
              Selecciona los platos y bebidas que más te gusten de nuestro menú para armar tu pedido.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition text-sm"
            >
              Explorar el Menú
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Items List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                Platos seleccionados
              </span>
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-stone-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-stone-900 truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-xs font-semibold text-red-600">
                      {formatPrice(item.product.price, store.currencySymbol)}
                    </span>
                    {item.notes && (
                      <p className="text-[11px] text-stone-500 truncate italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-white border border-stone-300 rounded-xl p-0.5">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-lg text-xs"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-stone-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-lg text-xs"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                      title="Eliminar plato"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                Tipo de Pedido
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDetails({ ...details, orderType: 'delivery' })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                    details.orderType === 'delivery'
                      ? 'border-red-600 bg-red-50 text-red-700 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Motorbike size={18} className="mb-1" />
                  <span>Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetails({ ...details, orderType: 'takeaway' })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                    details.orderType === 'takeaway'
                      ? 'border-red-600 bg-red-50 text-red-700 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Store size={18} className="mb-1" />
                  <span>Para Llevar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetails({ ...details, orderType: 'dine_in' })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                    details.orderType === 'dine_in'
                      ? 'border-red-600 bg-red-50 text-red-700 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <UtensilsCrossed size={18} className="mb-1" />
                  <span>En Mesa</span>
                </button>
              </div>
            </div>

            {/* Customer Information Inputs */}
            <div className="space-y-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-800 block">
                Datos de Entrega y Contacto
              </span>

              <div>
                <label className="text-xs text-stone-600 font-medium block mb-1">
                  Tu Nombre Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={details.customerName}
                  onChange={(e) =>
                    setDetails({ ...details, customerName: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm bg-white px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 font-medium block mb-1">
                  Teléfono / WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  placeholder="Ej: +54 9 11 1234 5678"
                  value={details.customerPhone}
                  onChange={(e) =>
                    setDetails({ ...details, customerPhone: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm bg-white px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {details.orderType === 'delivery' && (
                <div>
                  <label className="text-xs text-stone-600 font-medium block mb-1">
                    Dirección de Entrega *
                  </label>
                  <input
                    type="text"
                    placeholder="Calle, número, piso/depto, referencias"
                    value={details.deliveryAddress}
                    onChange={(e) =>
                      setDetails({ ...details, deliveryAddress: e.target.value })
                    }
                    className="w-full text-xs sm:text-sm bg-white px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {details.orderType === 'dine_in' && (
                <div>
                  <label className="text-xs text-stone-600 font-medium block mb-1">
                    Número de Mesa *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Mesa 4"
                    value={details.tableNumber}
                    onChange={(e) =>
                      setDetails({ ...details, tableNumber: e.target.value })
                    }
                    className="w-full text-xs sm:text-sm bg-white px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="text-xs text-stone-600 font-medium block mb-1">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDetails({ ...details, paymentMethod: 'cash' })
                    }
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold ${
                      details.paymentMethod === 'cash'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <Banknote size={15} />
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDetails({ ...details, paymentMethod: 'transfer' })
                    }
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold ${
                      details.paymentMethod === 'transfer'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <CreditCard size={15} />
                    <span>Transferencia / QR</span>
                  </button>
                </div>
              </div>

              {details.paymentMethod === 'cash' && (
                <div>
                  <label className="text-xs text-stone-500 block mb-1">
                    ¿Con cuánto abonas? (para llevar el cambio)
                  </label>
                  <input
                    type="text"
                    placeholder={`Ej: Pagaré con ${store.currencySymbol} 50`}
                    value={details.cashAmountToPay}
                    onChange={(e) =>
                      setDetails({ ...details, cashAmountToPay: e.target.value })
                    }
                    className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {/* General Order Notes */}
              <div>
                <label className="text-xs text-stone-500 block mb-1">
                  Notas adicionales para el restaurante
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Tocar timbre que dice 'González', llamar al llegar..."
                  value={details.notes}
                  onChange={(e) =>
                    setDetails({ ...details, notes: e.target.value })
                  }
                  className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium animate-shake">
                ⚠️ {validationError}
              </div>
            )}
          </div>
        )}

        {/* Footer with Calculations & Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t border-stone-200 space-y-3 shrink-0 shadow-lg">
            {/* Price breakdown */}
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-stone-900">
                  {formatPrice(subtotal, store.currencySymbol)}
                </span>
              </div>

              {isDelivery && (
                <div className="flex justify-between items-center">
                  <span>Costo de envío:</span>
                  <span className="font-semibold text-stone-900">
                    {formatPrice(shippingFee, store.currencySymbol)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-stone-900 pt-1.5 border-t border-stone-200">
                <span>Total a pagar:</span>
                <span className="text-red-600 text-lg">
                  {formatPrice(total, store.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Main WhatsApp Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-md transition flex items-center justify-between text-sm group"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <span>Pedir por WhatsApp</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <span>{formatPrice(total, store.currencySymbol)}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Copy order button fallback */}
            <button
              onClick={handleCopySummary}
              className="w-full py-1.5 text-xs text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 font-medium"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-600">¡Texto del pedido copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copiar resumen de pedido</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
