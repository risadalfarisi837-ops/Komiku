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

// ---------- Detail komik & chapter ----------
// Selector dibuat berlapis (beberapa tema WordPress komik + cadangan umum) karena domain/tema komikindo
// sering berganti. Cek /api/manga/debug?url=<link detail atau chapter> untuk melihat selector mana yang kena.

const cleanUrl = (u: string | undefined) => {
    if (!u) return '';
    let v = u.trim();
    if (!v || v.startsWith('data:') || v === '#') return '';
    if (v.startsWith('//')) v = `https:${v}`;
    return v.startsWith('http') ? v : absUrl(v);
};

const imgSrc = ($img: cheerio.Cheerio<any>) => {
    const attrs = ['data-lazy-src', 'data-src', 'data-original', 'data-cfsrc', 'src'];
    for (const a of attrs) {
        const v = cleanUrl($img.attr(a));
        if (v) return v;
    }
    return '';
};

const textOf = ($: cheerio.CheerioAPI, selectors: string[]) => {
    for (const s of selectors) {
        const t = $(s).first().text().trim();
        if (t) return t;
    }
    return '';
};

const metaOf = ($: cheerio.CheerioAPI, prop: string) =>
    ($(`meta[property="${prop}"]`).attr('content') || $(`meta[name="${prop}"]`).attr('content') || '').trim();

export async function scrapeDetail(url: string) {
    const $ = cheerio.load(await fetchHtml(url));

    const title = (textOf($, ['.entry-title', 'h1']) || metaOf($, 'og:title') || $('title').text())
        .replace(/\s*[-–|]\s*Komik\s*Indo.*$/i, '').trim();

    let thumb = '';
    for (const s of ['.thumb img', '.infoanime img', '.series-thumb img', '.thumbook img', 'article img']) {
        thumb = imgSrc($(s).first());
        if (thumb) break;
    }
    thumb = (thumb || cleanUrl(metaOf($, 'og:image'))).split('?')[0];

    const synopsis = textOf($, ['[itemprop="description"]', '.entry-content-single', '.sinopsis', '.desc', '.entry-content p'])
        || metaOf($, 'og:description') || 'Tidak ada sinopsis.';

    const chapters: { title: string; link: string; date: string }[] = [];
    const seen = new Set<string>();
    const add = (el: any) => {
        const $a = $(el);
        const link = cleanUrl($a.attr('href'));
        const t = ($a.find('.chapternum').text() || $a.text()).replace(/\s+/g, ' ').trim();
        if (!link || !t || seen.has(link)) return;
        seen.add(link);
        const $row = $a.closest('li, .lchx, .chbox, .eph-num').length ? $a.closest('li, .lchx, .chbox, .eph-num') : $a.parent();
        const date = $row.find('.date, .chapterdate, .chapter-date, .dt').first().text().trim();
        chapters.push({ title: t, link, date });
    };

    const chapterSelectors = [
        '.eps_lst .lchx a', '#chapter_list a', '.listeps a', '.lchx a',
        '.chapter-list a', '.eplister li a', '#chapterlist li a',
    ];
    for (const s of chapterSelectors) {
        $(s).each((_, el) => add(el));
        if (chapters.length) break;
    }
    // Cadangan: semua tautan yang jelas menuju chapter
    if (!chapters.length) {
        $('a[href*="chapter"], a[href*="-ch-"]').each((_, el) => add(el));
    }

    if (!chapters.length) {
        throw new Error('Daftar chapter tidak ditemukan. Buka /api/manga/debug?url=<link komik ini> untuk cek selector.');
    }
    return { title, thumb, synopsis, chapters };
}

const isRealPage = (u: string) => /\.(jpe?g|png|webp|avif)(\?|$)/i.test(u) || /wp-content|uploads|cdn|image|img/i.test(u);

function readerImages($: cheerio.CheerioAPI): string[] {
    const found: string[] = [];
    const push = (u: string) => {
        if (u && !/\.gif(\?|$)/i.test(u) && !found.includes(u)) found.push(u);
    };

    // 1) Tema MangaStream: gambar ada di JSON ts_reader.run({...})
    const scripts = $('script').map((_, el) => $(el).html() || '').get();
    for (const sc of scripts) {
        const m = sc.match(/ts_reader\.run\((\{[\s\S]*?\})\);?/);
        if (!m) continue;
        try {
            const json = JSON.parse(m[1]);
            const imgs: string[] = json?.sources?.[0]?.images || [];
            imgs.forEach((u) => push(cleanUrl(u)));
        } catch {}
        if (found.length) return found;
    }

    // 2) Selector area baca (urut dari yang paling spesifik)
    const readerSelectors = [
        '#chimg-auh img', '#chimg img', '.chapter-image img', '#chapter_imgs img',
        '.reader-area img', '#readerarea img', '.imgch img', '.entry-content img',
    ];
    for (const s of readerSelectors) {
        $(s).each((_, el) => push(imgSrc($(el))));
        if (found.length) return found;
    }

    // 3) Cadangan: semua gambar di konten utama, tanpa header/footer/sidebar/iklan
    const $c = cheerio.load($.html());
    $c('header, footer, aside, nav, .sidebar, .widget, .ads, [class*="banner"], [id*="banner"]').remove();
    $c('img').each((_, el) => {
        const u = imgSrc($c(el));
        if (u && isRealPage(u) && !/logo|avatar|icon|banner|emoji/i.test(u)) push(u);
    });
    return found;
}

const hrefOf = ($: cheerio.CheerioAPI, selectors: string[]) => {
    for (const s of selectors) {
        const h = ($(s).first().attr('href') || '').trim();
        if (h && h !== '#' && !h.startsWith('javascript')) return cleanUrl(h);
    }
    return null;
};

export async function scrapeChapter(url: string) {
    const $ = cheerio.load(await fetchHtml(url));

    const title = (textOf($, ['.entry-title', 'h1']) || metaOf($, 'og:title') || $('title').text())
        .replace(/\s*[-–|]\s*Komik\s*Indo.*$/i, '').trim();
    const images = readerImages($);
    if (!images.length) {
        throw new Error('Gambar chapter tidak ditemukan. Buka /api/manga/debug?url=<link chapter ini> untuk cek selector.');
    }

    const prev = hrefOf($, ['.nextprev a[rel="prev"]', 'a[rel="prev"]', '.nextprev a:contains("Sebelumn")', 'a:contains("Chapter Sebelumnya")', '.nextprev a:contains("Prev")']);
    const next = hrefOf($, ['.nextprev a[rel="next"]', 'a[rel="next"]', '.nextprev a:contains("Selanjutny")', 'a:contains("Chapter Selanjutnya")', '.nextprev a:contains("Next")']);
    const mangaLink = hrefOf($, ['.nextprev a:contains("Daftar Chapter")', 'a:contains("Daftar Chapter")', 'a:contains("Semua Chapter")', '.allc a'])
        || (() => {
            // Cadangan: tautan terakhir di breadcrumb yang bukan halaman ini
            const links = $('.breadcrumb a, [itemtype*="BreadcrumbList"] a').map((_, el) => cleanUrl($(el).attr('href'))).get().filter(Boolean);
            return links.length ? links[links.length - 1] : null;
        })();

    const chapterNumber = (title.match(/chapter\s*([\d.]+)/i) || [])[1] || '';

    return { title, chapterNumber, images, prev, next, mangaLink };
}
