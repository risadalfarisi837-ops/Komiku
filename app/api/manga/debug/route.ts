import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { fetchHtml, parseCards, getBase, getCandidates, scrapeDetail, scrapeChapter } from '@/lib/scraper';

// Buka /api/manga/debug di browser untuk cek domain komikindo mana yang jalan dan field apa yang terbaca.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // /api/manga/debug?url=<link detail atau chapter> : tes parser detail dan chapter untuk satu halaman
    const target = new URL(request.url).searchParams.get('url');
    if (target) {
        const out: any = { url: target, domainAktif: getBase() };
        try {
            const html = await fetchHtml(target);
            out.panjangHtml = html.length;
            out.adaTsReader = html.includes('ts_reader');
            out.judulHalaman = cheerio.load(html)('title').text().trim().slice(0, 120);
        } catch (e: any) { out.errorFetch = e?.message || String(e); }
        try {
            const d = await scrapeDetail(target);
            out.detail = { ok: true, judul: d.title, thumb: d.thumb, jumlahChapter: d.chapters.length, contoh: d.chapters.slice(0, 3) };
        } catch (e: any) { out.detail = { ok: false, error: e?.message }; }
        try {
            const c = await scrapeChapter(target);
            out.chapter = { ok: true, judul: c.title, jumlahGambar: c.images.length, contoh: c.images.slice(0, 2), prev: c.prev, next: c.next, mangaLink: c.mangaLink };
        } catch (e: any) { out.chapter = { ok: false, error: e?.message }; }
        return NextResponse.json(out);
    }

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
            kelasPertama: $('.animepost, .bs').first().html()?.slice(0, 600)
                || $('a[href*="/komik/"]').first().parent().parent().html()?.slice(0, 900) || null,
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, domainDicoba: getCandidates(), error: e?.message || String(e) }, { status: 500 });
    }
}
