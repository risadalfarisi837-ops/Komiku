import { NextResponse } from 'next/server';
import { browse } from '@/lib/mangadex';

// Frontend masih mengirim "path" gaya lama (/genres/action/, /type/manhwa/, /daftar-manga/?status=ongoing&orderby=popular,
// dengan halaman lewat &page=N atau /page/N/). Di sini path itu diterjemahkan ke filter API MangaDex.
function parsePath(path: string) {
    const pageMatch = path.match(/[?&]page=(\d+)/) || path.match(/\/page\/(\d+)/);
    const page = pageMatch ? parseInt(pageMatch[1]) : 1;

    const [pathname, query = ''] = path.split('?');
    const qs = new URLSearchParams(query);

    const genre = (pathname.match(/\/genres?\/([^/]+)/) || [])[1];
    const type = (pathname.match(/\/(?:type\/)?(manga|manhwa|manhua)\/?(?:page\/\d+\/?)?$/i) || [])[1]?.toLowerCase();
    const status = qs.get('status') || undefined;
    const order = qs.get('orderby') === 'update' ? 'update' : 'popular';

    return { page, genre, type, status, order } as const;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/daftar-manga/?orderby=popular';
    const filter = parsePath(path);

    try {
        const result = await browse(filter);
        return NextResponse.json({ success: true, data: result }, {
            headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
        });
    } catch (error: any) {
        console.error('[browse] Error:', error.message);
        return NextResponse.json(
            { success: false, message: error.message, data: { items: [], hasMore: false, total: 0, page: filter.page } },
            { status: 500 }
        );
    }
}
