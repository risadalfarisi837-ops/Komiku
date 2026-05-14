'use client';

import { useEffect, useState, memo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Firebase ────────────────────────────────────────────────────────────────
declare global { interface Window { firebase: any; _fbReady: boolean; } }
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAptqYUJWJ-bfadEA5Oa3d5c8YBl8qGzd0",
  authDomain: "komiku-d8788.firebaseapp.com",
  databaseURL: "https://komiku-d8788-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "komiku-d8788",
  storageBucket: "komiku-d8788.firebasestorage.app",
  messagingSenderId: "186745171350",
  appId: "1:186745171350:web:92cd160ed67e25de8801b7",
};
function loadFirebaseCDN(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window._fbReady) return Promise.resolve();
  return new Promise((resolve) => {
    const urls = [
      'https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js',
      'https://www.gstatic.com/firebasejs/10.14.0/firebase-database-compat.js',
    ];
    let done = 0;
    urls.forEach(src => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { done++; if (done === urls.length) { window._fbReady = true; resolve(); } };
      document.head.appendChild(s);
    });
  });
}
let _fbInit2 = false;
async function getFirebase() {
  await loadFirebaseCDN();
  if (!_fbInit2) {
    if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
    _fbInit2 = true;
  }
  return { auth: window.firebase.auth(), db: window.firebase.database() };
}

interface TopUser {
  uid: string; displayName: string; photoURL: string;
  level: number; koin: number; role: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getFlag(title: string, type?: string, flagField?: string): string {
  if (flagField) return flagField; // dari scraper langsung
  if (type) {
    const t = type.toLowerCase();
    if (t.includes('manhua')) return '🇨🇳';
    if (t.includes('manhwa') || t.includes('webtoon')) return '🇰🇷';
    if (t.includes('manga')) return '🇯🇵';
    if (t.includes('comic')) return '🇺🇸';
  }
  // fallback tebak dari judul
  const tl = title.toLowerCase();
  if (tl.includes('manhua') || tl.includes('chinese')) return '🇨🇳';
  if (tl.includes('manga') || tl.includes('japanese')) return '🇯🇵';
  return '🇰🇷';
}
function getRating(desc: string): string | null {
  if (!desc) return null;
  const m = desc.match(/Score:\s*([\d.]+)/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return (isNaN(n) || n <= 0) ? null : n.toFixed(1);
}

// ─── Banner + Search di atas ──────────────────────────────────────────────────
function BannerWithSearch({ items, onSearch }: { items: any[]; onSearch: (q: string) => void }) {
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState('');
  const timerRef = useRef<any>(null);
  const slides = items.slice(0, 5);

  useEffect(() => {
    if (slides.length === 0) return;
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % slides.length), 4000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const hero = slides[idx];

  return (
    <div style={{ position: 'relative', width: '100%', height: 420, overflow: 'hidden' }}>
      {/* BG image */}
      {hero && (
        <img
          src={hero.thumb} alt={hero?.title || ''}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', transition: 'opacity 0.5s' }}
          referrerPolicy="no-referrer"
        />
      )}
      {/* Dark gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.3) 40%, rgba(19,21,26,0.85) 75%, #0D0D10 100%)' }} />

      {/* Search bar at top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 14px' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
            </svg>
            <input
              type="text" placeholder="Search..."
              value={val} onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onSearch(val); }}
              style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', marginLeft: 10, outline: 'none', fontSize: 14, fontFamily: "'Outfit', sans-serif" }}
            />
          </div>
          {/* Search icon button */}
          <button onClick={() => onSearch(val)} style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
            </svg>
          </button>
          {/* Login icon */}
          <Link href="/profile" style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1={15} y1={12} x2={3} y2={12}/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Spotlight text content */}
      {hero && (
        <div style={{ position: 'absolute', bottom: 20, left: 16, right: 16, zIndex: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#9ca3af', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase', fontStyle: 'italic' }}>
            #1 Spotlight
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6, lineHeight: 1.3, textShadow: '0 2px 12px rgba(0,0,0,0.9)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {hero.title}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {hero.desc?.replace(/^Score:\s*[\d.]+\s*/i, '') || hero.desc || ''}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>...</div>
        </div>
      )}

      {/* Dots bottom-right */}
      <div style={{ position: 'absolute', bottom: 8, right: 16, display: 'flex', gap: 5, zIndex: 3 }}>
        {slides.map((_, i) => (
          <span
            key={i}
            onClick={() => { setIdx(i); clearInterval(timerRef.current); }}
            style={{ display: 'block', borderRadius: 99, cursor: 'pointer', transition: 'all 0.3s', width: idx === i ? 18 : 6, height: 6, background: idx === i ? '#fff' : 'rgba(255,255,255,0.3)' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Manga Card kotak persegi + flag + rating + chapter ───────────────────────
const MangaCard = memo(function MangaCard({ item }: { item: any }) {
  const flag = getFlag(item.title, item.type, item.flag);
  const rating = item.score && item.score !== 'N/A' ? item.score : getRating(item.desc);
  const chapterCount = item.chapterCount ?? null;

  return (
    <Link href={`/manga?url=${encodeURIComponent(item.link)}`} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', width: '100%' }}>
      {/* Poster */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '133%', borderRadius: 10, overflow: 'hidden', background: '#1C1F26' }}>
        <img
          src={item.thumb} alt={item.title} referrerPolicy="no-referrer" loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Flag top-left */}
        <div style={{ position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
          {flag}
        </div>
        {/* Rating top-right */}
        {rating && (
          <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 6px' }}>
            <span style={{ color: '#facc15', fontSize: 10 }}>★</span>
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{rating}</span>
          </div>
        )}
      </div>
      {/* Title */}
      <div style={{ fontSize: 13, color: '#fff', fontWeight: 800, marginTop: 6, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden', wordBreak: 'break-word' }}>
        {item.title}
      </div>
      {/* Chapter count */}
      {chapterCount !== null && chapterCount > 0 && (
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, fontWeight: 600 }}>
          {chapterCount} Chapter
        </div>
      )}
    </Link>
  );
});

// ─── Horizontal scroll section ────────────────────────────────────────────────
const HorizSection = memo(function HorizSection({ cat, label, onSeeAll }: { cat: any; label?: string; onSeeAll: (c: string) => void }) {
  return (
    <div style={{ width: '100%', marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px' }}>
        <h2 style={{ fontSize: 26, margin: 0, fontWeight: 900, color: '#fff' }}>{label || cat.category}</h2>
        <button onClick={() => onSeeAll(cat.category)} style={{ color: '#9ca3af', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'Outfit', sans-serif" }}>
          View All
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px 4px', scrollSnapType: 'x mandatory', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {cat.items.slice(0, 12).map((m: any, i: number) => (
          <div key={i} style={{ width: 140, flexShrink: 0, scrollSnapAlign: 'start' }}>
            <MangaCard item={m} />
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Grid section (3 col) ─────────────────────────────────────────────────────
const GridSection = memo(function GridSection({ cat, onSeeAll }: { cat: any; onSeeAll: (c: string) => void }) {
  return (
    <div style={{ width: '100%', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 16px 12px' }}>
        <h2 style={{ fontSize: 22, margin: 0, fontWeight: 900, color: '#fff' }}>{cat.category}</h2>
        <button onClick={() => onSeeAll(cat.category)} style={{ color: '#9ca3af', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'Outfit', sans-serif" }}>
          View All
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 12px', padding: '0 16px' }}>
        {cat.items.slice(0, 6).map((m: any, i: number) => (
          <MangaCard key={i} item={m} />
        ))}
      </div>
    </div>
  );
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonHome() {
  return (
    <div>
      <div style={{ width: '100%', height: 420, background: 'linear-gradient(90deg,#1C1F26 25%,#252525 50%,#1C1F26 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear' }} />
      {[0, 1].map(i => (
        <div key={i} style={{ padding: '18px 16px 8px' }}>
          <div style={{ width: 120, height: 22, borderRadius: 6, background: '#1C1F26', marginBottom: 14, animation: 'shimmer 1.5s infinite linear', backgroundSize: '200% 100%' }} />
          <div style={{ display: 'flex', gap: 12, overflow: 'hidden' }}>
            {[0,1,2].map(j => (
              <div key={j} style={{ width: 140, flexShrink: 0 }}>
                <div style={{ width: '100%', paddingTop: '133%', borderRadius: 10, background: '#1C1F26', animation: 'shimmer 1.5s infinite linear', backgroundSize: '200% 100%' }} />
                <div style={{ height: 14, borderRadius: 4, background: '#1C1F26', marginTop: 8, animation: 'shimmer 1.5s infinite linear', backgroundSize: '200% 100%' }} />
                <div style={{ height: 11, borderRadius: 4, background: '#1C1F26', marginTop: 5, width: '60%', animation: 'shimmer 1.5s infinite linear', backgroundSize: '200% 100%' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ category: string; items: any[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase di-load setelah halaman siap (defer supaya ga ngeblok render)
  useEffect(() => {
    const t = setTimeout(() => {
      getFirebase().then(({ db }) => {
        db.ref('users').get().then(() => {}).catch(() => {});
      }).catch(() => {});
    }, 3000); // tunda 3 detik
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const CACHE_KEY = 'komiku_home_v1';
    const CACHE_TTL = 5 * 60 * 1000; // 5 menit

    // Tampilkan cache dulu (instant render)
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Array.isArray(data) && Date.now() - ts < CACHE_TTL) {
          setCategories(data);
          setLoading(false);
          return; // data masih fresh, skip fetch
        } else if (Array.isArray(data)) {
          // Data expired tapi tampilkan dulu biar ga blank
          setCategories(data);
          setLoading(false);
        }
      }
    } catch {}

    // Fetch data terbaru di background
    fetch('/api/manga/home')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: json.data, ts: Date.now() })); } catch {}
        } else if (!categories.length) {
          setError(json.message || 'Gagal memuat data');
        }
      })
      .catch(e => { if (!categories.length) setError(e.message); })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }, [router]);

  const handleSeeAll = useCallback((c: string) => {
    router.push(`/search?genre=${encodeURIComponent(c)}`);
  }, [router]);

  const allItems = categories.flatMap(c => c.items);
  const bannerItems = allItems.slice(0, 5);

  // 3 section tetap: Update, Popular, For You
  const updateCat  = { category: 'Update',   items: allItems.slice(0, 12) };
  const popularCat = { category: 'Popular',  items: [...allItems].sort((a, b) => (parseFloat(getRating(b.desc) ?? '0') || 0) - (parseFloat(getRating(a.desc) ?? '0') || 0)).slice(0, 12) };
  const forYouCat  = { category: 'For You',  items: allItems.slice(12, 24) };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; background: #0D0D10; color: #fff; font-family: 'Outfit', sans-serif; overflow-x: hidden; width: 100%; }
        a { text-decoration: none; }
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div style={{ background: '#0D0D10', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
        <main style={{ paddingBottom: 80 }}>
          {loading ? (
            <SkeletonHome />
          ) : error ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>{error}</div>
          ) : (
            <>
              {/* Banner dengan search bar di atas — sama persis kayak sebelumnya */}
              <BannerWithSearch items={bannerItems} onSearch={handleSearch} />

              {/* Cuma 3 section */}
              <HorizSection cat={updateCat}  label="Update"   onSeeAll={handleSeeAll} />
              <HorizSection cat={popularCat} label="Popular"  onSeeAll={handleSeeAll} />
              <HorizSection cat={forYouCat}  label="For You"  onSeeAll={handleSeeAll} />
            </>
          )}
        </main>
      </div>
    </>
  );
}
