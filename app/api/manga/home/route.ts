import { NextResponse } from 'next/server';
import { scrapeHomeCategories } from '@/lib/scraper';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    try {
        const data = await scrapeHomeCategories();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
