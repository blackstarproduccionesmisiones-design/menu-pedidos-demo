
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

import { firestore } from '../firebase';
import type { Category, Product, SavedOrder, StoreInfo } from '../types';

function getCommerceCollection(name: string, commerceId: string) {
  if (!firestore) {
    throw new Error('Firebase no está configurado.');
  }

  return collection(firestore, 'comercios', commerceId, name);
}

function getCommerceDocument(name: string, commerceId: string) {
  if (!firestore) {
    throw new Error('Firebase no está configurado.');
  }

  return doc(firestore, 'comercios', commerceId, name, 'principal');
}


// Firestore no admite propiedades con valor undefined.
function removeUndefinedFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => item === undefined ? null : removeUndefinedFields(item)) as T;
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([key, fieldValue]) => [key, removeUndefinedFields(fieldValue)])
    ) as T;
  }
  return value;
}

// Guarda productos, categorías y configuración en una única operación atómica por comercio.
export async function saveCommerceCloud(
  products: Product[],
  categories: Category[],
  store: StoreInfo,
  commerceId = 'lodepichi'
) {
  if (!firestore) throw new Error('Firebase no está configurado.');
  const batch = writeBatch(firestore);
  batch.set(getCommerceDocument('productos', commerceId), { items: removeUndefinedFields(products) });
  batch.set(getCommerceDocument('categorias', commerceId), { items: removeUndefinedFields(categories) });
  batch.set(getCommerceDocument('configuracion', commerceId), removeUndefinedFields(store));
  await batch.commit();
}

// PRODUCTOS

export async function saveProductsCloud(products: Product[], commerceId = 'lodepichi') {
  await setDoc(getCommerceDocument('productos', commerceId), {
    items: products,
  });
}

export async function loadProductsCloud(commerceId = 'lodepichi'): Promise<Product[]> {
  const snapshot = await getDocs(getCommerceCollection('productos', commerceId));
  const principal = snapshot.docs.find((item) => item.id === 'principal');

  return principal ? (principal.data().items as Product[]) ?? [] : [];
}

export function subscribeProductsCloud(
  callback: (products: Product[]) => void,
  commerceId = 'lodepichi'
) {
  return onSnapshot(getCommerceDocument('productos', commerceId), (snapshot) => {
    callback((snapshot.data()?.items as Product[]) ?? []);
  });
}

// CATEGORÍAS

export async function saveCategoriesCloud(categories: Category[], commerceId = 'lodepichi') {
  await setDoc(getCommerceDocument('categorias', commerceId), {
    items: categories,
  });
}

export async function loadCategoriesCloud(commerceId = 'lodepichi'): Promise<Category[]> {
  const snapshot = await getDocs(getCommerceCollection('categorias', commerceId));
  const principal = snapshot.docs.find((item) => item.id === 'principal');

  return principal ? (principal.data().items as Category[]) ?? [] : [];
}

export function subscribeCategoriesCloud(
  callback: (categories: Category[]) => void,
  commerceId = 'lodepichi'
) {
  return onSnapshot(getCommerceDocument('categorias', commerceId), (snapshot) => {
    callback((snapshot.data()?.items as Category[]) ?? []);
  });
}

// CONFIGURACIÓN DEL COMERCIO

export async function saveStoreCloud(store: StoreInfo, commerceId = 'lodepichi') {
  await setDoc(getCommerceDocument('configuracion', commerceId), {
    ...store,
  });
}

export async function loadStoreCloud(commerceId = 'lodepichi'): Promise<StoreInfo | null> {
  const snapshot = await getDocs(getCommerceCollection('configuracion', commerceId));
  const principal = snapshot.docs.find((item) => item.id === 'principal');

  return principal ? (principal.data() as StoreInfo) : null;
}

export function subscribeStoreCloud(
  callback: (store: StoreInfo | null) => void,
  commerceId = 'lodepichi'
) {
  return onSnapshot(getCommerceDocument('configuracion', commerceId), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as StoreInfo) : null);
  });
}

// PEDIDOS

export async function saveOrderCloud(order: SavedOrder, commerceId = 'lodepichi') {
  await setDoc(
    doc(getCommerceCollection('pedidos', commerceId), order.id),
    order
  );
}

export async function loadOrdersCloud(commerceId = 'lodepichi'): Promise<SavedOrder[]> {
  const snapshot = await getDocs(getCommerceCollection('pedidos', commerceId));

  return snapshot.docs
    .map((item) => item.data() as SavedOrder)
    .sort((a, b) => {
      const dateA = Date.parse(a.date);
      const dateB = Date.parse(b.date);

      return (
        (Number.isNaN(dateB) ? 0 : dateB) -
        (Number.isNaN(dateA) ? 0 : dateA)
      );
    });
}
