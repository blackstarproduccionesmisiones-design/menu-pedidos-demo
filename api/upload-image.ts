import { createHash } from 'node:crypto';
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
    const match = /^Bearer\\s+(.+)$/i.exec(authorization);
    if (!match) return res.status(401).json({ error: 'Sesión requerida.' });

    const commerceId = typeof req.body?.commerceId === 'string' ? req.body.commerceId : '';
    const image = typeof req.body?.image === 'string' ? req.body.image : '';
    if (!/^[a-z0-9-]{1,60}$/.test(commerceId)) {
      return res.status(400).json({ error: 'Comercio inválido.' });
    }
    if (!/^data:image\\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 7_000_000) {
      return res.status(400).json({ error: 'La imagen debe ser JPG, PNG o WEBP y no superar 5 MB.' });
    }

    const { auth, db } = getAdminServices();
    const decoded = await auth.verifyIdToken(match[1]);
    const profileSnapshot = await db.collection('usuarios').doc(decoded.uid).get();
    const profile = profileSnapshot.data();
    const isMaster = profileSnapshot.exists && profile?.rol === 'admin_maestro' && profile?.activo === true;
    const isCommerceAdmin = profileSnapshot.exists && profile?.rol === 'admin' && profile?.comercioId === commerceId && profile?.activo === true;
    if (!isMaster && !isCommerceAdmin) {
      return res.status(403).json({ error: 'No tenés permisos para subir imágenes a este comercio.' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary credentials are missing');

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = `nexo-menu/${commerceId}`;
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(signatureBase).digest('hex');
    const form = new FormData();
    form.append('file', image);
    form.append('api_key', apiKey);
    form.append('timestamp', timestamp);
    form.append('folder', folder);
    form.append('signature', signature);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const uploadResult: any = await uploadResponse.json();
    if (!uploadResponse.ok || !uploadResult.secure_url) {
      console.error('Cloudinary upload failed:', uploadResult);
      return res.status(502).json({ error: 'Cloudinary no pudo procesar la imagen.' });
    }
    return res.status(200).json({ imageUrl: uploadResult.secure_url });
  } catch (error: any) {
    console.error('Image upload error:', error);
    if (error?.code?.startsWith?.('auth/')) return res.status(401).json({ error: 'La sesión venció. Volvé a ingresar.' });
    return res.status(500).json({ error: 'No se pudo subir la imagen. Intentá nuevamente.' });
  }
}
