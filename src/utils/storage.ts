import { Category, Product, SavedOrder, StoreInfo } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_STORE_INFO } from '../data/defaultMenu';

const KEYS = {
  PRODUCTS: 'alto_galeto_products_v3',
  CATEGORIES: 'alto_galeto_categories_v3',
  STORE_INFO: 'alto_galeto_store_info_v3',
  ORDERS: 'alto_galeto_saved_orders_v3',
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
