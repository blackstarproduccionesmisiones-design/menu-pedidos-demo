import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  const serviceAccount = JSON.parse(raw);
  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
  return getFirestore(app);
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
  const icons = appIconUrl
    ? [
        { src: appIconUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: appIconUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ]
    : [
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
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
