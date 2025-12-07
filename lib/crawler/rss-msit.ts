import Parser from 'rss-parser';
import { PressRelease } from './types';

/**
 * MSIT (과학기술정보통신부) RSS Feed Crawler
 * Source: https://www.korea.kr/rss/dept_msit.xml
 */
export class MSITRSSCrawler {
  private parser: Parser;
  private feedUrl = 'https://www.korea.kr/rss/dept_msit.xml';
  private name = 'MSIT RSS Crawler';
  private source: 'msit' | 'kcc' = 'msit';

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['dc:creator', 'creator'],
          ['dc:date', 'dcDate'],
        ],
      },
    });
  }

  async fetch(limit = 20): Promise<PressRelease[]> {
    console.log(`[${this.name}] Fetching RSS feed from ${this.feedUrl}...`);

    try {
      const feed = await this.parser.parseURL(this.feedUrl);
      const releases: PressRelease[] = [];

      // Limit items
      const items = feed.items.slice(0, limit);

      for (const item of items) {
        try {
          // Extract source ID from link or GUID
          const sourceId = this.extractSourceId(item.link || item.guid || '');

          // Parse date
          const publishedAt = item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString();

          // Clean HTML from description
          const content = this.cleanHTML(item.content || item.contentSnippet || '');

          releases.push({
            source: this.source,
            source_id: sourceId,
            title: this.cleanHTML(item.title || ''),
            content: content || undefined,
            published_at: publishedAt,
            url: item.link || '',
            category: this.extractCategory(item.categories),
          });
        } catch (error) {
          console.error(
            `[${this.name}] Error processing item:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      console.log(`[${this.name}] Fetched ${releases.length} press releases`);
      return releases;
    } catch (error) {
      console.error(
        `[${this.name}] Error fetching RSS feed:`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Extract source ID from URL
   */
  private extractSourceId(url: string): string {
    // Try to extract ID from URL parameters or path
    const match = url.match(/newsId=([^&]+)/);
    if (match) {
      return match[1];
    }

    // Fallback: use URL hash or full URL
    return url.split('/').pop() || url;
  }

  /**
   * Clean HTML tags and decode HTML entities from content
   */
  private cleanHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&middot;/g, '\u00B7') // ·
      .replace(/&bull;/g, '\u2022') // •
      .replace(/&ndash;/g, '\u2013') // –
      .replace(/&mdash;/g, '\u2014') // —
      .replace(/&lsquo;/g, '\u2018') // '
      .replace(/&rsquo;/g, '\u2019') // '
      .replace(/&ldquo;/g, '\u201C') // "
      .replace(/&rdquo;/g, '\u201D') // "
      .replace(/&hellip;/g, '\u2026') // …
      .replace(/&copy;/g, '\u00A9') // ©
      .replace(/&reg;/g, '\u00AE') // ®
      .replace(/&trade;/g, '\u2122') // ™
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
      .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract category from categories array
   */
  private extractCategory(categories?: string[]): string | undefined {
    return categories && categories.length > 0 ? categories[0] : undefined;
  }

  getName(): string {
    return this.name;
  }

  getSource(): 'msit' | 'kcc' {
    return this.source;
  }
}
