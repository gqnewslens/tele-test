import { NextRequest, NextResponse } from 'next/server';
import { getCrawlerService } from '@/lib/crawler';

/**
 * Cron job endpoint for crawling press releases
 * Can be triggered by:
 * 1. Vercel Cron (configured in vercel.json)
 * 2. Manual HTTP request
 * 3. External scheduler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Cron job triggered: Starting press release crawl');

    // Run crawlers
    const service = getCrawlerService();
    const results = await service.crawlAll(20); // Fetch up to 20 items per source

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

    console.log('✅ Cron job completed:', totals);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      totals,
    });
  } catch (error) {
    console.error('❌ Cron job failed:', error);
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

// Allow POST as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
