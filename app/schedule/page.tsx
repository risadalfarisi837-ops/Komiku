'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
// Deteksi negara dari title/link
function detectFlag(title: string, link: string): string {
    const l = link.toLowerCase();
    if (l.includes('/manhwa/') || l.includes('type/manhwa')) return '🇰🇷';
    if (l.includes('/manhua/') || l.includes('type/manhua')) return '🇨🇳';
    return '🇯🇵';
}

import { Search, SlidersHorizontal, Star, Loader2, ChevronDown, X, ChevronUp } from 'lucide-react';

interface MangaItem {
  title: string;
  link: string;
  thumb: string;
  type?: string;
  score?: string;
  chapter?: string;
  time?: string;
}

const GENRES = [
  'Action', 'Adaptation', 'Adult', 'Adventure', 'Comedy', 'Cooking',
  'Crime', 'Demon', 'Demons', 'Drama', 'Ecchi', 'Fantasy', 'Fight',
  'Game', 'Gender Bender', 'Harem', 'Historical', 'Horror', 'Isekai',
  'Josei', 'Love', 'Magic', 'Martial Arts', 'Mature', 'Mecha',
  'Medical', 'Murim', 'Mystery', 'Philosophical', 'Psychological',
  'Regression', 'Revenge', 'Romance', 'School Life', 'Sci-fi',
  'Seinen', 'Shoujo', 'Shounen', 'Slice of Life', 'Smut', 'Sports',
  'Supernatural', 'Thriller', 'Tragedy', 'Violence', 'Wuxia',
];

const FORMATS = ['Manga', 'Manhwa', 'Manhua'];
const STATUSES = ['Ongoing', 'Completed'];

const GENRE_PATHS: Record<string, string> = {
  'Action': '/genres/action/',
  'Adaptation': '/genres/adaptation/',
  'Adult': '/genres/adult/',
  'Adventure': '/genres/adventure/',
  'Comedy': '/genres/comedy/',
  'Cooking': '/genres/cooking/',
  'Crime': '/genres/crime/',
  'Demon': '/genres/demon/',
  'Demons': '/genres/demons/',
  'Drama': '/genres/drama/',
  'Ecchi': '/genres/ecchi/',
  'Fantasy': '/genres/fantasy/',
  'Fight': '/genres/fight/',
  'Game': '/genres/game/',
  'Gender Bender': '/genres/gender-bender/',
  'Harem': '/genres/harem/',
  'Historical': '/genres/historical/',
  'Horror': '/genres/horror/',
  'Isekai': '/genres/isekai/',
  'Josei': '/genres/josei/',
  'Love': '/genres/love/',
  'Magic': '/genres/magic/',
  'Martial Arts': '/genres/martial-arts/',
  'Mature': '/genres/mature/',
  'Mecha': '/genres/mecha/',
  'Medical': '/genres/medical/',
  'Murim': '/genres/murim/',
  'Mystery': '/genres/mystery/',
  'Philosophical': '/genres/philosophical/',
  'Psychological': '/genres/psychological/',
  'Regression': '/genres/regression/',
  'Revenge': '/genres/revenge/',
  'Romance': '/genres/romance/',
  'School Life': '/genres/school-life/',
  'Sci-fi': '/genres/sci-fi/',
  'Seinen': '/genres/seinen/',
  'Shoujo': '/genres/shoujo/',
  'Shounen': '/genres/shounen/',
  'Slice of Life': '/genres/slice-of-life/',
  'Smut': '/genres/smut/',
  'Sports': '/genres/sports/',
  'Supernatural': '/genres/supernatural/',
  'Thriller': '/genres/thriller/',
  'Tragedy': '/genres/tragedy/',
  'Violence': '/genres/violence/',
  'Wuxia': '/genres/wuxia/',
};

const FORMAT_PATHS: Record<string, string> = {
  'Manga': '/type/manga/',
  'Manhwa': '/type/manhwa/',
  'Manhua': '/type/manhua/',
};

const STATUS_PATHS: Record<string, string> = {
  'Ongoing': '/daftar-manga/?status=ongoing&orderby=popular',
  'Completed': '/daftar-manga/?status=completed&orderby=popular',
};

const DEFAULT_PATH = '/daftar-manga/?orderby=popular';

async function fetchFromUrl(url: string): Promise<string> {
  const PROXIES = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) return res.text();
  } catch { }
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(10000) });
      if (res.ok) return res.text();
    } catch { }
  }
  throw new Error('Gagal fetch');
}

function parseHtml(html: string): MangaItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const items: MangaItem[] = [];
  const selectors = ['.animepost', '.bs', '.bsx', '.listupd .bs'];
  let els: NodeListOf<Element> | null = null;
  for (const sel of selectors) {
    const found = doc.querySelectorAll(sel);
    if (found.length > 0) { els = found; break; }
  }
  if (!els) return items;
  els.forEach(el => {
    const title = el.querySelector('.tt h4')?.textContent?.trim()
      || el.querySelector('.tt')?.textContent?.trim()
      || el.querySelector('h3,h4')?.textContent?.trim() || '';
    const anchor = el.querySelector('a') as HTMLAnchorElement;
    const link = anchor?.getAttribute('href') || '';
    const img = el.querySelector('img');
    const thumb = img?.getAttribute('src') || img?.getAttribute('data-src') || img?.getAttribute('data-lazy-src') || '';
    const score = el.querySelector('.score,.numscore,.rating')?.textContent?.trim() || 'N/A';
    const chapter = el.querySelector('.eps,.chapter,.ch,.lch,.epxs')?.textContent?.trim() || '';
    if (title && link) {
      const cleanLink = link.startsWith('http') ? link : `https://komikindo.tv${link}`;
      items.push({ title, link: cleanLink, thumb, score, chapter });
    }
  });
  return items;
}

const CORAL = '#FF6B6B';
const MUTED = '#8F8D9B';
const SORT_LABEL = { update: 'Pembaruan terbaru', popular: 'Terpopuler' } as const;

function knownType(m: MangaItem): string {
  const t = (m.type || '').toLowerCase();
  if (t.includes('manhwa')) return 'Manhwa';
  if (t.includes('manhua')) return 'Manhua';
  if (t.includes('manga')) return 'Manga';
  return '';
}
function chNum(ch?: string) { const n = String(ch || '').match(/(\d+(?:[.,]\d+)?)/); return n ? `Ch. ${n[1]}` : ''; }
const isFresh = (t?: string) => /detik|menit|jam|baru/i.test(t || '');
const clamp2: React.CSSProperties = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

export default function BrowsePage() {
  const [items, setItems] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [showSheet, setShowSheet] = useState(false);
  const [genreOpen, setGenreOpen] = useState(true);
  const [formatOpen, setFormatOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [pendingGenre, setPendingGenre] = useState<string | null>(null);
  const [pendingFormat, setPendingFormat] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const [appliedGenre, setAppliedGenre] = useState<string | null>(null);
  const [appliedFormat, setAppliedFormat] = useState<string | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);

  const [sort, setSort] = useState<'update' | 'popular'>('update');
  const [pendingSort, setPendingSort] = useState<'update' | 'popular'>('update');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const currentKeyRef = useRef('');

  const buildPath = useCallback((genre: string | null, format: string | null, status: string | null) => {
    if (genre) return GENRE_PATHS[genre] || DEFAULT_PATH;
    if (format) return FORMAT_PATHS[format] || DEFAULT_PATH;
    if (status) return (STATUS_PATHS[status] || DEFAULT_PATH).replace('orderby=popular', `orderby=${sort}`);
    return DEFAULT_PATH.replace('orderby=popular', `orderby=${sort}`);
  }, [sort]);

  const fetchPage = useCallback(async (
    genre: string | null, format: string | null, status: string | null,
    q: string, pg: number, append: boolean
  ) => {
    const key = `${genre}||${format}||${status}||${q}||${sort}`;
    if (pg === 1) setLoading(true); else setLoadingMore(true);

    try {
      let data: MangaItem[] = [];

      if (q) {
        const res = await fetch(`/api/manga/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        data = json.success ? (json.data || []) : [];
        if (currentKeyRef.current !== key) return;
        setItems(data);
        setHasMore(false);
      } else {
        const basePath = buildPath(genre, format, status);
        const sep = basePath.includes('?') ? '&' : '?';
        const pagePath = pg === 1 ? basePath : `${basePath}${sep}page=${pg}`;
        const res = await fetch(`/api/manga/browse?path=${encodeURIComponent(pagePath)}`);
        const json = await res.json();
        data = json.success ? (json.data?.items || []) : [];
        if (currentKeyRef.current !== key) return;
        if (append) setItems(prev => [...prev, ...data]);
        else setItems(data);
        setHasMore(data.length >= 18);
      }
    } catch {
      if (currentKeyRef.current !== key) return;
      if (!append) setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildPath, sort]);

  // Reset & load page 1 when filters change
  useEffect(() => {
    const key = `${appliedGenre}||${appliedFormat}||${appliedStatus}||${searchQuery}||${sort}`;
    currentKeyRef.current = key;
    setPage(1);
    setHasMore(true);
    setItems([]);
    fetchPage(appliedGenre, appliedFormat, appliedStatus, searchQuery, 1, false);
  }, [appliedGenre, appliedFormat, appliedStatus, searchQuery, fetchPage]);

  // Infinite scroll
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => {
            const next = prev + 1;
            fetchPage(appliedGenre, appliedFormat, appliedStatus, searchQuery, next, true);
            return next;
          });
        }
      },
      { rootMargin: '300px' }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, appliedGenre, appliedFormat, appliedStatus, searchQuery, fetchPage]);

  const openSheet = () => {
    setPendingGenre(appliedGenre);
    setPendingFormat(appliedFormat);
    setPendingStatus(appliedStatus);
    setPendingSort(sort);
    setShowSheet(true);
  };

  const applyFilter = () => {
    setAppliedGenre(pendingGenre);
    setAppliedFormat(pendingFormat);
    setAppliedStatus(pendingStatus);
    setSort(pendingSort);
    setSearch('');
    setSearchQuery('');
    setShowSheet(false);
  };

  const resetFilter = () => {
    setPendingGenre(null);
    setPendingFormat(null);
    setPendingStatus(null);
    setPendingSort('update');
  };

  const tabs = ['Semua', 'Manhwa', 'Manhua', 'Manga'];
  const activeTab = appliedFormat || 'Semua';
  const resetSearch = () => { setSearch(''); setSearchQuery(''); };
  const pickTab = (t: string) => { setAppliedFormat(t === 'Semua' ? null : t); setAppliedStatus(null); resetSearch(); };
  const pickGenre = (g: string) => { setAppliedGenre(appliedGenre === g ? null : g); setAppliedStatus(null); resetSearch(); };
  // Genre/pencarian tidak bisa digabung dengan tipe di server, jadi tipe disaring di sini.
  // Item yang tipenya tidak diketahui tetap ditampilkan.
  const shown = appliedFormat && (appliedGenre || searchQuery)
    ? items.filter(m => !knownType(m) || knownType(m) === appliedFormat)
    : items;

  return (
    <div className="bg-[#1B1A20] min-h-screen text-white max-w-md mx-auto pb-24">
      {/* Pencarian + lonceng */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 12px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: '#2A2931', borderRadius: 99, padding: '14px 18px' }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round"><circle cx={11} cy={11} r={7.5} /><line x1={21} y1={21} x2={16.5} y2={16.5} /></svg>
          <input
            type="text"
            placeholder="Cari manga, manhwa, manhua..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearchQuery(search); }}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setSearchQuery(''); }} aria-label="Hapus"><X className="w-4 h-4 text-gray-500" /></button>
          )}
        </div>
        <button onClick={() => { window.location.assign('/notifikasi'); }} aria-label="Notifikasi" style={{ position: 'relative', background: 'none', border: 0, padding: 8 }}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
          <span style={{ position: 'absolute', top: 6, right: 7, width: 9, height: 9, borderRadius: '50%', background: CORAL }} />
        </button>
      </div>

      {/* Tab tipe */}
      <div style={{ display: 'flex', margin: '0 14px', padding: 5, borderRadius: 99, background: '#25242B', border: '1px solid rgba(255,255,255,.06)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => pickTab(t)} style={{ flex: 1, padding: '10px 0', borderRadius: 99, fontSize: 15, fontWeight: 800, letterSpacing: -0.5, border: 0, background: activeTab === t ? '#18171C' : 'transparent', color: activeTab === t ? '#fff' : MUTED }}>{t}</button>
        ))}
      </div>

      {/* Filter + chip genre */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '16px 14px 4px' }}>
        <button onClick={openSheet} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 99, fontSize: 15, fontWeight: 800, letterSpacing: -0.4, color: '#fff', background: 'transparent', border: '1px solid rgba(255,255,255,.14)' }}>
          <SlidersHorizontal className="w-4 h-4" />Filter
        </button>
        {GENRES.map(g => {
          const on = appliedGenre === g;
          return (
            <button key={g} onClick={() => pickGenre(g)} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 99, fontSize: 15, fontWeight: 800, letterSpacing: -0.4, background: on ? '#F3F2F7' : 'transparent', color: on ? '#1B1A20' : '#fff', border: on ? '1px solid #F3F2F7' : '1px solid rgba(255,255,255,.14)' }}>
              {on && <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1B1A20" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6" /></svg>}
              {g}
            </button>
          );
        })}
      </div>

      {/* Label tipe + urutan */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 14px 18px' }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>{appliedFormat || 'Semua tipe'}</span>
        <button onClick={() => setSort(v => (v === 'update' ? 'popular' : 'update'))} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 0, color: CORAL, fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 20V5M4 9l4-4 4 4" /><path d="M16 4v15M12 15l4 4 4-4" /></svg>
          {SORT_LABEL[sort]}
        </button>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 14px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
            <p className="text-gray-500 text-sm">Memuat komik...</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
            <p className="text-white font-bold">Tidak ada hasil</p>
            <p className="text-gray-500 text-sm">Coba kata kunci, genre, atau tipe lain</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px 10px' }}>
              {shown.map((item, i) => {
                const label = knownType(item) || appliedFormat || 'Komik';
                const ch = chNum(item.chapter);
                return (
                  <Link key={item.link + i} href={`/manga?url=${encodeURIComponent(item.link)}`} style={{ minWidth: 0 }}>
                    <div style={{ position: 'relative', paddingTop: '150%', borderRadius: 22, overflow: 'hidden', background: '#2A2931' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.thumb} alt={item.title} loading="lazy" referrerPolicy="no-referrer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
                        <span style={{ background: 'rgba(20,19,24,.82)', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 7 }}>{label}</span>
                        {isFresh(item.time) && <span style={{ background: CORAL, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 7 }}>BARU</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.5, marginTop: 8, ...clamp2 }}>{item.title}</div>
                    {ch && <div style={{ fontSize: 13, fontWeight: 800, color: MUTED, marginTop: 2 }}>{ch}</div>}
                  </Link>
                );
              })}
            </div>
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
              {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-gray-500" />}
            </div>
          </>
        )}
      </div>

      {/* Bottom Sheet Filter */}
      {showSheet && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSheet(false)} />
          <div className="relative bg-[#2A2931] rounded-t-3xl max-h-[92vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Filter</h2>
              <button onClick={resetFilter} className="text-lg font-extrabold" style={{ color: CORAL }}>Reset</button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-4">
              <h3 className="text-xl font-extrabold text-white mt-4 mb-3">Urutkan</h3>
              <div className="flex rounded-full bg-[#33323A] p-1">
                {([['update', 'Terkini'], ['popular', 'Populer']] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setPendingSort(v)}
                    className={'flex-1 py-3 rounded-full text-lg font-extrabold ' + (pendingSort === v ? 'bg-[#18171C] text-white' : 'text-[#8F94A3]')}
                  >{label}</button>
                ))}
              </div>

              <h3 className="text-xl font-extrabold text-white mt-7 mb-3">Status</h3>
              <div className="flex flex-wrap gap-3">
                {([['Ongoing', 'Berlanjut'], ['Completed', 'Tamat']] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setPendingStatus(pendingStatus === v ? null : v)}
                    className={'px-5 py-2.5 rounded-full border text-lg font-extrabold ' + (pendingStatus === v ? 'bg-[#F3F2F7] text-[#1B1A20] border-[#F3F2F7]' : 'text-white border-white/15')}
                  >{label}</button>
                ))}
              </div>

              <h3 className="text-xl font-extrabold text-white mt-7 mb-3">Format</h3>
              <div className="flex flex-wrap gap-3">
                {['Manhwa', 'Manhua', 'Manga'].map(f => (
                  <button
                    key={f}
                    onClick={() => setPendingFormat(pendingFormat === f ? null : f)}
                    className={'px-5 py-2.5 rounded-full border text-lg font-extrabold ' + (pendingFormat === f ? 'bg-[#F3F2F7] text-[#1B1A20] border-[#F3F2F7]' : 'text-white border-white/15')}
                  >{f}</button>
                ))}
              </div>

              <h3 className="text-xl font-extrabold text-white mt-7 mb-3">Genre</h3>
              <div className="flex flex-wrap gap-3">
                {GENRES.map(g => (
                  <button
                    key={g}
                    onClick={() => setPendingGenre(pendingGenre === g ? null : g)}
                    className={'px-5 py-2.5 rounded-full border text-lg font-extrabold ' + (pendingGenre === g ? 'bg-[#F3F2F7] text-[#1B1A20] border-[#F3F2F7]' : 'text-white border-white/15')}
                  >{g}</button>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/5 flex gap-3 shrink-0">
              <button onClick={() => setShowSheet(false)} className="flex-1 py-4 rounded-full border border-white/15 text-white text-xl font-extrabold">Batal</button>
              <button onClick={applyFilter} className="flex-[2] py-4 rounded-full text-white text-xl font-extrabold" style={{ background: CORAL }}>Tampilkan hasil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
