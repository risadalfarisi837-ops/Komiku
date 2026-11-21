import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { fetchHtml, parseCards } from '@/lib/scraper';

const PER_PAGE = 18;

async function scrapePage(path: string, page: number) {
    let urlPath: string;
    if (path.includes('?')) {
        urlPath = page === 1 ? path : `${path}&page=${page}`;
    } else {
        const clean = path.endsWith('/') ? path : `${path}/`;
        urlPath = page === 1 ? clean : `${clean}page/${page}/`;
    }
    const $ = cheerio.load(await fetchHtml(urlPath));
    const pathType = ((path.match(/\/type\/(manga|manhwa|manhua)\//) || [])[1]) || '';
    const items = parseCards($, 100).map((it) => ({ ...it, type: it.type || pathType }));
    return {
        items: items.slice(0, PER_PAGE),
        hasMore: items.length >= PER_PAGE,
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
