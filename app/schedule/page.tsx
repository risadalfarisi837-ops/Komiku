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

  const [pendingGenre, setPendingGenre] = useState<string | null>('Action');
  const [pendingFormat, setPendingFormat] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const [appliedGenre, setAppliedGenre] = useState<string | null>('Action');
  const [appliedFormat, setAppliedFormat] = useState<string | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const currentKeyRef = useRef('');

  const buildPath = useCallback((genre: string | null, format: string | null, status: string | null) => {
    if (genre) return GENRE_PATHS[genre] || DEFAULT_PATH;
    if (format) return FORMAT_PATHS[format] || DEFAULT_PATH;
    if (status) return STATUS_PATHS[status] || DEFAULT_PATH;
    return DEFAULT_PATH;
  }, []);

  const fetchPage = useCallback(async (
    genre: string | null, format: string | null, status: string | null,
    q: string, pg: number, append: boolean
  ) => {
    const key = `${genre}||${format}||${status}||${q}`;
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
  }, [buildPath]);

  // Reset & load page 1 when filters change
  useEffect(() => {
    const key = `${appliedGenre}||${appliedFormat}||${appliedStatus}||${searchQuery}`;
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
    setShowSheet(true);
  };

  const applyFilter = () => {
    setAppliedGenre(pendingGenre);
    setAppliedFormat(pendingFormat);
    setAppliedStatus(pendingStatus);
    setSearch('');
    setSearchQuery('');
    setShowSheet(false);
  };

  const resetFilter = () => {
    setPendingGenre(null);
    setPendingFormat(null);
    setPendingStatus(null);
  };

  const hasActiveFilter = appliedGenre || appliedFormat || appliedStatus;

  return (
    <div className="bg-[#0D0D10] min-h-screen text-white max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0D0D10]/95 backdrop-blur-sm px-4 pt-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#1C1F26] border border-white/10 rounded-2xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearchQuery(search); }}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            {search && (
              <button onClick={() => { setSearch(''); setSearchQuery(''); }}>
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          <button
            onClick={openSheet}
            className={`w-10 h-10 flex items-center justify-center rounded-2xl border shrink-0 transition-colors ${
              hasActiveFilter ? 'bg-[#1C1F26] border-white/20' : 'bg-[#1C1F26] border-white/10'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={openSheet}
            className={`w-10 h-10 flex items-center justify-center rounded-2xl border shrink-0 transition-colors ${
              hasActiveFilter ? 'bg-[#1C1F26] border-white/20' : 'bg-[#1C1F26] border-white/10'
            }`}
          >
            <ChevronDown className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
            <p className="text-gray-500 text-sm">Memuat komik...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <p className="text-white font-bold">Tidak ada hasil</p>
            <p className="text-gray-500 text-sm">Coba kata kunci lain</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {items.map((item, i) => {
                const flag = detectFlag(item.title, item.link);
                const score = item.score && item.score !== 'N/A' ? item.score : null;
                return (
                  <Link key={i} href={`/manga?url=${encodeURIComponent(item.link)}`}>
                    <div className="flex flex-col gap-1.5">
                      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#1C1F26]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumb}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        {/* Bendera negara */}
                        <div className="absolute top-1.5 left-1.5 text-sm leading-none drop-shadow-md">{flag}</div>
                        {/* Rating */}
                        {score && (
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                            <span className="text-[10px] text-yellow-400 font-bold">⭐ {score}</span>
                          </div>
                        )}
                        {item.chapter && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-4">
                            <p className="text-[9px] text-gray-300 font-medium truncate">{item.chapter}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-white text-xs font-semibold line-clamp-2 leading-tight px-0.5">{item.title}</p>
                    </div>
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

      {/* Bottom Sheet — z-[60] supaya di atas navbar z-40 */}
      {showSheet && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSheet(false)} />
          <div className="relative bg-[#13151A] rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-4">
              {/* Genre */}
              <button
                onClick={() => setGenreOpen(v => !v)}
                className="flex items-center justify-between w-full py-4"
              >
                <span className="text-white font-bold text-base">Genre</span>
                {genreOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {genreOpen && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {GENRES.map(g => (
                    <button
                      key={g}
                      onClick={() => setPendingGenre(pendingGenre === g ? null : g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        pendingGenre === g ? 'bg-white text-black border-white' : 'bg-transparent text-gray-300 border-white/20'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}

              {/* Format */}
              <button
                onClick={() => setFormatOpen(v => !v)}
                className="flex items-center justify-between w-full py-4 border-t border-white/5"
              >
                <span className="text-white font-bold text-base">Format</span>
                {formatOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {formatOpen && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {FORMATS.map(f => (
                    <button
                      key={f}
                      onClick={() => setPendingFormat(pendingFormat === f ? null : f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        pendingFormat === f ? 'bg-white text-black border-white' : 'bg-transparent text-gray-300 border-white/20'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {/* Status */}
              <button
                onClick={() => setStatusOpen(v => !v)}
                className="flex items-center justify-between w-full py-4 border-t border-white/5"
              >
                <span className="text-white font-bold text-base">Status</span>
                {statusOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {statusOpen && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setPendingStatus(pendingStatus === s ? null : s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        pendingStatus === s ? 'bg-white text-black border-white' : 'bg-transparent text-gray-300 border-white/20'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/5 flex gap-3 shrink-0">
              <button
                onClick={resetFilter}
                className="flex-1 py-3 rounded-2xl bg-[#1C1F26] text-white font-bold text-sm"
              >
                Reset
              </button>
              <button
                onClick={applyFilter}
                className="flex-1 py-3 rounded-2xl bg-[#4B5563] text-white font-bold text-sm"
              >
                Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
