import { Category, Product, SavedOrder, StoreInfo } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_STORE_INFO } from '../data/defaultMenu';

// Las claves antiguas de ALTO GALETO se mantienen aisladas y no se comparten.
const LEGACY_KEYS = {
  PRODUCTS: 'alto_galeto_products_v3',
  CATEGORIES: 'alto_galeto_categories_v3',
  STORE_INFO: 'alto_galeto_store_info_v3',
  ORDERS: 'alto_galeto_saved_orders_v3',
};

function keyFor(kind: keyof typeof LEGACY_KEYS, commerceId: string) {
  if (commerceId === 'alto-galeto') return LEGACY_KEYS[kind];
  return `nexo_menu_${commerceId}_${kind.toLowerCase()}_v1`;
}

function defaultStoreFor(commerceId: string): StoreInfo {
  if (commerceId === 'alto-galeto') return DEFAULT_STORE_INFO;
  return {
    ...DEFAULT_STORE_INFO,
    name: commerceId === 'lodepichi' ? 'NEXO DEMO' : commerceId,
    tagline: commerceId === 'lodepichi' ? 'NEXO DEMO' : '',
    logoUrl: '',
    coverUrl: '',
    phone: '',
    address: '',
    hours: '',
    shippingFee: 0,
    adminPin: '',
  };
}

export function getStoredStoreInfo(commerceId = 'lodepichi'): StoreInfo {
  try {
    const data = localStorage.getItem(keyFor('STORE_INFO', commerceId));
    if (data) return { ...defaultStoreFor(commerceId), ...JSON.parse(data) };
  } catch (e) {
    console.error('Failed to load store info from storage', e);
  }
  return defaultStoreFor(commerceId);
}

export function saveStoredStoreInfo(info: StoreInfo, commerceId = 'lodepichi'): void {
  try {
    localStorage.setItem(keyFor('STORE_INFO', commerceId), JSON.stringify(info));
  } catch (e) {
    console.error('Failed to save store info', e);
  }
}

export function getStoredCategories(commerceId = 'lodepichi'): Category[] {
  try {
    const data = localStorage.getItem(keyFor('CATEGORIES', commerceId));
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load categories', e);
  }
  return commerceId === 'alto-galeto' ? DEFAULT_CATEGORIES : [];
}

export function saveStoredCategories(categories: Category[], commerceId = 'lodepichi'): void {
  try {
    localStorage.setItem(keyFor('CATEGORIES', commerceId), JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories', e);
  }
}

export function getStoredProducts(commerceId = 'lodepichi'): Product[] {
  try {
    const data = localStorage.getItem(keyFor('PRODUCTS', commerceId));
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load products', e);
  }
  return commerceId === 'alto-galeto' ? DEFAULT_PRODUCTS : [];
}

export function saveStoredProducts(products: Product[], commerceId = 'lodepichi'): void {
  try {
    localStorage.setItem(keyFor('PRODUCTS', commerceId), JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save products', e);
  }
}

export function getStoredOrders(commerceId = 'lodepichi'): SavedOrder[] {
  try {
    const data = localStorage.getItem(keyFor('ORDERS', commerceId));
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load orders', e);
  }
  return [];
}

export function saveNewOrder(order: SavedOrder, commerceId = 'lodepichi'): void {
  try {
    const current = getStoredOrders(commerceId);
    const updated = [order, ...current].slice(0, 50);
    localStorage.setItem(keyFor('ORDERS', commerceId), JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save order', e);
  }
}

export function resetAllToDefault(commerceId = 'lodepichi'): {
  products: Product[];
  categories: Category[];
  storeInfo: StoreInfo;
} {
  try {
    localStorage.removeItem(keyFor('PRODUCTS', commerceId));
    localStorage.removeItem(keyFor('CATEGORIES', commerceId));
    localStorage.removeItem(keyFor('STORE_INFO', commerceId));
    localStorage.removeItem(keyFor('ORDERS', commerceId));
  } catch (e) {
    console.error('Failed to clear storage', e);
  }
  return {
    products: commerceId === 'alto-galeto' ? DEFAULT_PRODUCTS : [],
    categories: commerceId === 'alto-galeto' ? DEFAULT_CATEGORIES : [],
    storeInfo: defaultStoreFor(commerceId),
  };
}
