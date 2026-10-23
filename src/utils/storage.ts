import { Category, Product, SavedOrder, StoreInfo } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_STORE_INFO } from '../data/defaultMenu';

// Cada comercio usa claves locales independientes para evitar mezclar menús.
function getCommerceId(): string {
  if (typeof window === 'undefined') return 'lodepichi';
  const requested = new URLSearchParams(window.location.search).get('comercio');
  if (!requested) return 'lodepichi';
  const safeId = requested.toLowerCase().trim();
  return /^[a-z0-9-]+$/.test(safeId) ? safeId : 'lodepichi';
}

const COMERCIO_ID = getCommerceId();
const PREFIX = `nexo_menu_${COMERCIO_ID}`;
const KEYS = {
  PRODUCTS: `${PREFIX}_products_v1`,
  CATEGORIES: `${PREFIX}_categories_v1`,
  STORE_INFO: `${PREFIX}_store_info_v1`,
  ORDERS: `${PREFIX}_saved_orders_v1`,
};

export function getStoredStoreInfo(): StoreInfo {
  try {
    const data = localStorage.getItem(KEYS.STORE_INFO);
    if (data) {
      return { ...DEFAULT_STORE_INFO, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load store info from storage', e);
  }
  return DEFAULT_STORE_INFO;
}

export function saveStoredStoreInfo(info: StoreInfo): void {
  try {
    localStorage.setItem(KEYS.STORE_INFO, JSON.stringify(info));
  } catch (e) {
    console.error('Failed to save store info', e);
  }
}

export function getStoredCategories(): Category[] {
  try {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load categories', e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveStoredCategories(categories: Category[]): void {
  try {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories', e);
  }
}

export function getStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load products', e);
  }
  return DEFAULT_PRODUCTS;
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save products', e);
  }
}

export function getStoredOrders(): SavedOrder[] {
  try {
    const data = localStorage.getItem(KEYS.ORDERS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load orders', e);
  }
  return [];
}

export function saveNewOrder(order: SavedOrder): void {
  try {
    const current = getStoredOrders();
    const updated = [order, ...current].slice(0, 50); // Keep last 50 orders
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save order', e);
  }
}

export function resetAllToDefault(): {
  products: Product[];
  categories: Category[];
  storeInfo: StoreInfo;
} {
  try {
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.CATEGORIES);
    localStorage.removeItem(KEYS.STORE_INFO);
    localStorage.removeItem(KEYS.ORDERS);
  } catch (e) {
    console.error('Failed to clear storage', e);
  }
  return {
    products: DEFAULT_PRODUCTS,
    categories: DEFAULT_CATEGORIES,
    storeInfo: DEFAULT_STORE_INFO,
  };
}
