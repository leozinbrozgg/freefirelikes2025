import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/player?uid=123
app.get('/api/player', async (req, res) => {
  try {
    const uid = (req.query?.uid || req.query?.UID || '').toString();
    if (!uid) return res.status(400).json({ error: 'uid is required' });

    const base = process.env.PLAYER_API_URL;
    const key = process.env.PLAYER_API_KEY || process.env.LIKES_API_KEY;
    if (!base || !key) return res.status(500).json({ error: 'Server not configured' });

    const url = new URL(base);
    url.searchParams.set('uid', uid);
    url.searchParams.set('key', key);
    url.searchParams.set('_t', Date.now().toString());

    const upstream = await fetch(url.toString(), { headers: { Accept: 'application/json' } });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return res.status(upstream.status).json({ error: `Upstream error ${upstream.status}`, details: text });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
});

// POST /api/send-likes { uid, quantity }
app.post('/api/send-likes', async (req, res) => {
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

    const upstream = await fetch(url.toString(), { method: 'GET', headers: { Accept: 'application/json' } });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return res.status(upstream.status).json({ error: `Upstream error ${upstream.status}`, details: text });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Local API server listening on http://localhost:${PORT}`);
});
