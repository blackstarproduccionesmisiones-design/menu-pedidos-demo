export interface Product {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  price: number;
  originalPrice?: number; // For strikethrough & discount badges (e.g. US$ 12.00)
  imageUrl: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  badge?: string; // Optional custom badge like 'Popular', 'Nuevo'
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  order: number;
}

export interface StoreInfo {
  name: string;
  tagline: string;
  logoUrl: string;
  coverUrl: string;
  phone: string; // WhatsApp phone e.g. "5491123456789"
  whatsappUrl?: string;
  instagramUrl?: string;
  currencySymbol: string;
  currencyCode: string;
  isOpen: boolean;
  statusText: string;
  freeShippingThreshold: number;
  shippingFee: number;
  deliveryTimeEstimate: string;
  announcementText: string;
  announcementDiscount: string;
  showAnnouncement: boolean;
  address: string;
  hours: string;
  adminPin?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type OrderType = 'delivery' | 'takeaway' | 'dine_in';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other';

export interface CheckoutDetails {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress: string;
  tableNumber?: string;
  paymentMethod: PaymentMethod;
  cashAmountToPay?: string;
  notes: string;
}

export interface SavedOrder {
  id: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  customerName: string;
  orderType: OrderType;
  whatsappUrl: string;
}
