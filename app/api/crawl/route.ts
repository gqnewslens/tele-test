import { NextRequest, NextResponse } from 'next/server';
import { getCrawlerService } from '@/lib/crawler';

/**
 * Manual crawl endpoint for press releases
 *
 * Usage:
 * - GET /api/crawl - Fetch latest press releases
 * - GET /api/crawl?limit=10 - Fetch 10 items per source
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    console.log(`🔄 Manual crawl triggered (limit: ${limit})`);

    // Run crawlers
    const service = getCrawlerService();
    const results = await service.crawlAll(limit);

    // Calculate totals
    const totals = results.reduce(
      (acc, result) => ({
        fetched: acc.fetched + result.items_fetched,
        new: acc.new + result.items_new,
        updated: acc.updated + result.items_updated,
        errors: acc.errors + (result.errors?.length || 0),
      }),
      { fetched: 0, new: 0, updated: 0, errors: 0 }
    );

    console.log('✅ Manual crawl completed:', totals);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      totals,
    });
  } catch (error) {
    console.error('❌ Manual crawl failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow POST as well
export async function POST(request: NextRequest) {
  return GET(request);
}
