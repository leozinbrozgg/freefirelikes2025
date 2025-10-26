import { useEffect, useState } from 'react';

const DEFAULT_PAGE = (import.meta as any)?.env?.VITE_WEEKLY_BG_PAGE as string | undefined;
const FALLBACK_IMG = ((import.meta as any)?.env?.VITE_FALLBACK_BG_URL as string | undefined)
  || 'https://dl.dir.freefiremobile.com/common/web_event/official2.ff.garena.all/202510/4c15e2a0cacd26a6656050c634e111da.jpg';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export function useWeeklyBackground() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = 'weekly-bg-cache-v1';
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as { url: string; ts: number };
        // Revalida a cada 24h
        if (Date.now() - cached.ts < 24 * 60 * 60 * 1000) {
          setUrl(cached.url);
        }
      } catch {}
    }

    const srcPage = DEFAULT_PAGE;
    if (!srcPage) {
      // Sem página configurada, usa fallback direto
      if (!url) setUrl(FALLBACK_IMG);
      return;
    }

    (async () => {
      try {
        const target = CORS_PROXY + encodeURIComponent(srcPage);
        const res = await fetch(target, { headers: { Accept: 'text/html' } });
        if (!res.ok) throw new Error('bg:fetch_failed');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // Tenta pelo seletor conhecido
        let img = doc.querySelector('img.home-app-cover.landscape') as HTMLImageElement | null;
        if (!img) {
          // fallback: pega a maior imagem do documento
          const images = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
          images.sort((a, b) => (Number(b.width || 0) * Number(b.height || 0)) - (Number(a.width || 0) * Number(a.height || 0)));
          img = images[0] || null;
        }
        let src = img?.getAttribute('src') || img?.src;
        if (!src) throw new Error('bg:no_img');
        // Normaliza URL relativa
        try {
          const u = new URL(src, srcPage);
          src = u.toString();
        } catch {}
        setUrl(src);
        localStorage.setItem(cacheKey, JSON.stringify({ url: src, ts: Date.now() }));
      } catch {
        if (!url) setUrl(FALLBACK_IMG);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return url;
}
