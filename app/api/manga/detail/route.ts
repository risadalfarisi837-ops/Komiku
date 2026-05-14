import { NextResponse } from 'next/server';
import { scrapeDetail } from '@/lib/scraper';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
        return NextResponse.json({ success: false, message: 'URL is required' }, { status: 400 });
    }

    try {
        const data = await scrapeDetail(url);
        return NextResponse.json({ success: true, data }, {
            headers: {
                'Cache-Control': 's-maxage=3600, stale-while-revalidate',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
