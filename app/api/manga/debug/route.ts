import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { fetchHtml, parseCards, getBase, getCandidates } from '@/lib/scraper';

// Buka /api/manga/debug di browser untuk cek domain komikindo mana yang jalan dan field apa yang terbaca.
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const html = await fetchHtml('/genres/action/');
        const $ = cheerio.load(html);
        const items = parseCards($, 5);
        return NextResponse.json({
            ok: true,
            domainAktif: getBase(),
            domainDicoba: getCandidates(),
            jumlahKartu: items.length,
            terbacaTipe: items.filter((i) => i.type).length,
            terbacaChapter: items.filter((i) => i.chapter).length,
            terbacaWaktu: items.filter((i) => i.time).length,
            contoh: items.slice(0, 3),
            kelasPertama: $('.animepost, .bs').first().html()?.slice(0, 600) || null,
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, domainDicoba: getCandidates(), error: e?.message || String(e) }, { status: 500 });
    }
}
