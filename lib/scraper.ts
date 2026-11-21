import * as cheerio from 'cheerio';
import axios from 'axios';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
    'Accept-Language': 'id,en;q=0.8',
};

// Domain komikindo sering ganti/diblokir. Atur domain utama lewat env KOMIKINDO_URL di Vercel,
// sisanya dicoba berurutan sebagai cadangan.
const CANDIDATES: string[] = [
    process.env.KOMIKINDO_URL || '',
    'https://komikindo.cv',
    'https://komikindo.dev',
    'https://komikindo.ch',
    'https://komikindo.tv',
].filter(Boolean).map((u) => u.replace(/\/+$/, ''));

let workingBase: string | null = null;
export const getBase = () => workingBase || CANDIDATES[0];
export const getCandidates = () => CANDIDATES;

// Ambil HTML dari path (/genres/action/) atau URL penuh. Coba domain satu per satu sampai berhasil.
export async function fetchHtml(pathOrUrl: string): Promise<string> {
    let path = pathOrUrl;
    if (/^https?:\/\//i.test(pathOrUrl)) {
        try { const u = new URL(pathOrUrl); path = u.pathname + u.search; } catch {}
    }
    const bases = workingBase ? [workingBase, ...CANDIDATES.filter((b) => b !== workingBase)] : CANDIDATES;
    let lastErr: any = null;
    for (const base of bases) {
        try {
            const { data } = await axios.get(base + path, { headers: HEADERS, timeout: 12000, maxRedirects: 5 });
            if (typeof data === 'string' && data.length > 2000) { workingBase = base; return data; }
        } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('Semua domain komikindo gagal diakses');
}

const absUrl = (href: string | undefined) => {
    if (!href) return '';
    return href.startsWith('http') ? href : `${getBase()}${href.startsWith('/') ? '' : '/'}${href}`;
};

// Baca kartu komik dari halaman daftar (home, genre, tipe, pencarian). Selector dibuat longgar
// supaya tahan beda tema.
export function parseCards($: cheerio.CheerioAPI, limit = 100) {
    const items: any[] = [];
    const sel = ['.animepost', '.bs', '.bsx'].find((s) => $(s).length > 0);
    if (!sel) return items;
    $(sel).each((_, el) => {
        if (items.length >= limit) return;
        const $el = $(el);
        const first = (...selectors: string[]) => {
            for (const s of selectors) {
                const t = $el.find(s).first().text().trim();
                if (t) return t;
            }
            return '';
        };
        const title = first('.tt h4', '.tt', 'h3', 'h4') || $el.find('a[title]').first().attr('title') || '';
        const link = absUrl($el.find('a').first().attr('href'));
        const img = $el.find('img').first();
        let thumb = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('src') || '';
        if (thumb.startsWith('data:')) thumb = img.attr('data-src') || '';
        thumb = thumb.split('?')[0];
        if (!title || !link || !thumb) return;

        const score = first('.score', '.numscore', '.rating i') || 'N/A';
        const cls = ($el.find('.typeflag').attr('class') || $el.find('.type').attr('class') || '').toLowerCase();
        const typeTxt = first('.type').toLowerCase();
        const raw = `${cls} ${typeTxt}`;
        const type = raw.includes('manhwa') ? 'Manhwa' : raw.includes('manhua') ? 'Manhua' : raw.includes('manga') ? 'Manga' : '';
        items.push({
            title, link, thumb,
            desc: `Score: ${score}`,
            score,
            type,
            chapter: first('.lsch a', '.epxs', '.eps', '.ep', '.chapter'),
            time: first('.datech', '.date', '.epxdate'),
            views: first('.view', '.vw'),
        });
    });
    return items;
}

const categories = [
    { title: 'Action', path: '/genres/action/' },
    { title: 'Romance', path: '/genres/romance/' },
    { title: 'Fantasy', path: '/genres/fantasy/' },
    { title: 'Comedy', path: '/genres/comedy/' },
    { title: 'Isekai', path: '/genres/isekai/' },
    { title: 'Drama', path: '/genres/drama/' },
    { title: 'Shounen', path: '/genres/shounen/' },
    { title: 'School Life', path: '/genres/school-life/' },
    { title: 'Adventure', path: '/genres/adventure/' },
    { title: 'Mystery', path: '/genres/mystery/' },
    { title: 'Horror', path: '/genres/horror/' },
    { title: 'Magic', path: '/genres/magic/' },
    { title: 'Seinen', path: '/genres/seinen/' },
    { title: 'Martial Arts', path: '/genres/martial-arts/' },
    { title: 'Slice of Life', path: '/genres/slice-of-life/' },
];

export async function scrapeHomeCategories() {
    const fetchCategory = async (cat: { title: string; path: string }) => {
        try {
            const $ = cheerio.load(await fetchHtml(cat.path));
            return { category: cat.title, items: parseCards($, 8) };
        } catch {
            return { category: cat.title, items: [] as any[] };
        }
    };
    const results = await Promise.all(categories.map(fetchCategory));
    return results.filter((r) => r.items.length > 0);
}

export async function scrapeHome() {
    const cats = await scrapeHomeCategories();
    return cats.flatMap((c) => c.items);
}

export async function scrapeSearch(query: string) {
    try {
        const $ = cheerio.load(await fetchHtml(`/?s=${encodeURIComponent(query)}`));
        const results = parseCards($, 60).map((m) => ({ ...m, desc: 'Category: Manga/Manhwa' }));
        return results.filter((v, i, a) => a.findIndex((t) => t.link === v.link) === i);
    } catch (err) {
        console.error('Search error:', err);
        return [];
    }
}

export async function scrapeDetail(url: string) {
    // If it's a komikindo.ch url, handle gracefully and replace with komikindo.tv
    const normalizedUrl = url;
    
    // If the old app has links, they might break but home is totally rewritten.
    const data = await fetchHtml(normalizedUrl);
    const $ = cheerio.load(data);
    
    // Parse komikindo.ch details
    const title = $('.entry-title').text().trim() || $('title').text().trim();
    const thumb = $('.thumb img').attr('src');
    const synopsis = $('[itemprop="description"]').text().trim() || 'Tidak ada sinopsis.';
    
    let chapters: any[] = [];
    
    $('.eps_lst .lchx a').each((i, el) => {
        const chapterTitle = $(el).text().trim();
        const chapterLink = $(el).attr('href');
        const chapterDate = $(el).parent().find('.date').text().trim() || '';
        
        if (chapterTitle && chapterLink) {
            chapters.push({ title: chapterTitle, link: chapterLink, date: chapterDate });
        }
    });
    
    return {
        title,
        thumb: thumb?.split('?')[0] || thumb,
        synopsis,
        chapters,
    };
}

export async function scrapeChapter(url: string) {
    const normalizedUrl = url;
    const data = await fetchHtml(normalizedUrl);
    const $ = cheerio.load(data);
    
    const title = $('.entry-title').text().trim() || $('title').text().trim();
    const images: string[] = [];
    $('.chapter-image img, #chimg img, #chapter_imgs img, .reader-area img').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.startsWith('http')) {
            // Filter out ads which are mostly GIF formats
            if (!src.toLowerCase().includes('.gif')) {
                images.push(src);
            }
        }
    });

    const prev = $('.nextprev a:contains("Sebelumn")').attr('href');
    const next = $('.nextprev a:contains("Selanjutny")').attr('href');
    const mangaLink = $('.nextprev a:contains("Daftar Chapter")').attr('href');

    return {
        title,
        images,
        prev: prev || null,
        next: next || null,
        mangaLink: mangaLink || null,
    };
}
