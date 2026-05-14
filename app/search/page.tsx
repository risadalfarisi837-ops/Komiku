'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2, BookOpen, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface MangaResult {
    title: string;
    link: string;
    thumb?: string;
    desc?: string;
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
  'Action': '/genre/action/', 'Adaptation': '/genre/adaptation/', 'Adult': '/genre/adult/',
  'Adventure': '/genre/adventure/', 'Comedy': '/genre/comedy/', 'Cooking': '/genre/cooking/',
  'Crime': '/genre/crime/', 'Demon': '/genre/demon/', 'Demons': '/genre/demons/',
  'Drama': '/genre/drama/', 'Ecchi': '/genre/ecchi/', 'Fantasy': '/genre/fantasy/',
  'Fight': '/genre/fight/', 'Game': '/genre/game/', 'Gender Bender': '/genre/gender-bender/',
  'Harem': '/genre/harem/', 'Historical': '/genre/historical/', 'Horror': '/genre/horror/',
  'Isekai': '/genre/isekai/', 'Josei': '/genre/josei/', 'Love': '/genre/love/',
  'Magic': '/genre/magic/', 'Martial Arts': '/genre/martial-arts/', 'Mature': '/genre/mature/',
  'Mecha': '/genre/mecha/', 'Medical': '/genre/medical/', 'Murim': '/genre/murim/',
  'Mystery': '/genre/mystery/', 'Philosophical': '/genre/philosophical/', 'Psychological': '/genre/psychological/',
  'Regression': '/genre/regression/', 'Revenge': '/genre/revenge/', 'Romance': '/genre/romance/',
  'School Life': '/genre/school-life/', 'Sci-fi': '/genre/sci-fi/', 'Seinen': '/genre/seinen/',
  'Shoujo': '/genre/shoujo/', 'Shounen': '/genre/shounen/', 'Slice of Life': '/genre/slice-of-life/',
  'Smut': '/genre/smut/', 'Sports': '/genre/sports/', 'Supernatural': '/genre/supernatural/',
  'Thriller': '/genre/thriller/', 'Tragedy': '/genre/tragedy/', 'Violence': '/genre/violence/',
  'Wuxia': '/genre/wuxia/',
};
const FORMAT_PATHS: Record<string, string> = {
  'Manga': '/type/manga/', 'Manhwa': '/type/manhwa/', 'Manhua': '/type/manhua/',
};
const STATUS_PATHS: Record<string, string> = {
  'Ongoing': '/daftar-manga/?status=ongoing&orderby=popular',
  'Completed': '/daftar-manga/?status=completed&orderby=popular',
};
const DEFAULT_PATH = '/daftar-manga/?orderby=popular';

// Deteksi negara dari title/link
function detectFlag(title: string, link: string): string {
    const t = title.toLowerCase();
    const l = link.toLowerCase();
    // Manhwa = Korea
    if (l.includes('/manhwa/') || l.includes('type/manhwa') || t.includes('manhwa')) return '🇰🇷';
    // Manhua = China
    if (l.includes('/manhua/') || l.includes('type/manhua') || t.includes('manhua')) return '🇨🇳';
    // Manga = Japan (default)
    return '🇯🇵';
}

function buildPath(genre: string | null, format: string | null, status: string | null) {
    if (genre) return GENRE_PATHS[genre] || DEFAULT_PATH;
    if (format) return FORMAT_PATHS[format] || DEFAULT_PATH;
    if (status) return STATUS_PATHS[status] || DEFAULT_PATH;
    return DEFAULT_PATH;
}

// ── Cache helpers (sessionStorage, hilang saat tab ditutup) ──────────────────
const CACHE_TTL = 3 * 60 * 1000; // 3 menit

function cacheGet(key: string): MangaResult[] | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) return null;
        return data;
    } catch { return null; }
}

function cacheSet(key: string, data: MangaResult[]) {
    try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

// Parse HTML komikindo langsung di browser
function parseHtmlToResults(html: string): MangaResult[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const items: MangaResult[] = [];
    const selectors = ['.animepost', '.bs', '.bsx', '.listupd .bs'];
    let els: NodeListOf<Element> | null = null;
    for (const sel of selectors) {
        const found = doc.querySelectorAll(sel);
        if (found.length > 0) { els = found; break; }
    }
    if (!els || els.length === 0) return items;
    els.forEach(el => {
        const title = el.querySelector('.tt h4')?.textContent?.trim()
            || el.querySelector('.tt')?.textContent?.trim()
            || el.querySelector('h3,h4')?.textContent?.trim() || '';
        const anchor = el.querySelector('a') as HTMLAnchorElement;
        const link = anchor?.getAttribute('href') || anchor?.href || '';
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

async function fetchFromUrl(url: string): Promise<string> {
    const PROXIES = [
        (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u: string) => `https://cors-anywhere.herokuapp.com/${u}`,
    ];
    
    // Coba langsung dulu (mungkin tidak perlu proxy)
    try {
        const res = await fetch(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile)' },
            mode: 'cors'
        });
        if (res.ok) return res.text();
    } catch { /* lanjut ke proxy */ }
    
    // Coba tiap proxy
    for (const makeProxy of PROXIES) {
        try {
            const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(10000) });
            if (res.ok) return res.text();
        } catch { /* coba proxy berikutnya */ }
    }
    throw new Error('Semua proxy gagal');
}

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQ = searchParams.get('q') || '';

    const [inputVal, setInputVal] = useState(initialQ);
    const [results, setResults] = useState<MangaResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeQuery, setActiveQuery] = useState(initialQ);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [fetchError, setFetchError] = useState(false);

    // Filter sheet state
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

    const inputRef = useRef<HTMLInputElement>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const fetchResults = useCallback(async (
        q: string, genre: string | null, format: string | null, status: string | null,
        pg: number, append: boolean
    ) => {
        const cacheKey = `search_${q}_${genre}_${format}_${status}_p${pg}`;
        const cached = cacheGet(cacheKey);
        if (cached) {
            if (!append) { setResults(cached); setHasMore(cached.length >= 18); setLoading(false); }
            else { setResults(prev => [...prev, ...cached]); setHasMore(cached.length >= 18); setLoadingMore(false); }
            return;
        }

        if (pg === 1) { setLoading(true); setFetchError(false); } else setLoadingMore(true);
        try {
            let data: MangaResult[] = [];
            if (q.trim()) {
                // Search mode — lewat API route (scraping server side)
                const res = await fetch(`/api/manga/search?q=${encodeURIComponent(q)}`);
                const json = await res.json();
                data = json.success && Array.isArray(json.data) ? json.data : [];
                setHasMore(false);
            } else {
                // Browse/filter mode — fetch langsung dari browser
                const BASE = 'https://komikindo.tv';
                const basePath = buildPath(genre, format, status);
                let url: string;
                if (basePath.includes('?')) {
                    url = pg === 1 ? `${BASE}${basePath}` : `${BASE}${basePath}&page=${pg}`;
                } else {
                    const clean = basePath.endsWith('/') ? basePath : `${basePath}/`;
                    url = pg === 1 ? `${BASE}${clean}` : `${BASE}${clean}page/${pg}/`;
                }
                const html = await fetchFromUrl(url);
                data = parseHtmlToResults(html);
                setHasMore(data.length >= 18);
            }

            cacheSet(cacheKey, data);
            if (append) setResults(prev => [...prev, ...data]);
            else setResults(data);
        } catch {
            if (!append) { setResults([]); setFetchError(true); }
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Mount pertama — langsung fetch Action tanpa nunggu dependency change
    useEffect(() => {
        fetchResults('', 'Action', null, null, 1, false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load hasil saat query/filter berubah
    useEffect(() => {
        setPage(1);
        setFetchError(false);

        if (!activeQuery.trim() && !appliedGenre && !appliedFormat && !appliedStatus) {
            setResults([]);
            setLoading(false);
            return;
        }

        const cacheKey = `search_${activeQuery}_${appliedGenre}_${appliedFormat}_${appliedStatus}_p1`;
        const cached = cacheGet(cacheKey);
        if (cached && cached.length > 0) {
            setResults(cached);
            setLoading(false);
            setHasMore(cached.length >= 18);
            return;
        }

        setResults([]);
        fetchResults(activeQuery, appliedGenre, appliedFormat, appliedStatus, 1, false);
    }, [activeQuery, appliedGenre, appliedFormat, appliedStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    // Infinite scroll
    useEffect(() => {
        observerRef.current?.disconnect();
        if (!hasMore || activeQuery.trim() || (!appliedGenre && !appliedFormat && !appliedStatus)) return;
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                setPage(prev => {
                    const next = prev + 1;
                    fetchResults(activeQuery, appliedGenre, appliedFormat, appliedStatus, next, true);
                    return next;
                });
            }
        }, { rootMargin: '300px' });
        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
        return () => observerRef.current?.disconnect();
    }, [hasMore, loading, loadingMore, activeQuery, appliedGenre, appliedFormat, appliedStatus, fetchResults]);

    const handleSubmit = () => {
        const q = inputVal.trim();
        setActiveQuery(q);
        if (q) router.replace(`/search?q=${encodeURIComponent(q)}`);
        else router.replace('/search');
    };

    const handleApplyFilter = () => {
        setAppliedGenre(pendingGenre);
        setAppliedFormat(pendingFormat);
        setAppliedStatus(pendingStatus);
        setInputVal('');
        setActiveQuery('');
        setShowSheet(false);
    };

    const handleResetFilter = () => {
        setPendingGenre(null);
        setPendingFormat(null);
        setPendingStatus(null);
    };

    const hasFilter = appliedGenre || appliedFormat || appliedStatus;

    return (
        <div className="min-h-screen bg-[#0D0D10] text-white pb-28 max-w-md mx-auto">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#0D0D10]/95 backdrop-blur-sm px-4 pt-0 pb-3 space-y-3">
                <div className="flex items-center gap-2 pt-3">
                    <div className="flex-1 flex items-center gap-2 bg-[#1C1F26] border border-white/10 rounded-2xl px-4 py-2.5">
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search..."
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                            className="bg-transparent outline-none text-white flex-1 text-sm placeholder-gray-500"
                        />
                        {inputVal && (
                            <button onClick={() => { setInputVal(''); setActiveQuery(''); router.replace('/search'); }}>
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                    </div>
                    <button
                        className={`w-10 h-10 flex items-center justify-center rounded-2xl border shrink-0 ${hasFilter ? 'bg-[#1C1F26] border-white/20' : 'bg-[#1C1F26] border-white/10'}`}
                        onClick={() => setShowSheet(true)}
                    >
                        <SlidersHorizontal className="w-4 h-4 text-gray-300" />
                    </button>
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#1C1F26] border border-white/10 shrink-0"
                        onClick={handleSubmit}
                    >
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Active filter chips */}
                {hasFilter && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {appliedGenre && <span className="px-3 py-1 rounded-full bg-[#1C1F26]/20 border border-white/20/30 text-xs text-gray-400 font-semibold">{appliedGenre}</span>}
                        {appliedFormat && <span className="px-3 py-1 rounded-full bg-[#1C1F26]/20 border border-white/20/30 text-xs text-gray-400 font-semibold">{appliedFormat}</span>}
                        {appliedStatus && <span className="px-3 py-1 rounded-full bg-[#1C1F26]/20 border border-white/20/30 text-xs text-gray-400 font-semibold">{appliedStatus}</span>}
                        <button onClick={() => { setAppliedGenre(null); setAppliedFormat(null); setAppliedStatus(null); setPendingGenre(null); setPendingFormat(null); setPendingStatus(null); }} className="text-xs text-gray-500 underline">Reset</button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-4 pt-2">
                {loading && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                        <p className="text-sm text-[#8F94A3]">Memuat komik...</p>
                    </div>
                )}

                {!loading && results.length === 0 && !fetchError && activeQuery.trim() && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <BookOpen className="w-12 h-12 text-[#8F94A3]" />
                        <p className="text-sm font-bold text-white">Tidak ada hasil</p>
                        <p className="text-xs text-[#8F94A3]">Coba kata kunci lain</p>
                    </div>
                )}

                {!loading && results.length === 0 && !fetchError && !activeQuery.trim() && !appliedGenre && !appliedFormat && !appliedStatus && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Search className="w-12 h-12 text-[#8F94A3]" />
                        <p className="text-sm font-bold text-white">Cari komik favorit kamu</p>
                        <p className="text-xs text-[#8F94A3]">Atau pilih filter untuk browse</p>
                    </div>
                )}

                {!loading && results.length === 0 && !fetchError && !activeQuery.trim() && (appliedGenre || appliedFormat || appliedStatus) && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <BookOpen className="w-12 h-12 text-[#8F94A3]" />
                        <p className="text-sm font-bold text-white">Tidak ada komik ditemukan</p>
                        <p className="text-xs text-[#8F94A3]">Coba filter lain</p>
                    </div>
                )}

                {!loading && fetchError && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <BookOpen className="w-12 h-12 text-red-400/60" />
                        <p className="text-sm font-bold text-white">Gagal memuat komik</p>
                        <p className="text-xs text-[#8F94A3]">Periksa koneksi internet kamu</p>
                        <button
                            onClick={() => fetchResults(activeQuery, appliedGenre, appliedFormat, appliedStatus, 1, false)}
                            className="mt-2 px-5 py-2 rounded-xl bg-[#1C1F26] border border-white/10 text-sm text-white font-semibold"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {results.map((item, i) => {
                            const flag = detectFlag(item.title, item.link);
                            const score = item.score && item.score !== 'N/A' ? item.score : null;
                            return (
                                <Link key={i} href={`/manga?url=${encodeURIComponent(item.link)}`}>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#1C1F26]">
                                            {item.thumb ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.thumb} alt={item.title} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="w-6 h-6 text-[#8F94A3]" />
                                                </div>
                                            )}
                                            {/* Bendera negara */}
                                            <div className="absolute top-1.5 left-1.5 text-sm leading-none drop-shadow-md">{flag}</div>
                                            {/* Rating */}
                                            {score && (
                                                <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                                                    <span className="text-[10px] text-yellow-400 font-bold">⭐ {score}</span>
                                                </div>
                                            )}
                                            {/* Chapter latest */}
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
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-4" />
                {loadingMore && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    </div>
                )}
            </div>

            {/* Filter bottom sheet */}
            {showSheet && (
                <div className="fixed inset-0 z-50" onClick={() => setShowSheet(false)}>
                    <div className="absolute inset-0 bg-black/50" />
                    <div
                        className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1C1F26] rounded-t-2xl max-h-[85vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Genre */}
                        <div className="px-4 py-3 border-b border-white/5">
                            <button className="w-full flex justify-between items-center" onClick={() => setGenreOpen(v => !v)}>
                                <span className="font-bold text-white">Genre</span>
                                {genreOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>
                            {genreOpen && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {GENRES.map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setPendingGenre(pendingGenre === g ? null : g)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${pendingGenre === g ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20'}`}
                                        >{g}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Format */}
                        <div className="px-4 py-3 border-b border-white/5">
                            <button className="w-full flex justify-between items-center" onClick={() => setFormatOpen(v => !v)}>
                                <span className="font-bold text-white">Format</span>
                                {formatOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>
                            {formatOpen && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {FORMATS.map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setPendingFormat(pendingFormat === f ? null : f)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${pendingFormat === f ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20'}`}
                                        >{f}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div className="px-4 py-3">
                            <button className="w-full flex justify-between items-center" onClick={() => setStatusOpen(v => !v)}>
                                <span className="font-bold text-white">Status</span>
                                {statusOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>
                            {statusOpen && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {STATUSES.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setPendingStatus(pendingStatus === s ? null : s)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${pendingStatus === s ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20'}`}
                                        >{s}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 px-4 py-4 border-t border-white/5">
                            <button onClick={handleResetFilter} className="flex-1 py-3 rounded-2xl bg-[#0D0D10] text-white font-semibold text-sm">Reset</button>
                            <button onClick={handleApplyFilter} className="flex-[2] py-3 rounded-2xl bg-[#2A2D35] text-white font-semibold text-sm">Filter</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col justify-center items-center min-h-screen bg-[#0D0D10] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
                <p className="text-sm text-[#8F94A3]">Memuat...</p>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
