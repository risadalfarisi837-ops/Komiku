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
const ell: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

// ─── Header: logo + search + lonceng ─────────────────────────────────────────
function Header({ onSearch }: { onSearch: () => void }) {
  const [hasGift, setHasGift] = useState(false);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const { auth, db } = await getFirebase();
        const u: any = auth.currentUser || await new Promise((res) => { const un = auth.onAuthStateChanged((x: any) => { un(); res(x); }); });
        if (!u || !alive) return;
        const v = (await db.ref(`users/${u.uid}/gifts`).get()).val() || {};
        if (alive) setHasGift(Object.values(v).some((g: any) => g && !g.claimed));
      } catch {}
    }, 1500);
    return () => { alive = false; clearTimeout(t); };
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px 12px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#26252C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>K</div>
      <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -1.5, marginLeft: 8, flex: 1 }}>
        Komi<span style={{ color: ACCENT }}>kita</span>
      </div>
      <button onClick={onSearch} aria-label="Cari" style={{ background: 'none', border: 0, color: '#fff', padding: 8 }}>
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><circle cx={11} cy={11} r={7.5} /><line x1={21} y1={21} x2={16.5} y2={16.5} /></svg>
      </button>
      <button onClick={() => { window.location.assign('/notifikasi'); }} aria-label="Notifikasi" style={{ position: 'relative', background: 'none', border: 0, color: '#fff', padding: 8, marginLeft: 6 }}>
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
        {hasGift && <span style={{ position: 'absolute', top: 6, right: 7, width: 9, height: 9, borderRadius: '50%', background: ACCENT }} />}
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
              <div style={{ fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ letterSpacing: 0.3 }}>{typeLabel(m).toUpperCase()}</span>
                {rating && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ color: '#FBBF24' }}>★</span>{rating}</span>}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1, marginTop: 4, ...clamp(2) }}>{m.title}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.35, marginTop: 6, color: '#E8E6EF', ...clamp(2) }}>{desc}</div>
              <Link href={`/manga?url=${encodeURIComponent(m.link)}`} style={{ marginTop: 'auto', alignSelf: 'flex-start', background: ACCENT, color: '#fff', fontWeight: 800, fontSize: 14, padding: '10px 22px', borderRadius: 99 }}>
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
    <span style={{ color: ACCENT, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 2 }}>
      {action}
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
    </span>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '30px 14px 14px' }}>
      <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
        <div style={{ ...ell, fontSize: 22, fontWeight: 800, letterSpacing: -1 }}>{title}</div>
        {sub && <div style={{ ...ell, fontSize: 14, fontWeight: 800, color: MUTED, letterSpacing: -0.5, marginTop: 2 }}>{sub}</div>}
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
            <Link key={i} href={`/chapter?url=${encodeURIComponent(h.chapterLink)}&thumb=${encodeURIComponent(h.mangaThumb||'')}&mangaTitle=${encodeURIComponent(h.mangaTitle||'')}`} style={{ flex: '0 0 82%', maxWidth: 330, display: 'flex', gap: 14, background: CARD, borderRadius: 22, padding: 12 }}>
              <img src={h.mangaThumb} alt="" referrerPolicy="no-referrer" style={{ width: 62, height: 84, borderRadius: 10, objectFit: 'cover', background: '#222' }} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.7, ...clamp(2) }}>{h.mangaTitle}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Ch. {ch} <span style={{ color: MUTED }}>· {pct}%</span></div>
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
        <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(20,19,24,.8)', fontSize: 13, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>{typeLabel(item)}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.6, margin: '10px 4px 0', ...clamp(1) }}>{item.title}</div>
    </Link>
  );
});

// ─── Util tampilan ───────────────────────────────────────────────────────────
const GOLD = '#F5C451';
const BADGE_BG = 'rgba(20,19,24,.82)';
const ratingOf = (m: any) => (m.score && m.score !== 'N/A' ? m.score : getRating(m.desc));
const ratingId = (m: any, zero = false) => { const r = ratingOf(m); return r ? String(r).replace('.', ',') : zero ? '0,0' : null; };
function chNum(ch?: string) { const n = String(ch || '').match(/(\d+(?:[.,]\d+)?)/); return n ? `Ch. ${n[1]}` : ''; }
function fmtViews(v: any): string | null {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  if (/[a-z]/i.test(s)) return s;
  const n = parseInt(s.replace(/\D/g, ''), 10);
  if (!n) return null;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' jt';
  if (n >= 1e3) return Math.round(n / 1e3) + ' rb';
  return String(n);
}
function vnum(m: any): number {
  const s = String(m.views || '').toLowerCase().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s) || 0;
  return /jt|m/.test(s) ? n * 1e6 : /rb|k/.test(s) ? n * 1e3 : n;
}
const isFresh = (t?: string) => /detik|menit|jam|baru/i.test(t || '');
const uniq = (arr: any[]) => arr.filter((v, i, a) => a.findIndex(t => t.link === v.link) === i);
const mangaHref = (m: any) => `/manga?url=${encodeURIComponent(m.link)}`;

const Eye = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx={12} cy={12} r={3} /></svg>
);
const TypeBadge = ({ item, size = 11 }: { item: any; size?: number }) => (
  <span style={{ background: BADGE_BG, fontSize: size, fontWeight: 800, padding: '3px 8px', borderRadius: 7 }}>{typeLabel(item)}</span>
);
const NewBadge = ({ size = 11 }: { size?: number }) => (
  <span style={{ background: ACCENT, color: '#fff', fontSize: size, fontWeight: 800, padding: '3px 8px', borderRadius: 7 }}>BARU</span>
);
const Cover = ({ src, alt = '' }: { src: string; alt?: string }) => (
  <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
);

// ─── Pembaruan terbaru: daftar vertikal ──────────────────────────────────────
const LatestList = memo(function LatestList({ items }: { items: any[] }) {
  return (
    <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {items.map((m, i) => {
        const views = fmtViews(m.views);
        const ch = chNum(m.chapter);
        return (
          <Link key={i} href={mangaHref(m)} style={{ display: 'flex', gap: 14 }}>
            <div style={{ position: 'relative', flex: '0 0 76px', height: 112, borderRadius: 14, overflow: 'hidden', background: CARD }}>
              <Cover src={m.thumb} alt={m.title} />
              <span style={{ position: 'absolute', top: 6, left: 6 }}><TypeBadge item={m} size={10} /></span>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15, ...clamp(2) }}>{m.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, fontSize: 13, fontWeight: 800 }}>
                  <span><span style={{ color: '#FBBF24' }}>★</span> {ratingId(m, true)}</span>
                  {views && <span style={{ color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}><Eye /> {views}</span>}
                  {isFresh(m.time) && <NewBadge />}
                </div>
              </div>
              {ch && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: CARD, borderRadius: 14, padding: '10px 14px', marginTop: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{ch}</span>
                  {m.time && <span style={{ fontSize: 11.5, fontWeight: 700, color: MUTED }}>{m.time}</span>}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
});

// ─── Kartu Premium ───────────────────────────────────────────────────────────
function PremiumCard() {
  return (
    <div style={{ margin: '30px 14px 0', padding: '18px 18px', borderRadius: 22, border: '1.5px solid #5E4E1C', background: '#272212', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: GOLD, fontSize: 13, fontWeight: 800 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill={GOLD}><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /></svg>
          KOMIKITA PREMIUM
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -1, marginTop: 6, color: '#FBF3DC' }}>Baca tanpa iklan</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#B7AD8C', marginTop: 2, lineHeight: 1.3 }}>Plus unduh massal untuk baca offline</div>
      </div>
      <Link href="/profile" style={{ background: GOLD, color: '#2A2208', fontWeight: 800, fontSize: 14, padding: '12px 18px', borderRadius: 99, whiteSpace: 'nowrap' }}>
        Coba sekarang
      </Link>
    </div>
  );
}

// ─── Terpopuler: kolom berisi 3 peringkat, geser ke samping ──────────────────
const Ranked = memo(function Ranked({ items }: { items: any[] }) {
  const cols: any[][] = [];
  for (let i = 0; i < items.length; i += 3) cols.push(items.slice(i, i + 3));
  return (
    <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '0 14px' }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{ flex: '0 0 88%', display: 'flex', flexDirection: 'column', gap: 14, scrollSnapAlign: 'start' }}>
          {col.map((m, ri) => {
            const n = ci * 3 + ri + 1;
            const views = fmtViews(m.views);
            return (
              <Link key={ri} href={mangaHref(m)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 40, textAlign: 'center', fontSize: 41, fontWeight: 800, letterSpacing: -2, color: n <= 3 ? ACCENT : '#6B6976' }}>{n}</span>
                <div style={{ position: 'relative', flex: '0 0 62px', height: 92, borderRadius: 10, overflow: 'hidden', background: CARD }}>
                  <Cover src={m.thumb} alt={m.title} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.2, ...clamp(2) }}>{m.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 13, fontWeight: 800 }}>
                    <span><span style={{ color: '#FBBF24' }}>★</span> {ratingId(m, true)}</span>
                    {views && <span style={{ color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}><Eye /> {views}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
});

// ─── Poster (Jelajah per genre & Berdasarkan asal) ───────────────────────────
const PosterCard = memo(function PosterCard({ m, w }: { m: any; w: string }) {
  const ch = chNum(m.chapter);
  return (
    <Link href={mangaHref(m)} style={{ flex: `0 0 ${w}`, minWidth: 0 }}>
      <div style={{ position: 'relative', paddingTop: '150%', borderRadius: 22, overflow: 'hidden', background: CARD }}>
        <Cover src={m.thumb} alt={m.title} />
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          <TypeBadge item={m} />
          {isFresh(m.time) && <NewBadge />}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.5, marginTop: 8, ...clamp(2) }}>{m.title}</div>
      {ch && <div style={{ fontSize: 13, fontWeight: 800, color: MUTED, marginTop: 2 }}>{ch}</div>}
    </Link>
  );
});

function GenreSection({ categories }: { categories: { category: string; items: any[] }[] }) {
  const [sel, setSel] = useState(0);
  const cat = categories[sel] || categories[0];
  if (!cat) return null;
  return (
    <>
      <SectionTitle title="Jelajah per genre" action="Lihat semua" href="/search" />
      <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 14px 16px' }}>
        {categories.map((c, i) => {
          const on = i === sel;
          return (
            <button key={c.category} onClick={() => setSel(i)} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 99, fontSize: 15, fontWeight: 800, letterSpacing: -0.4, background: on ? '#F3F2F7' : 'transparent', color: on ? '#1B1A20' : '#fff', border: on ? '1px solid #F3F2F7' : '1px solid rgba(255,255,255,.14)' }}>
              {on && <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1B1A20" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6" /></svg>}
              {c.category}
            </button>
          );
        })}
      </div>
      <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 14px' }}>
        {cat.items.slice(0, 9).map((m, i) => <PosterCard key={cat.category + i} m={m} w="calc((100% - 20px) / 3)" />)}
      </div>
    </>
  );
}

function OriginSection({ all }: { all: any[] }) {
  const tabs = ['Manhwa', 'Manhua', 'Manga'];
  const [tab, setTab] = useState('Manga');
  const list = all.filter(m => typeLabel(m) === tab).slice(0, 12);
  return (
    <>
      <SectionTitle title="Berdasarkan asal" action="Lihat semua" href="/search" />
      <div style={{ margin: '0 14px 16px', display: 'inline-flex', padding: 5, borderRadius: 99, background: '#25242B', border: '1px solid rgba(255,255,255,.06)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 26px', borderRadius: 99, fontSize: 16, fontWeight: 800, letterSpacing: -0.5, background: tab === t ? '#18171C' : 'transparent', color: tab === t ? '#fff' : MUTED, border: 0 }}>{t}</button>
        ))}
      </div>
      {list.length ? (
        <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 14px' }}>
          {list.map((m, i) => <PosterCard key={tab + i} m={m} w="calc((100% - 30px) / 3.35)" />)}
        </div>
      ) : (
        <div style={{ padding: '10px 14px', color: MUTED, fontWeight: 700 }}>Belum ada komik {tab}.</div>
      )}
    </>
  );
}

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
    const CACHE_KEY = 'komiku_home_v3'; // v2: data sekarang punya chapter/waktu/views
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

  const all = uniq(categories.flatMap(c => c.items));
  const rate = (x: any) => parseFloat(ratingOf(x) ?? '0') || 0;
  const hero = all.slice(0, 5);
  const recommended = all.slice(5, 15);
  const withCh = all.filter(m => m.chapter);
  const latest = (withCh.length >= 4 ? withCh : all).slice(0, 4);
  const popular = [...all].sort((a, b) => (vnum(b) - vnum(a)) || (rate(b) - rate(a))).slice(0, 12);

  return (
    <>
      <style>{`
        a { text-decoration: none; color: inherit; }
        button { font-family: inherit; cursor: pointer; }
        ::-webkit-scrollbar { display: none; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div style={{ background: '#1B1A20', color: '#fff', minHeight: '100vh', paddingBottom: 24 }}>
        <Header onSearch={goSearch} />
        {loading ? (
          <SkeletonHome />
        ) : error ? (
          <div style={{ padding: 20, textAlign: 'center', color: MUTED }}>{error}</div>
        ) : (
          <>
            <Hero items={hero} />
            <ContinueReading />

            <SectionTitle title="Rekomendasi" sub="Pilihan tim Komikita" action="Lihat semua" onAction={() => seeAll('Rekomendasi')} />
            <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingLeft: 14, padding: '0 14px' }}>
              {recommended.map((m, i) => <BigCard key={i} item={m} />)}
            </div>

            <SectionTitle title="Pembaruan terbaru" action="Lihat semua" onAction={() => seeAll('Update')} />
            <LatestList items={latest} />

            <PremiumCard />

            <SectionTitle title="Terpopuler sepanjang masa" sub="Paling banyak dibaca di Komikita" action="Lihat semua" onAction={() => seeAll('Popular')} />
            <Ranked items={popular} />

            <GenreSection categories={categories} />

            <OriginSection all={all} />
          </>
        )}
      </div>
    </>
  );
}
