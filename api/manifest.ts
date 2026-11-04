import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  const serviceAccount = JSON.parse(raw);
  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
  return getFirestore(app);
}

function getCloudinaryPwaIcon(url: string, size: 192 | 512) {
  const uploadPath = '/image/upload/';
  if (!url.includes('res.cloudinary.com') || !url.includes(uploadPath)) return null;
  return url.replace(
    uploadPath,
    `${uploadPath}c_fill,g_auto,w_${size},h_${size},f_png/`,
  );
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const rawCommerceId = typeof req.query?.comercio === 'string'
    ? req.query.comercio.trim().toLowerCase()
    : 'lodepichi';
  const commerceId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawCommerceId)
    ? rawCommerceId
    : 'lodepichi';

  let commerceName = commerceId
    .split('-')
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  let appIconUrl = '';

  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection('comercios')
      .doc(commerceId)
      .collection('configuracion')
      .doc('principal')
      .get();
    if (snapshot.exists) {
      const store = snapshot.data() || {};
      if (typeof store.name === 'string' && store.name.trim()) commerceName = store.name.trim();
      if (typeof store.appIconUrl === 'string' && /^https:\/\//i.test(store.appIconUrl)) {
        appIconUrl = store.appIconUrl;
      }
    }
  } catch (error) {
    console.error('No se pudo leer la configuración PWA del comercio:', error);
  }

  const launchUrl = `/?comercio=${encodeURIComponent(commerceId)}`;
  const custom192 = appIconUrl ? getCloudinaryPwaIcon(appIconUrl, 192) : null;
  const custom512 = appIconUrl ? getCloudinaryPwaIcon(appIconUrl, 512) : null;

  // Si el comercio tiene un ícono propio, no ofrecer el maskable genérico:
  // Android podría elegirlo para el lanzador en lugar del ícono personalizado.
  // El ícono adaptable genérico queda como respaldo para comercios sin ícono propio.
  const icons = custom192 && custom512
    ? [
        { src: custom192, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: custom512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      ]
    : [
        ...(appIconUrl ? [{ src: appIconUrl, sizes: 'any', purpose: 'any' }] : []),
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ];

  return res.status(200).json({
    id: launchUrl,
    name: commerceName,
    short_name: commerceName.slice(0, 12),
    description: `Menú digital de ${commerceName} y pedidos directos por WhatsApp.`,
    lang: 'es',
    start_url: launchUrl,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#ffc400',
    background_color: '#ffdf24',
    icons,
  });
}
