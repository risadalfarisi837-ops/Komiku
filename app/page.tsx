'use client';

import { useEffect, useState, memo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHistory } from '@/lib/store';

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

// ─── Warna & util ────────────────────────────────────────────────────────────
const ACCENT = '#FF6B6B';
const CARD = '#2A2931';
const MUTED = '#8F8D9B';

function typeLabel(item: any): string {
  const f = getFlag(item.title, item.type, item.flag);
  if (f === '🇰🇷') return 'Manhwa';
  if (f === '🇨🇳') return 'Manhua';
  if (f === '🇯🇵') return 'Manga';
  return 'Komik';
}
const clamp = (n: number): React.CSSProperties => ({ display: '-webkit-box', WebkitLineClamp: n, WebkitBoxOrient: 'vertical', overflow: 'hidden' });

// ─── Header: logo + search + lonceng ─────────────────────────────────────────
function Header({ onSearch }: { onSearch: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px 12px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#26252C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>K</div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1.5, marginLeft: 8, flex: 1 }}>
        Komi<span style={{ color: ACCENT }}>ku</span>
      </div>
      <button onClick={onSearch} aria-label="Cari" style={{ background: 'none', border: 0, color: '#fff', padding: 8 }}>
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><circle cx={11} cy={11} r={7.5} /><line x1={21} y1={21} x2={16.5} y2={16.5} /></svg>
      </button>
      <button aria-label="Notifikasi" style={{ position: 'relative', background: 'none', border: 0, color: '#fff', padding: 8, marginLeft: 6 }}>
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
        <span style={{ position: 'absolute', top: 6, right: 7, width: 9, height: 9, borderRadius: '50%', background: ACCENT }} />
      </button>
    </div>
  );
}

// ─── Banner geser: teks kiri, cover kanan, tombol "Baca sekarang" ────────────
function Hero({ items }: { items: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const slides = items.slice(0, 5);

  useEffect(() => {
    if (slides.length < 2) return;
    let i = 0;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      i = (i + 1) % slides.length;
      el.scrollTo({ left: i * (el.scrollWidth / slides.length), behavior: 'smooth' });
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div ref={ref} className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '4px 14px' }}>
      {slides.map((m, i) => {
        const rating = m.score && m.score !== 'N/A' ? m.score : getRating(m.desc);
        const desc = (m.desc || '').replace(/^Score:\s*[\d.]+\s*/i, '');
        return (
          <div key={i} style={{ position: 'relative', flex: '0 0 94%', height: 215, borderRadius: 28, overflow: 'hidden', scrollSnapAlign: 'center', background: '#16151A' }}>
            <img src={m.thumb} alt="" referrerPolicy="no-referrer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) brightness(.35)', transform: 'scale(1.3)' }} />
            <img src={m.thumb} alt={m.title} referrerPolicy="no-referrer" style={{ position: 'absolute', right: 14, top: 14, bottom: -20, width: '36%', objectFit: 'cover', borderRadius: 18, transform: 'rotate(6deg)', boxShadow: '0 6px 24px rgba(0,0,0,.6)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(20,19,24,.92) 45%, transparent 75%)' }} />
            <div style={{ position: 'absolute', left: 18, top: 16, bottom: 16, width: '60%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ letterSpacing: 0.3 }}>{typeLabel(m).toUpperCase()}</span>
                {rating && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ color: '#FBBF24' }}>★</span>{rating}</span>}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1, marginTop: 4, ...clamp(2) }}>{m.title}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35, marginTop: 6, color: '#E8E6EF', ...clamp(2) }}>{desc}</div>
              <Link href={`/manga?url=${encodeURIComponent(m.link)}`} style={{ marginTop: 'auto', alignSelf: 'flex-start', background: ACCENT, color: '#fff', fontWeight: 800, fontSize: 15, padding: '10px 22px', borderRadius: 99 }}>
                Baca sekarang
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Judul section: judul besar + link koral ─────────────────────────────────
function SectionTitle({ title, sub, action, onAction, href }: { title: string; sub?: string; action: string; onAction?: () => void; href?: string }) {
  const inner = (
    <span style={{ color: ACCENT, fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 2 }}>
      {action}
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
    </span>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '30px 14px 14px' }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>{title}</div>
        {sub && <div style={{ fontSize: 16, fontWeight: 800, color: MUTED, letterSpacing: -0.5, marginTop: 2 }}>{sub}</div>}
      </div>
      {href ? <Link href={href}>{inner}</Link> : <button onClick={onAction} style={{ background: 'none', border: 0 }}>{inner}</button>}
    </div>
  );
}

// ─── Lanjut baca (dari riwayat) ──────────────────────────────────────────────
function ContinueReading() {
  const { history } = useHistory();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const seen = new Set<string>();
  const list = history.filter(h => (seen.has(h.mangaLink) ? false : (seen.add(h.mangaLink), true))).slice(0, 8);
  if (!list.length) return null;

  return (
    <>
      <SectionTitle title="Lanjut baca" action="Riwayat" href="/history" />
      <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 14px' }}>
        {list.map((h, i) => {
          const pct = h.totalPages > 0 ? Math.min(100, Math.round((h.pageRead / h.totalPages) * 100)) : 0;
          const ch = (h.chapterNumber || h.chapterTitle || '').toString().replace(/^ch(apter)?\.?\s*/i, '');
          return (
            <Link key={i} href={`/chapter?url=${encodeURIComponent(h.chapterLink)}`} style={{ flex: '0 0 82%', maxWidth: 330, display: 'flex', gap: 14, background: CARD, borderRadius: 22, padding: 12 }}>
              <img src={h.mangaThumb} alt="" referrerPolicy="no-referrer" style={{ width: 62, height: 84, borderRadius: 10, objectFit: 'cover', background: '#222' }} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.7, ...clamp(2) }}>{h.mangaTitle}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Ch. {ch} <span style={{ color: MUTED }}>· {pct}%</span></div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,.08)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: ACCENT }} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

// ─── Kartu besar (Rekomendasi) ───────────────────────────────────────────────
const BigCard = memo(function BigCard({ item }: { item: any }) {
  const rating = item.score && item.score !== 'N/A' ? item.score : getRating(item.desc);
  return (
    <Link href={`/manga?url=${encodeURIComponent(item.link)}`} style={{ flex: '0 0 86%', maxWidth: 360, scrollSnapAlign: 'start' }}>
      <div style={{ position: 'relative', height: 215, borderRadius: 28, overflow: 'hidden', background: CARD }}>
        <img src={item.thumb} alt={item.title} loading="lazy" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(20,19,24,.8)', fontSize: 14, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>{typeLabel(item)}</span>
        {rating && <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(20,19,24,.8)', fontSize: 13, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}><span style={{ color: '#FBBF24' }}>★</span> {rating}</span>}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.6, margin: '10px 4px 0', ...clamp(1) }}>{item.title}</div>
    </Link>
  );
});

// ─── Rail poster biasa (Update / Populer) ────────────────────────────────────
const PosterRail = memo(function PosterRail({ items }: { items: any[] }) {
  return (
    <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 14px' }}>
      {items.slice(0, 12).map((m, i) => {
        const rating = m.score && m.score !== 'N/A' ? m.score : getRating(m.desc);
        return (
          <Link key={i} href={`/manga?url=${encodeURIComponent(m.link)}`} style={{ flex: '0 0 128px' }}>
            <div style={{ position: 'relative', paddingTop: '140%', borderRadius: 20, overflow: 'hidden', background: CARD }}>
              <img src={m.thumb} alt={m.title} loading="lazy" referrerPolicy="no-referrer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(20,19,24,.8)', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 7 }}>{typeLabel(m)}</span>
              {rating && <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(20,19,24,.8)', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 7 }}><span style={{ color: '#FBBF24' }}>★</span> {rating}</span>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.4, marginTop: 8, ...clamp(2) }}>{m.title}</div>
          </Link>
        );
      })}
    </div>
  );
});

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonHome() {
  const sh: React.CSSProperties = { background: 'linear-gradient(90deg,#2A2931 25%,#33323B 50%,#2A2931 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear' };
  return (
    <div style={{ padding: '0 14px' }}>
      <div style={{ ...sh, height: 215, borderRadius: 28 }} />
      <div style={{ ...sh, width: 150, height: 26, borderRadius: 8, margin: '34px 0 14px' }} />
      <div style={{ ...sh, height: 110, borderRadius: 22 }} />
      <div style={{ ...sh, width: 190, height: 26, borderRadius: 8, margin: '34px 0 14px' }} />
      <div style={{ ...sh, height: 215, borderRadius: 28 }} />
    </div>
  );
}

// ─── Halaman utama ───────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ category: string; items: any[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase di-load setelah halaman siap (defer supaya tidak memblok render)
  useEffect(() => {
    const t = setTimeout(() => {
      getFirebase().then(({ db }) => {
        db.ref('users').get().then(() => {}).catch(() => {});
      }).catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const CACHE_KEY = 'komiku_home_v1';
    const CACHE_TTL = 5 * 60 * 1000;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Array.isArray(data) && Date.now() - ts < CACHE_TTL) {
          setCategories(data);
          setLoading(false);
          return;
        } else if (Array.isArray(data)) {
          setCategories(data);
          setLoading(false);
        }
      }
    } catch {}

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

  const goSearch = useCallback(() => router.push('/search'), [router]);
  const seeAll = useCallback((c: string) => router.push(`/search?genre=${encodeURIComponent(c)}`), [router]);

  const all = categories.flatMap(c => c.items);
  const rate = (x: any) => parseFloat(getRating(x.desc) ?? '0') || 0;
  const hero = all.slice(0, 5);
  const recommended = all.slice(5, 15);
  const popular = [...all].sort((a, b) => rate(b) - rate(a)).slice(0, 12);

  return (
    <>
      <style>{`
        a { text-decoration: none; color: inherit; }
        ::-webkit-scrollbar { display: none; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div style={{ background: '#1B1A20', color: '#fff', minHeight: '100vh' }}>
        <Header onSearch={goSearch} />
        {loading ? (
          <SkeletonHome />
        ) : error ? (
          <div style={{ padding: 20, textAlign: 'center', color: MUTED }}>{error}</div>
        ) : (
          <>
            <Hero items={hero} />
            <ContinueReading />

            <SectionTitle title="Rekomendasi" sub="Pilihan tim Komiku" action="Lihat semua" onAction={() => seeAll('Rekomendasi')} />
            <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingLeft: 14, padding: '0 14px' }}>
              {recommended.map((m, i) => <BigCard key={i} item={m} />)}
            </div>

            <SectionTitle title="Update terbaru" action="Lihat semua" onAction={() => seeAll('Update')} />
            <PosterRail items={all.slice(0, 12)} />

            <SectionTitle title="Populer" action="Lihat semua" onAction={() => seeAll('Popular')} />
            <PosterRail items={popular} />
          </>
        )}
      </div>
    </>
  );
}
