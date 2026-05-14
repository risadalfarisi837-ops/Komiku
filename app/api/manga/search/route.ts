import { NextResponse } from 'next/server';
import { scrapeSearch } from '@/lib/scraper';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q) {
        return NextResponse.json({ success: false, message: 'Query is required' }, { status: 400 });
    }

    try {
        const data = await scrapeSearch(q);
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
