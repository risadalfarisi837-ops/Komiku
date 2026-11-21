import { NextResponse } from 'next/server';
import { homeCategories } from '@/lib/mangadex';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    try {
        const data = await homeCategories();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
