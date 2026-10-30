import { createHash, randomBytes } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminServices() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  const serviceAccount = JSON.parse(raw);
  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
  return { auth: getAuth(app), db: getFirestore(app) };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    const authorization = req.headers.authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) return res.status(401).json({ error: 'Sesión requerida.' });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary upload signing environment variables are missing.');
      return res.status(503).json({ error: 'La carga de imágenes todavía no está configurada.' });
    }

    const { auth, db } = getAdminServices();
    const decoded = await auth.verifyIdToken(match[1]);
    const profileSnapshot = await db.collection('usuarios').doc(decoded.uid).get();
    const profile = profileSnapshot.data();
    if (!profileSnapshot.exists || profile?.activo !== true || !['admin', 'admin_maestro'].includes(profile?.rol)) {
      return res.status(403).json({ error: 'No tenés permisos para subir imágenes.' });
    }

    const requestedCommerceId = typeof req.body?.commerceId === 'string' ? req.body.commerceId.trim() : '';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedCommerceId) || requestedCommerceId.length > 60) {
      return res.status(400).json({ error: 'Identificador de comercio inválido.' });
    }
    if (profile.rol !== 'admin_maestro' && profile.comercioId !== requestedCommerceId) {
      return res.status(403).json({ error: 'No podés subir imágenes para otro comercio.' });
    }

    const kind = req.body?.kind;
    if (!['cover', 'logo', 'product'].includes(kind)) {
      return res.status(400).json({ error: 'Tipo de imagen inválido.' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `nexo-menu/${requestedCommerceId}/${kind}`;
    const publicId = `${Date.now()}-${randomBytes(6).toString('hex')}`;
    const params: Record<string, string | number> = {
      folder,
      public_id: publicId,
      timestamp,
    };
    const signatureBase = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    const signature = createHash('sha1').update(signatureBase + apiSecret).digest('hex');

    return res.status(200).json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      publicId,
      signature,
    });
  } catch (error: any) {
    console.error('Cloudinary upload signature error:', error);
    if (error?.code === 'auth/argument-error' || error?.code === 'auth/id-token-expired' || error?.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'La sesión venció. Volvé a ingresar.' });
    }
    return res.status(500).json({ error: 'No se pudo preparar la carga de la imagen.' });
  }
}
