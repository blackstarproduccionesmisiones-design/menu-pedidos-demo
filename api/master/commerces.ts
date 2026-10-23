import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

function getAdminServices() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');

  const serviceAccount = JSON.parse(raw);
  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
  return { auth: getAuth(app), db: getFirestore(app) };
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (!['GET', 'POST', 'PATCH'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    const authorization = req.headers.authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) return res.status(401).json({ error: 'Sesión requerida.' });

    const { auth, db } = getAdminServices();
    const decoded = await auth.verifyIdToken(match[1]);
    const profileSnapshot = await db.collection('usuarios').doc(decoded.uid).get();
    const profile = profileSnapshot.data();

    if (!profileSnapshot.exists || profile?.rol !== 'admin_maestro' || profile?.activo !== true) {
      return res.status(403).json({ error: 'Solo el administrador maestro puede realizar esta operación.' });
    }

    const collection = db.collection('comercios');

    if (req.method === 'GET') {
      const snapshot = await collection.get();
      const commerces = snapshot.docs
        .filter((item) => {
          const data = item.data();
          return data.rol !== 'admin' && data.rol !== 'admin_maestro';
        })
        .map((item) => {
          const data = item.data();
          return {
            id: item.id,
            nombre: String(data.nombre || data.name || data.nombreComercial || item.id),
            activo: data.activo !== false,
          };
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      return res.status(200).json({ commerces });
    }

    if (req.method === 'POST') {
      const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
      const requestedId = typeof req.body?.id === 'string' ? req.body.id.trim().toLowerCase() : '';
      const id = requestedId || slugify(nombre);

      if (nombre.length < 2 || nombre.length > 100) {
        return res.status(400).json({ error: 'El nombre debe tener entre 2 y 100 caracteres.' });
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 60) {
        return res.status(400).json({ error: 'El identificador debe usar letras sin acentos, números y guiones.' });
      }

      const ref = collection.doc(id);
      const existing = await ref.get();
      if (existing.exists) return res.status(409).json({ error: 'Ya existe un comercio con ese identificador.' });

      await ref.create({
        nombre,
        activo: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return res.status(201).json({ commerce: { id, nombre, activo: true } });
    }

    const id = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 60) {
      return res.status(400).json({ error: 'Identificador de comercio inválido.' });
    }
    if (nombre.length < 2 || nombre.length > 100) {
      return res.status(400).json({ error: 'El nombre debe tener entre 2 y 100 caracteres.' });
    }

    const ref = collection.doc(id);
    const existing = await ref.get();
    if (!existing.exists || existing.data()?.rol === 'admin' || existing.data()?.rol === 'admin_maestro') {
      return res.status(404).json({ error: 'No se encontró ese comercio.' });
    }

    await ref.update({ nombre, updatedAt: FieldValue.serverTimestamp() });
    return res.status(200).json({ commerce: { id, nombre, activo: existing.data()?.activo !== false } });
  } catch (error: any) {
    console.error('Master commerce API error:', error);
    if (error?.code === 'auth/argument-error' || error?.code === 'auth/id-token-expired' || error?.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'La sesión venció. Volvé a ingresar.' });
    }
    return res.status(500).json({ error: 'No se pudo completar la operación. Verificá la configuración del servidor.' });
  }
}
