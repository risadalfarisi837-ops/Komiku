import { NextResponse } from 'next/server';

// Proxy gambar cadangan. Dipakai chapter/page.tsx kalau gambar gagal dimuat langsung.
// Hanya host MangaDex yang diizinkan.
export const dynamic = 'force-dynamic';

const MAX_BYTES = 15 * 1024 * 1024;

function isAllowedHost(host: string) {
    const h = host.toLowerCase();
    return h === 'mangadex.org' || h.endsWith('.mangadex.org') || h.endsWith('.mangadex.network');
}

export async function GET(request: Request) {
    const raw = new URL(request.url).searchParams.get('url');
    if (!raw) return NextResponse.json({ success: false, message: 'URL is required' }, { status: 400 });

    let target: URL;
    try { target = new URL(raw); } catch { return NextResponse.json({ success: false, message: 'URL tidak valid' }, { status: 400 }); }
    if (target.protocol !== 'https:' || !isAllowedHost(target.hostname)) {
        return NextResponse.json({ success: false, message: 'URL tidak diizinkan' }, { status: 400 });
    }

    try {
        const res = await fetch(target.toString(), {
            headers: { 'User-Agent': 'komiku-app/1.0', Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' },
            redirect: 'error',
            signal: AbortSignal.timeout(15000),
        });
        const type = res.headers.get('content-type') || '';
        if (!res.ok || !type.startsWith('image/')) {
            return NextResponse.json({ success: false, message: `Sumber membalas ${res.status} (${type || 'tanpa tipe'})` }, { status: 502 });
        }
        const buf = await res.arrayBuffer();
        if (buf.byteLength > MAX_BYTES) {
            return NextResponse.json({ success: false, message: 'Gambar terlalu besar' }, { status: 502 });
        }
        return new NextResponse(buf, {
            headers: {
                'Content-Type': type,
                'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
            },
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e?.message || 'Gagal mengambil gambar' }, { status: 502 });
    }
}
