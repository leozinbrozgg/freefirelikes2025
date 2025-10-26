// GET /api/player?uid=123
// Environment:
// PLAYER_API_URL: URL base para info do jogador, ex: https://kryptorweb.com.br/api/player
// PLAYER_API_KEY: chave opcional (se não setar, usa LIKES_API_KEY)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uid = (req.query?.uid || req.query?.UID || '').toString();
    if (!uid) return res.status(400).json({ error: 'uid is required' });

    const base = process.env.PLAYER_API_URL;
    const key = process.env.PLAYER_API_KEY || process.env.LIKES_API_KEY;
    
    if (!base || !key) {
      console.error('Missing env vars: PLAYER_API_URL or PLAYER_API_KEY/LIKES_API_KEY');
      return res.status(500).json({ error: 'Server not configured' });
    }

    const url = new URL(base);
    url.searchParams.set('uid', uid);
    url.searchParams.set('key', key);
    url.searchParams.set('_t', Date.now().toString());

    console.log('Fetching player info:', url.toString().replace(key, '***'));

    const upstream = await fetch(url.toString(), { 
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
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/player:', err.message);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
