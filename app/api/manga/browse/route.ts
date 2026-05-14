import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
const BASE_URL = 'https://komikindo.tv';
const PER_PAGE = 18;

const FORMAT_PATHS: Record<string, string> = {
    '/type/manga/': '/type/manga/',
    '/type/manhwa/': '/type/manhwa/',
    '/type/manhua/': '/type/manhua/',
};

const STATUS_PATHS: Record<string, string> = {
    '/daftar-manga/?status=ongoing&orderby=popular': '/daftar-manga/?status=ongoing&orderby=popular',
    '/daftar-manga/?status=completed&orderby=popular': '/daftar-manga/?status=completed&orderby=popular',
    '/daftar-manga/?orderby=popular': '/daftar-manga/?orderby=popular',
};

async function scrapePage(path: string, page: number) {
    // Build URL with pagination
    let url: string;
    if (path.includes('?')) {
        // Query string path (status/orderby filters)
        url = page === 1
            ? `${BASE_URL}${path}`
            : `${BASE_URL}${path}&page=${page}`;
    } else {
        // Clean path (genre/type) - page 1 tidak perlu suffix /page/1/
        const cleanPath = path.endsWith('/') ? path : `${path}/`;
        url = page === 1
            ? `${BASE_URL}${cleanPath}`
            : `${BASE_URL}${cleanPath}page/${page}/`;
    }

    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20000, maxRedirects: 5 });
    const $ = cheerio.load(data);

    const items: any[] = [];

    // Try multiple selectors used by komikindo.tv
    const selectors = ['.animepost', '.bs', '.listupd .bs', '.bsx'];
    let found = false;

    for (const sel of selectors) {
        if ($(sel).length > 0) {
            $(sel).each((_, el) => {
                const title =
                    $(el).find('.tt h4').text().trim() ||
                    $(el).find('.tt').text().trim() ||
                    $(el).find('h3, h4').first().text().trim() ||
                    $(el).find('[itemprop="url"]').attr('title') || '';
                const link = $(el).find('a').first().attr('href') || '';
                const thumb =
                    $(el).find('img').attr('src') ||
                    $(el).find('img').attr('data-src') || '';
                const score = $(el).find('.score, .numscore').text().trim() || 'N/A';
                const type = $(el).find('.type').text().trim().toLowerCase() || 'manga';

                if (title && link) {
                    items.push({
                        title,
                        link,
                        thumb: thumb.split('?')[0] || thumb,
                        score,
                        type,
                        desc: `Score: ${score}`,
                    });
                }
            });
            found = true;
            break;
        }
    }

    if (!found || items.length === 0) {
        // fallback: coba .listupd
        $('.listupd article, .listupd .bs').each((_, el) => {
            const title = $(el).find('h3, h4, .tt').first().text().trim();
            const link = $(el).find('a').first().attr('href') || '';
            const thumb = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
            if (title && link) {
                items.push({ title, link, thumb: thumb.split('?')[0] || thumb, score: 'N/A', type: 'manga', desc: 'Score: N/A' });
            }
        });
    }

    const hasMore = items.length >= PER_PAGE;

    return {
        items: items.slice(0, PER_PAGE),
        hasMore,
        total: items.length,
        page,
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/daftar-manga/?orderby=popular';

    // Extract page number from path if present
    const pageMatch = path.match(/[?&]page=(\d+)/) || path.match(/\/page\/(\d+)/);
    const page = pageMatch ? parseInt(pageMatch[1]) : 1;

    // Clean path (remove page param, we handle it separately)
    const cleanPath = path
        .replace(/[?&]page=\d+/, '')
        .replace(/\/page\/\d+\/?/, '/')
        .replace(/&&/, '?')
        .replace(/\?&/, '?');

    try {
        const result = await scrapePage(cleanPath, page);
        return NextResponse.json({ success: true, data: result }, {
            headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
        });
    } catch (error: any) {
        console.error('[browse] Error:', error.message);
        return NextResponse.json(
            { success: false, message: error.message, data: { items: [], hasMore: false, total: 0, page } },
            { status: 500 }
        );
    }
}
