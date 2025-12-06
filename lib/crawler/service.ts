import { MSITRSSCrawler } from './rss-msit';
import { KMCCRSSCrawler } from './rss-kmcc';
import { CrawlResult, PressRelease } from './types';
import { getSupabaseDB } from '../supabase/client';

/**
 * RSS-based Crawler Service - Orchestrates RSS feed parsing and storage
 */
export class CrawlerService {
  private crawlers: Array<MSITRSSCrawler | KMCCRSSCrawler>;
  private db = getSupabaseDB();

  constructor() {
    this.crawlers = [new MSITRSSCrawler(), new KMCCRSSCrawler()];
  }

  /**
   * Run all crawlers and save results to database
   */
  async crawlAll(limit = 20): Promise<CrawlResult[]> {
    console.log('🚀 Starting crawl process...');
    const results: CrawlResult[] = [];

    for (const crawler of this.crawlers) {
      try {
        const result = await this.crawlOne(crawler, limit);
        results.push(result);
      } catch (error) {
        console.error(
          `❌ Failed to crawl ${crawler.getName()}:`,
          error instanceof Error ? error.message : String(error)
        );
        results.push({
          success: false,
          source: crawler.getSource(),
          items_fetched: 0,
          items_new: 0,
          items_updated: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log('✅ Crawl process completed');
    return results;
  }

  /**
   * Run a single crawler and save results
   */
  async crawlOne(crawler: MSITRSSCrawler | KMCCRSSCrawler, limit = 20): Promise<CrawlResult> {
    const source = crawler.getSource();
    const startTime = Date.now();

    console.log(`\n📡 [${crawler.getName()}] Starting crawl...`);

    const errors: string[] = [];
    let itemsNew = 0;
    let itemsUpdated = 0;

    try {
      // Fetch press releases
      const releases = await crawler.fetch(limit);
      console.log(`📦 [${crawler.getName()}] Fetched ${releases.length} items`);

      // Save to database with deduplication
      for (const release of releases) {
        try {
          // Check if already exists
          const existing = await this.db.getPressReleaseBySourceId(source, release.source_id);

          if (existing) {
            // Update if content changed
            if (this.hasContentChanged(existing, release)) {
              await this.db.upsertPressRelease(release);
              itemsUpdated++;
              console.log(`🔄 Updated: ${release.title.substring(0, 50)}...`);
            } else {
              console.log(`⏭️  Skipped (no change): ${release.title.substring(0, 50)}...`);
            }
          } else {
            // Insert new
            await this.db.upsertPressRelease(release);
            itemsNew++;
            console.log(`✨ New: ${release.title.substring(0, 50)}...`);
          }
        } catch (error) {
          const errorMsg = `Failed to save ${release.title}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `✅ [${crawler.getName()}] Completed in ${duration}s (New: ${itemsNew}, Updated: ${itemsUpdated})`
      );

      return {
        success: true,
        source,
        items_fetched: releases.length,
        items_new: itemsNew,
        items_updated: itemsUpdated,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [${crawler.getName()}] Error: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Check if content has changed between existing and new release
   */
  private hasContentChanged(
    existing: PressRelease,
    newRelease: PressRelease
  ): boolean {
    return (
      existing.title !== newRelease.title ||
      existing.content !== newRelease.content ||
      existing.category !== newRelease.category ||
      JSON.stringify(existing.attachments) !== JSON.stringify(newRelease.attachments)
    );
  }

  /**
   * Get recent press releases from database
   */
  async getRecentReleases(filter?: {
    source?: 'msit' | 'kcc';
    limit?: number;
  }): Promise<PressRelease[]> {
    return this.db.getPressReleases(filter);
  }

  /**
   * Get crawler statistics
   */
  getCrawlerInfo(): Array<{ name: string; source: string }> {
    return this.crawlers.map((c) => ({
      name: c.getName(),
      source: c.getSource(),
    }));
  }
}

// Singleton instance
let serviceInstance: CrawlerService | null = null;

export function getCrawlerService(): CrawlerService {
  if (!serviceInstance) {
    serviceInstance = new CrawlerService();
  }
  return serviceInstance;
}
