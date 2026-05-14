import * as cheerio from 'cheerio';
import axios from 'axios';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
};

const BASE_URL = 'https://komikindo.tv';

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
    { title: 'Slice of Life', path: '/genres/slice-of-life/' }
];

export async function scrapeHomeCategories() {
    const fetchCategory = async (cat: {title: string, path: string}) => {
        try {
            const { data } = await axios.get(`${BASE_URL}${cat.path}`, { headers: HEADERS });
            const $ = cheerio.load(data);
            const items: any[] = [];
            $('.animepost').each((i, el) => {
                if(items.length >= 8) return;
                const title = $(el).find('.tt h4').text().trim() || $(el).find('[itemprop="url"]').attr('title');
                const link = $(el).find('a').attr('href');
                const thumb = $(el).find('img').attr('src');
                const desc = 'Score: ' + ($(el).find('.score').text().trim() || 'N/A');
                
                if (title && link && thumb) {
                    items.push({ title, link, thumb: thumb.split('?')[0] || thumb, desc });
                }
            });
            return { category: cat.title, items };
        } catch(e) {
            return { category: cat.title, items: [] };
        }
    };

    const results = await Promise.all(categories.map(fetchCategory));
    return results.filter(r => r.items.length > 0);
}

export async function scrapeHome() {
    // Legacy support, perhaps not needed, but keeping it
    const cats = await scrapeHomeCategories();
    return cats.flatMap(c => c.items);
}

export async function scrapeSearch(query: string) {
    let results: any[] = [];
    
    try {
        const { data } = await axios.get(`${BASE_URL}/?s=${encodeURIComponent(query)}`, { headers: HEADERS });
        const $ = cheerio.load(data);

        $('.animepost').each((i, el) => {
            const title = $(el).find('.tt h4').text().trim() || $(el).find('[itemprop="url"]').attr('title');
            const link = $(el).find('a').attr('href');
            const thumb = $(el).find('img').attr('src');
            const desc = 'Category: Manga/Manhwa';

            if (title && link && thumb) {
                results.push({ title, link, thumb: thumb.split('?')[0] || thumb, desc });
            }
        });
    } catch (err) {
        console.error("Search error:", err);
    }

    const unique = results.filter((v,i,a)=>a.findIndex(t=>(t.link === v.link))===i);
    return unique;
}

export async function scrapeDetail(url: string) {
    // If it's a komikindo.ch url, handle gracefully and replace with komikindo.tv
    const normalizedUrl = url.replace('komikindo.ch', 'komikindo.tv');
    
    // If the old app has links, they might break but home is totally rewritten.
    const { data } = await axios.get(normalizedUrl, { headers: HEADERS });
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
    const normalizedUrl = url.replace('komikindo.ch', 'komikindo.tv');
    const { data } = await axios.get(normalizedUrl, { headers: HEADERS });
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
