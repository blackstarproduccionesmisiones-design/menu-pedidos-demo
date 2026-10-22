
import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

import { firestore } from '../firebase';
import type { Category, Product, SavedOrder, StoreInfo } from '../types';

const COMERCIO_ID = 'lodepichi';

function getCommerceCollection(name: string) {
  if (!firestore) {
    throw new Error('Firebase no está configurado.');
  }

  return collection(firestore, 'comercios', COMERCIO_ID, name);
}

function getCommerceDocument(name: string) {
  if (!firestore) {
    throw new Error('Firebase no está configurado.');
  }

  return doc(firestore, 'comercios', COMERCIO_ID, name, 'principal');
}

export async function saveProductsCloud(products: Product[]) {
  await setDoc(getCommerceDocument('productos'), { items: products });
}

export async function loadProductsCloud(): Promise<Product[]> {
  const snapshot = await getDocs(getCommerceCollection('productos'));
  const principal = snapshot.docs.find((item) => item.id === 'principal');
  return principal ? (principal.data().items as Product[]) ?? [] : [];
}

export async function saveCategoriesCloud(categories: Category[]) {
  await setDoc(getCommerceDocument('categorias'), { items: categories });
}

export async function loadCategoriesCloud(): Promise<Category[]> {
  const snapshot = await getDocs(getCommerceCollection('categorias'));
  const principal = snapshot.docs.find((item) => item.id === 'principal');
  return principal ? (principal.data().items as Category[]) ?? [] : [];
}

export async function saveStoreCloud(store: StoreInfo) {
  await setDoc(getCommerceDocument('configuracion'), { ...store });
}

export async function loadStoreCloud(): Promise<StoreInfo | null> {
  if (!firestore) {
    throw new Error('Firebase no está configurado.');
  }

  const snapshot = await getDocs(getCommerceCollection('configuracion'));
  const principal = snapshot.docs.find((item) => item.id === 'principal');
  return principal ? (principal.data() as StoreInfo) : null;
}

export async function saveOrderCloud(order: SavedOrder) {
  await setDoc(
    doc(getCommerceCollection('pedidos'), order.id),
    order
  );
}

export async function loadOrdersCloud(): Promise<SavedOrder[]> {
  const snapshot = await getDocs(
    query(getCommerceCollection('pedidos'), orderBy('date', 'desc'))
  );

  return snapshot.docs.map((item) => item.data() as SavedOrder);
}

export function subscribeProductsCloud(
  callback: (products: Product[]) => void
) {
  return onSnapshot(getCommerceDocument('productos'), (snapshot) => {
    callback((snapshot.data()?.items as Product[]) ?? []);
  });
}

export function subscribeCategoriesCloud(
  callback: (categories: Category[]) => void
) {
  return onSnapshot(getCommerceDocument('categorias'), (snapshot) => {
    callback((snapshot.data()?.items as Category[]) ?? []);
  });
}

export function subscribeStoreCloud(
  callback: (store: StoreInfo | null) => void
) {
  return onSnapshot(getCommerceDocument('configuracion'), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as StoreInfo) : null);
  });
}
