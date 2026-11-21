import { NextResponse } from 'next/server';
import { getChapter } from '@/lib/mangadex';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ success: false, message: 'URL is required' }, { status: 400 });
    }

    try {
        const data = await getChapter(url);
        // Alamat gambar MangaDex@Home bersifat sementara, jadi jangan di-cache lama
        return NextResponse.json({ success: true, data }, {
            headers: {
                'Cache-Control': 's-maxage=300, stale-while-revalidate',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
