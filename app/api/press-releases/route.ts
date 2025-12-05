import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseDB } from '@/lib/supabase/client';

/**
 * Get recent press releases
 *
 * Query parameters:
 * - source: 'msit' | 'kcc' (optional)
 * - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') as 'msit' | 'kcc' | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const db = getSupabaseDB();
    const releases = await db.getPressReleases({
      source: source || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: releases.length,
      data: releases,
    });
  } catch (error) {
    console.error('❌ Failed to fetch press releases:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
