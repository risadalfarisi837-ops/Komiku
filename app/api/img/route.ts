import { NextResponse } from 'next/server';
import axios from 'axios';
import { getBase } from '@/lib/scraper';

// Proxy gambar chapter. Dipakai chapter/page.tsx kalau gambar gagal dimuat langsung
// (biasanya karena hotlink protection yang minta Referer dari situs sumber).
export const dynamic = 'force-dynamic';

const MAX_BYTES = 15 * 1024 * 1024;

// Tolak alamat lokal/privat supaya route ini tidak bisa dipakai membuka jaringan internal.
function isBlockedHost(host: string) {
    const h = host.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true;
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
    if (h === '::1' || h.startsWith('[')) return true;
    return false;
}

export async function GET(request: Request) {
    const raw = new URL(request.url).searchParams.get('url');
    if (!raw) return NextResponse.json({ success: false, message: 'URL is required' }, { status: 400 });

    let target: URL;
    try { target = new URL(raw); } catch { return NextResponse.json({ success: false, message: 'URL tidak valid' }, { status: 400 }); }
    if (!/^https?:$/.test(target.protocol) || isBlockedHost(target.hostname)) {
        return NextResponse.json({ success: false, message: 'URL tidak diizinkan' }, { status: 400 });
    }

    // Coba Referer dari situs sumber dulu, lalu dari host gambarnya sendiri.
    const referers = [`${getBase()}/`, `${target.origin}/`];
    let lastErr = 'Gagal mengambil gambar';
    for (const referer of referers) {
        try {
            const res = await axios.get<ArrayBuffer>(target.toString(), {
                responseType: 'arraybuffer',
                timeout: 15000,
                maxRedirects: 5,
                maxContentLength: MAX_BYTES,
                validateStatus: () => true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
                    'Referer': referer,
                    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                },
            });
            const type = String(res.headers['content-type'] || '');
            if (res.status === 200 && type.startsWith('image/')) {
                return new NextResponse(res.data, {
                    headers: {
                        'Content-Type': type,
                        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
                    },
                });
            }
            lastErr = `Sumber membalas ${res.status} (${type || 'tanpa tipe'})`;
        } catch (e: any) {
            lastErr = e?.message || lastErr;
        }
    }
    return NextResponse.json({ success: false, message: lastErr }, { status: 502 });
}
