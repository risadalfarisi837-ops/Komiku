// Data layer pakai API resmi MangaDex v5 (https://api.mangadex.org). Tanpa scraping.
// Bentuk data yang dikembalikan sama dengan scraper lama supaya halaman frontend tidak perlu diubah.

const API = 'https://api.mangadex.org';
const COVERS = 'https://uploads.mangadex.org/covers';
const SITE = 'https://mangadex.org';

// Bahasa chapter yang dicari, urut prioritas (id lebih dulu, lalu en). Bisa diganti lewat env MANGADEX_LANGS, mis. "id,en".
const LANGS = (process.env.MANGADEX_LANGS || 'id').split(',').map((s) => s.trim()).filter(Boolean);
const RATINGS = ['safe', 'suggestive'];
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

type Params = Record<string, string | number | string[] | undefined>;

// ---------- Fetch dengan antrean (batas MangaDex ±5 request/detik) ----------
let chain: Promise<void> = Promise.resolve();
const GAP_MS = 230;

function throttle(): Promise<void> {
    const prev = chain;
    let release!: () => void;
    chain = new Promise<void>((r) => { release = r; });
    return prev.then(() => new Promise<void>((r) => setTimeout(() => { release(); r(); }, GAP_MS)));
}

function buildQuery(params: Params) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === '') continue;
        if (Array.isArray(v)) v.forEach((x) => q.append(k.endsWith('[]') ? k : `${k}[]`, x));
        else q.append(k, String(v));
    }
    return q.toString();
}

async function md<T = any>(path: string, params: Params = {}, tries = 3): Promise<T> {
    const qs = buildQuery(params);
    const url = `${API}${path}${qs ? `?${qs}` : ''}`;
    let lastErr = 'Gagal menghubungi MangaDex';
    for (let i = 0; i < tries; i++) {
        await throttle();
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'komiku-app/1.0', Accept: 'application/json' },
                cache: 'no-store',
            });
            if (res.status === 429) {
                const wait = Number(res.headers.get('x-ratelimit-retry-after')) ;
                const ms = wait ? Math.max(wait * 1000 - Date.now(), 500) : 1200 * (i + 1);
                await new Promise((r) => setTimeout(r, Math.min(ms, 5000)));
                lastErr = 'MangaDex membatasi request, coba lagi sebentar';
                continue;
            }
            const json: any = await res.json().catch(() => null);
            if (!res.ok || !json || json.result === 'error') {
                lastErr = json?.errors?.[0]?.detail || `MangaDex membalas ${res.status}`;
                if (res.status >= 500) continue;
                throw new Error(lastErr);
            }
            return json as T;
        } catch (e: any) {
            lastErr = e?.message || lastErr;
            if (i === tries - 1) throw new Error(lastErr);
        }
    }
    throw new Error(lastErr);
}

// ---------- Helper ----------
export const mangaLinkOf = (id: string) => `${SITE}/title/${id}`;
export const chapterLinkOf = (id: string) => `${SITE}/chapter/${id}`;

export function idFromLink(link: string): string {
    const m = (link || '').match(UUID_RE);
    if (!m) throw new Error('Link tidak valid atau masih link lama (komikindo). Buka ulang dari daftar komik.');
    return m[0].toLowerCase();
}

const pick = (obj: Record<string, string> | undefined, langs: string[]) => {
    if (!obj) return '';
    for (const l of langs) if (obj[l]) return obj[l];
    return Object.values(obj)[0] || '';
};

const typeOf = (lang: string) => (lang === 'ko' ? 'Manhwa' : lang === 'zh' || lang === 'zh-hk' ? 'Manhua' : lang === 'ja' ? 'Manga' : '');

function coverOf(m: any, size: 256 | 512 | 0 = 512) {
    const rel = (m.relationships || []).find((r: any) => r.type === 'cover_art');
    const file = rel?.attributes?.fileName;
    if (!file) return '';
    // Lewat /api/img (server) karena MangaDex diblokir sebagian ISP di Indonesia, jadi tidak bisa dimuat langsung dari browser
    const direct = `${COVERS}/${m.id}/${file}${size ? `.${size}.jpg` : ''}`;
    return `/api/img?url=${encodeURIComponent(direct)}`;
}

function titleOf(m: any) {
    const a = m.attributes || {};
    return (
        a.title?.en
        || pick(a.title, ['id', 'ja-ro'])
        || (a.altTitles || []).map((t: any) => t.en || t.id).find(Boolean)
        || ''
    );
}

function timeAgo(iso?: string) {
    if (!iso) return '';
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'baru saja';
    const units: [number, string][] = [[60, 'menit'], [3600, 'jam'], [86400, 'hari'], [604800, 'minggu'], [2592000, 'bulan'], [31536000, 'tahun']];
    let label = 'menit', div = 60;
    for (const [d, l] of units) { if (s >= d) { label = l; div = d; } }
    return `${Math.floor(s / div)} ${label} yang lalu`;
}

// ---------- Daftar manga -> kartu ----------
const LIST_BASE: Params = {
    'includes[]': ['cover_art'],
    'contentRating[]': RATINGS,
    'availableTranslatedLanguage[]': LANGS,
    hasAvailableChapters: 'true',
};

const readableCache = new Map<string, { ok: boolean; t: number }>();

async function hasReadable(id: string): Promise<boolean> {
    const c = readableCache.get(id);
    if (c && Date.now() - c.t < 3600_000) return c.ok;
    let ok = true;
    try {
        const json = await md(`/manga/${id}/feed`, {
            'translatedLanguage[]': LANGS,
            'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic'],
            includeExternalUrl: 0,
            limit: 3,
        });
        ok = (json.data || []).some((c: any) => c.attributes?.pages > 0);
    } catch { ok = true; }
    readableCache.set(id, { ok, t: Date.now() });
    return ok;
}

async function filterReadable(list: any[], chMap: Record<string, any>) {
    const keep = await Promise.all(list.map(async (m) => {
        const l = chMap[m.attributes?.latestUploadedChapter];
        if (l && l.pages > 0 && !l.externalUrl && LANGS.includes(l.translatedLanguage)) return true;
        return hasReadable(m.id);
    }));
    return list.filter((_, i) => keep[i]);
}

// Tambahkan skor, jumlah follow, dan chapter terbaru ke tiap manga (2 request batch untuk seluruh daftar).
async function toCards(list: any[]) {
    if (!list.length) return [];
    const ids = list.map((m) => m.id);
    const latestIds = list.map((m) => m.attributes?.latestUploadedChapter).filter(Boolean);

    const [stats, chapters] = await Promise.all([
        md('/statistics/manga', { 'manga[]': ids }).catch(() => null),
        latestIds.length
            ? md('/chapter', { 'ids[]': latestIds, limit: 100, 'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic'] }).catch(() => null)
            : Promise.resolve(null),
    ]);
    const chMap: Record<string, any> = {};
    (chapters?.data || []).forEach((c: any) => { chMap[c.id] = c.attributes; });

    const shown = await filterReadable(list, chMap);
    return shown.map((m) => {
        const st = stats?.statistics?.[m.id];
        const rating = st?.rating?.bayesian;
        const score = rating ? rating.toFixed(1) : 'N/A';
        const last = chMap[m.attributes?.latestUploadedChapter];
        return {
            title: titleOf(m),
            link: mangaLinkOf(m.id),
            thumb: coverOf(m),
            desc: `Score: ${score}`,
            score,
            type: typeOf(m.attributes?.originalLanguage),
            chapter: last?.chapter ? `Chapter ${last.chapter}` : '',
            time: timeAgo(last?.publishAt),
            views: st?.follows ? String(st.follows) : '',
        };
    }).filter((c) => c.title && c.thumb);
}

// ---------- Tag / genre ----------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
let tagCache: Record<string, string> | null = null;

async function getTags() {
    if (tagCache) return tagCache;
    const json = await md('/manga/tag');
    const map: Record<string, string> = {};
    (json.data || []).forEach((t: any) => { if (t.attributes?.name?.en) map[norm(t.attributes.name.en)] = t.id; });
    tagCache = map;
    return map;
}

const DEMOGRAPHICS = ['shounen', 'shoujo', 'josei', 'seinen'];
const TAG_ALIAS: Record<string, string> = {
    game: 'videogames', love: 'romance', fight: 'martialarts', murim: 'martialarts',
    demon: 'demons', regression: 'reincarnation',
};

export type BrowseFilter = {
    genre?: string;           // slug, mis. "action", "school-life"
    type?: string;            // manga | manhwa | manhua
    status?: string;          // ongoing | completed
    order?: 'popular' | 'update';
    title?: string;
    page?: number;
    limit?: number;
};

const ORIGIN_LANG: Record<string, string[]> = { manga: ['ja'], manhwa: ['ko'], manhua: ['zh', 'zh-hk'] };

async function queryManga(f: BrowseFilter) {
    const limit = f.limit || 24;
    const page = Math.max(1, f.page || 1);
    const params: Params = { ...LIST_BASE, limit, offset: (page - 1) * limit };

    if (f.title) {
        params.title = f.title;
        params['order[relevance]'] = 'desc';
    } else if (f.order === 'update') {
        params['order[latestUploadedChapter]'] = 'desc';
    } else {
        params['order[followedCount]'] = 'desc';
    }

    if (f.type && ORIGIN_LANG[f.type]) params['originalLanguage[]'] = ORIGIN_LANG[f.type];
    if (f.status === 'ongoing' || f.status === 'completed') params['status[]'] = [f.status];

    if (f.genre) {
        const key = norm(f.genre);
        if (DEMOGRAPHICS.includes(key)) {
            params['publicationDemographic[]'] = [key];
        } else {
            const tags = await getTags();
            const id = tags[TAG_ALIAS[key] || key];
            if (!id) return { list: [] as any[], total: 0, limit, page };
            params['includedTags[]'] = [id];
        }
    }

    const json = await md('/manga', params);
    return { list: json.data || [], total: json.total || 0, limit, page };
}

export async function browse(f: BrowseFilter) {
    const { list, total, limit, page } = await queryManga(f);
    const items = await toCards(list);
    return { items, hasMore: page * limit < total, total, page };
}

export async function searchManga(q: string) {
    const { list } = await queryManga({ title: q, limit: 40 });
    return toCards(list);
}

// ---------- Home ----------
const HOME_CATEGORIES = [
    'Action', 'Romance', 'Fantasy', 'Comedy', 'Isekai', 'Drama', 'Shounen', 'School Life',
    'Adventure', 'Mystery', 'Horror', 'Magic', 'Seinen', 'Martial Arts', 'Slice of Life',
];

export async function homeCategories() {
    const raw: { category: string; list: any[] }[] = [];
    for (const title of HOME_CATEGORIES) {
        try {
            const { list } = await queryManga({ genre: title, limit: 8 });
            raw.push({ category: title, list });
        } catch {
            raw.push({ category: title, list: [] });
        }
    }
    // Skor & chapter terbaru diambil sekali untuk semua kategori supaya request tetap sedikit
    const all = Array.from(new Map(raw.flatMap((r) => r.list).map((m) => [m.id, m])).values());
    const cards = await toCards(all);
    const byLink = new Map(cards.map((c) => [c.link, c]));
    return raw
        .map((r) => ({ category: r.category, items: r.list.map((m) => byLink.get(mangaLinkOf(m.id))).filter(Boolean) as any[] }))
        .filter((r) => r.items.length > 0);
}

// ---------- Chapter list (urutan: terbaru -> terlama) ----------
type Ch = { id: string; num: string; lang: string; pages: number; title: string; publishAt: string };

async function fetchFeed(mangaId: string, langs: string[]): Promise<Ch[]> {
    const out: Ch[] = [];
    const limit = 500;
    let offset = 0;
    for (let guard = 0; guard < 10; guard++) {
        const json = await md(`/manga/${mangaId}/feed`, {
            'translatedLanguage[]': langs,
            'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic'],
            includeExternalUrl: 0,
            'order[chapter]': 'desc',
            limit,
            offset,
        });
        for (const c of json.data || []) {
            const a = c.attributes || {};
            if (!a.pages) continue; // chapter eksternal / kosong tidak punya halaman
            out.push({ id: c.id, num: a.chapter ?? '', lang: a.translatedLanguage, pages: a.pages, title: a.title || '', publishAt: a.publishAt || a.readableAt || '' });
        }
        offset += limit;
        if (offset >= (json.total || 0)) break;
    }
    return out;
}

// Satu entri per nomor chapter; bahasa yang lebih awal di LANGS diprioritaskan.
function dedupe(chs: Ch[]): Ch[] {
    const best = new Map<string, Ch>();
    for (const c of chs) {
        const key = c.num === '' ? `oneshot-${c.id}` : c.num;
        const cur = best.get(key);
        const rank = (x: Ch) => { const i = LANGS.indexOf(x.lang); return i === -1 ? 99 : i; };
        if (!cur || rank(c) < rank(cur) || (rank(c) === rank(cur) && c.pages > cur.pages)) best.set(key, c);
    }
    const arr = Array.from(best.values());
    arr.sort((a, b) => (parseFloat(b.num) || 0) - (parseFloat(a.num) || 0));
    return arr;
}

async function findOfficialUrl(id: string, m: any): Promise<string> {
    try {
        const json = await md('/chapter', { manga: id, limit: 1, 'order[chapter]': 'desc', 'translatedLanguage[]': LANGS, 'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic'] });
        const ext = (json.data || []).map((c: any) => c.attributes?.externalUrl).find(Boolean);
        if (ext) return ext;
    } catch { }
    const l = m?.attributes?.links || {};
    return l.raw || l.engtl || l.amz || l.ebj || `${SITE}/title/${id}`;
}

function extraInfo(m: any, st: any) {
    const rels: any[] = m.relationships || [];
    const names = (t: string) => Array.from(new Set(rels.filter((r) => r.type === t).map((r) => r.attributes?.name).filter(Boolean))).join(', ');
    const orig = m.attributes?.originalLanguage;
    const genres = (m.attributes?.tags || [])
        .filter((t: any) => ['genre', 'theme'].includes(t.attributes?.group))
        .map((t: any) => t.attributes?.name?.en)
        .filter(Boolean);
    const nativeTitle = (m.attributes?.altTitles || []).map((t: any) => t[orig]).find(Boolean) || '';
    const rating = st?.rating?.bayesian;
    return {
        status: m.attributes?.status || '',
        type: typeOf(orig) || 'Manga',
        genres,
        author: names('author'),
        artist: names('artist'),
        nativeTitle,
        rating: rating ? Number(rating.toFixed(1)) : null,
        follows: st?.follows ?? null,
    };
}

export async function getDetail(url: string) {
    const id = idFromLink(url);
    const [mangaRes, feed, statsRes] = await Promise.all([
        md(`/manga/${id}`, { 'includes[]': ['cover_art', 'author', 'artist'] }),
        fetchFeed(id, LANGS),
        md(`/statistics/manga/${id}`).catch(() => null),
    ]);
    const m = mangaRes.data;
    const chapters = dedupe(feed).map((c) => ({
        title: c.num ? `Chapter ${c.num}${c.title ? ` - ${c.title}` : ''}` : (c.title || 'Oneshot'),
        link: chapterLinkOf(c.id),
        date: timeAgo(c.publishAt),
        num: c.num,
        at: c.publishAt || '',
        pages: c.pages,
    }));
    if (!chapters.length) {
        const err: any = new Error('Komik ini cuma tersedia di situs resmi dan tidak bisa dibaca di sini.');
        readableCache.set(id, { ok: false, t: Date.now() });
        err.officialUrl = await findOfficialUrl(id, m);
        throw err;
    }
    return {
        title: titleOf(m),
        thumb: coverOf(m),
        synopsis: pick(m.attributes?.description, ['id', 'en']) || 'Tidak ada sinopsis.',
        chapters,
        ...extraInfo(m, statsRes?.statistics?.[id]),
    };
}

// ---------- Chapter (gambar + prev/next) ----------
// Daftar nomor chapter untuk prev/next. Pakai endpoint aggregate (1 request kecil) dan disimpan sebentar di memori,
// jauh lebih cepat daripada mengunduh seluruh feed chapter setiap kali membuka chapter.
type NavItem = { num: string; ids: string[] };
const navCache = new Map<string, { t: number; list: NavItem[] }>();
async function navList(mangaId: string, lang: string, fresh = false): Promise<NavItem[]> {
    const key = `${mangaId}:${lang}`;
    const hit = navCache.get(key);
    if (!fresh && hit && Date.now() - hit.t < 5 * 60_000) return hit.list;
    const json: any = await md(`/manga/${mangaId}/aggregate`, { 'translatedLanguage[]': [lang] });
    const list: NavItem[] = [];
    for (const vol of Object.values<any>(json.volumes || {})) {
        for (const c of Object.values<any>(vol?.chapters || {})) {
            list.push({ num: String(c.chapter ?? ''), ids: [c.id, ...(Array.isArray(c.others) ? c.others : [])] });
        }
    }
    list.sort((x, y) => (parseFloat(x.num) || 0) - (parseFloat(y.num) || 0)); // terlama -> terbaru
    navCache.set(key, { t: Date.now(), list });
    if (navCache.size > 200) navCache.delete(navCache.keys().next().value as string);
    return list;
}

export async function getChapter(url: string) {
    const id = idFromLink(url);
    const [chRes, server] = await Promise.all([
        md(`/chapter/${id}`, { 'includes[]': ['manga'] }),
        md(`/at-home/server/${id}`),
    ]);
    const ch = chRes.data;
    const a = ch.attributes || {};
    const mangaRel = (ch.relationships || []).find((r: any) => r.type === 'manga');
    const mangaId: string | undefined = mangaRel?.id;
    const mangaTitle = mangaRel?.attributes ? titleOf(mangaRel) : '';

    const base: string = server.baseUrl;
    const hash: string = server.chapter?.hash;
    const files: string[] = server.chapter?.data || [];
    const images = files.map((f) => `${base}/data/${hash}/${f}`);
    if (!images.length) throw new Error('Gambar chapter tidak tersedia.');

    // prev/next: ambil daftar chapter manga ini dalam bahasa yang sama dengan chapter yang dibuka
    let prev: string | null = null;
    let next: string | null = null;
    if (mangaId) {
        try {
            let list = await navList(mangaId, a.translatedLanguage);
            let i = list.findIndex((c) => c.ids.includes(id));
            if (i === -1) { list = await navList(mangaId, a.translatedLanguage, true); i = list.findIndex((c) => c.ids.includes(id)); }
            if (i !== -1) {
                if (i > 0) prev = chapterLinkOf(list[i - 1].ids[0]);
                if (i < list.length - 1) next = chapterLinkOf(list[i + 1].ids[0]);
            } else {
                // cadangan: cara lama lewat feed penuh
                const feed = await fetchFeed(mangaId, [a.translatedLanguage]);
                const full = dedupe(feed).reverse(); // terlama -> terbaru
                const j = full.findIndex((c) => c.id === id);
                if (j > 0) prev = chapterLinkOf(full[j - 1].id);
                if (j !== -1 && j < full.length - 1) next = chapterLinkOf(full[j + 1].id);
            }
        } catch { /* navigasi opsional, jangan gagalkan chapter */ }
    }

    const chapterNumber = a.chapter ?? '';
    const title = mangaTitle
        ? `${mangaTitle} Chapter ${chapterNumber || a.title || ''}`.trim()
        : `Chapter ${chapterNumber}`.trim();

    return {
        title,
        chapterNumber,
        mangaTitle,
        images,
        prev,
        next,
        mangaLink: mangaId ? mangaLinkOf(mangaId) : null,
    };
}
