// POST /api/send-likes
// Body: { uid, quantity }
// Environment:
// LIKES_API_URL: URL base do provedor de likes, ex: https://kryptorweb.com.br/api/likes
// LIKES_API_KEY: sua chave secreta

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
      console.error('Missing env vars: LIKES_API_URL or LIKES_API_KEY');
      return res.status(500).json({ error: 'Server not configured' });
    }

    const url = new URL(base);
    url.searchParams.set('uid', String(uid));
    url.searchParams.set('quantity', String(quantity));
    url.searchParams.set('key', key);
    url.searchParams.set('_t', Date.now().toString());

    console.log('Sending likes request:', url.toString().replace(key, '***'));

    const upstream = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error(`Upstream error ${upstream.status}:`, text);
      return res.status(upstream.status).json({ 
        error: `Upstream error ${upstream.status}`,
        details: text
      });
    }

    const data = await upstream.json();
    console.log('Likes sent successfully for uid:', uid);
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/send-likes:', err.message);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
