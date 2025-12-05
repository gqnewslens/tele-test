import * as cheerio from 'cheerio';
import { BaseCrawler } from './base';
import { PressRelease, Attachment } from './types';

/**
 * MSIT (과학기술정보통신부) Press Release Crawler
 * Source: https://www.msit.go.kr/bbs/list.do?sCode=user&mPid=208&mId=307
 */
export class MSITCrawler extends BaseCrawler {
  constructor() {
    super(
      'MSIT Crawler',
      'msit',
      'https://www.msit.go.kr/bbs/list.do?sCode=user&mPid=208&mId=307'
    );
  }

  async fetch(limit = 20): Promise<PressRelease[]> {
    console.log(`[${this.name}] Fetching press releases...`);

    try {
      const html = await this.fetchHTML(this.baseUrl);
      const $ = cheerio.load(html);
      const releases: PressRelease[] = [];

      // Find all press release items in the list
      // This selector may need adjustment based on actual HTML structure
      const items = $('.board-list tbody tr').slice(0, limit);

      for (let i = 0; i < items.length; i++) {
        const item = items.eq(i);

        try {
          // Extract basic information
          const titleElement = item.find('.subject a, .title a');
          const title = this.cleanText(titleElement.text());
          const detailUrl = titleElement.attr('href');

          if (!title || !detailUrl) {
            continue;
          }

          // Build full URL
          const fullUrl = detailUrl.startsWith('http')
            ? detailUrl
            : `https://www.msit.go.kr${detailUrl}`;

          // Extract ID from URL (e.g., nttSeqNo parameter)
          const sourceId = this.extractSourceId(fullUrl);

          // Extract date
          const dateText = this.cleanText(item.find('.date, .regdate').text());
          const publishedAt = this.parseDate(dateText);

          // Extract category/department if available
          const category = this.cleanText(item.find('.category').text());

          // Fetch detail page for full content
          const detail = await this.fetchDetail(fullUrl);

          releases.push({
            source: this.source,
            source_id: sourceId,
            title,
            content: detail.content,
            published_at: publishedAt,
            url: fullUrl,
            category: category || undefined,
            department: detail.department,
            author: detail.author,
            attachments: detail.attachments,
          });

          // Add delay to avoid overwhelming the server
          await this.delay(500);
        } catch (error) {
          console.error(
            `[${this.name}] Error processing item ${i}:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      console.log(`[${this.name}] Fetched ${releases.length} press releases`);
      return releases;
    } catch (error) {
      console.error(
        `[${this.name}] Error fetching press releases:`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Extract source ID from URL
   */
  private extractSourceId(url: string): string {
    const match = url.match(/nttSeqNo=(\d+)/);
    return match ? match[1] : url;
  }

  /**
   * Fetch detail page content
   */
  private async fetchDetail(url: string): Promise<{
    content?: string;
    department?: string;
    author?: string;
    attachments?: Attachment[];
  }> {
    try {
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      // Extract content
      const content = this.cleanText($('.board-view-content, .view-content').text());

      // Extract department/author
      const department = this.cleanText($('.department').text());
      const author = this.cleanText($('.author, .writer').text());

      // Extract attachments
      const attachments: Attachment[] = [];
      $('.attach-file a, .file-list a').each((_, el) => {
        const name = this.cleanText($(el).text());
        const href = $(el).attr('href');
        if (name && href) {
          attachments.push({
            name,
            url: href.startsWith('http') ? href : `https://www.msit.go.kr${href}`,
          });
        }
      });

      return {
        content: content || undefined,
        department: department || undefined,
        author: author || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
    } catch (error) {
      console.error(
        `[${this.name}] Error fetching detail:`,
        error instanceof Error ? error.message : String(error)
      );
      return {};
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
