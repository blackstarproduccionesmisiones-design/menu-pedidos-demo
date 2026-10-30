import { randomBytes } from 'node:crypto';
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

    const { auth, db } = getAdminServices();
    const decoded = await auth.verifyIdToken(match[1]);
    const masterSnapshot = await db.collection('usuarios').doc(decoded.uid).get();
    const master = masterSnapshot.data();
    if (!masterSnapshot.exists || master?.rol !== 'admin_maestro' || master?.activo !== true) {
      return res.status(403).json({ error: 'Solo el administrador maestro puede asignar propietarios.' });
    }

    const commerceId = typeof req.body?.commerceId === 'string' ? req.body.commerceId.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(commerceId) || commerceId.length > 60) {
      return res.status(400).json({ error: 'Identificador de comercio inválido.' });
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Ingresá un correo electrónico válido.' });
    }

    const commerceRef = db.collection('comercios').doc(commerceId);
    const commerceSnapshot = await commerceRef.get();
    const commerce = commerceSnapshot.data();
    if (!commerceSnapshot.exists || commerce?.rol === 'admin' || commerce?.rol === 'admin_maestro') {
      return res.status(404).json({ error: 'No se encontró ese comercio.' });
    }
    if (commerce?.activo === false) {
      return res.status(400).json({ error: 'El comercio está inactivo y no puede recibir un propietario.' });
    }

    let user;
    let createdUser = false;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') throw error;
      user = await auth.createUser({
        email,
        password: randomBytes(32).toString('base64url'),
        emailVerified: false,
        disabled: false,
      });
      createdUser = true;
    }

    const userRef = db.collection('usuarios').doc(user.uid);
    const userSnapshot = await userRef.get();
    const currentProfile = userSnapshot.data();
    if (currentProfile?.rol === 'admin_maestro') {
      if (createdUser) await auth.deleteUser(user.uid).catch(() => undefined);
      return res.status(409).json({ error: 'Ese correo pertenece al administrador maestro y no puede asignarse a un comercio.' });
    }
    if (currentProfile?.rol === 'admin' && currentProfile?.comercioId && currentProfile.comercioId !== commerceId) {
      if (createdUser) await auth.deleteUser(user.uid).catch(() => undefined);
      return res.status(409).json({ error: 'Ese usuario ya está asignado a otro comercio. No se modificó su asignación.' });
    }
    if (currentProfile && currentProfile.rol !== 'admin') {
      if (createdUser) await auth.deleteUser(user.uid).catch(() => undefined);
      return res.status(409).json({ error: 'Ese usuario ya tiene otro perfil. Usá un correo distinto o revisá la cuenta.' });
    }

    await userRef.set({
      rol: 'admin',
      comercioId: commerceId,
      activo: true,
      email,
      ...(userSnapshot.exists && currentProfile?.createdAt ? {} : { createdAt: FieldValue.serverTimestamp() }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.status(200).json({ ok: true, email, commerceId, createdUser, needsPasswordReset: true });
  } catch (error: any) {
    console.error('Assign commerce owner API error:', error);
    if (error?.code === 'auth/argument-error' || error?.code === 'auth/id-token-expired' || error?.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'La sesión venció. Volvé a ingresar.' });
    }
    if (error?.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Ese correo ya está registrado en Firebase. Actualizá la lista e intentá de nuevo.' });
    }
    return res.status(500).json({ error: 'No se pudo asignar el propietario. Verificá la configuración del servidor.' });
  }
}
