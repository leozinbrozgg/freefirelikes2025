// Environment:
// LIKES_API_URL: URL base do provedor de likes, ex: https://kryptorweb.com.br/api/likes
// LIKES_API_KEY: sua chave secreta

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uid, quantity } = req.body || {};
    if (!uid || !quantity) {
      return res.status(400).json({ error: 'uid and quantity are required' });
    }

    const base = process.env.LIKES_API_URL;
    const key = process.env.LIKES_API_KEY;
    if (!base || !key) {
      return res.status(500).json({ error: 'Server not configured' });
    }

    const url = new URL(base);
    url.searchParams.set('uid', String(uid));
    url.searchParams.set('quantity', String(quantity));
    url.searchParams.set('key', key);
    url.searchParams.set('_t', Date.now().toString());

    const upstream = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
