export default function handler(req: any, res: any) {
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

  const commerceName = commerceId
    .split('-')
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const launchUrl = `/?comercio=${encodeURIComponent(commerceId)}`;

  return res.status(200).json({
    id: launchUrl,
    name: `Menú Digital - ${commerceName}`,
    short_name: commerceName.slice(0, 12),
    description: 'Menú digital y pedidos directos por WhatsApp.',
    lang: 'es',
    start_url: launchUrl,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#ffc400',
    background_color: '#ffdf24',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  });
}
