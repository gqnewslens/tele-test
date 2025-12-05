import { ICrawler, PressRelease } from './types';

/**
 * Base crawler class with common functionality
 */
export abstract class BaseCrawler implements ICrawler {
  protected name: string;
  protected source: 'msit' | 'kcc';
  protected baseUrl: string;

  constructor(name: string, source: 'msit' | 'kcc', baseUrl: string) {
    this.name = name;
    this.source = source;
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch HTML content from URL
   */
  protected async fetchHTML(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(
        `Failed to fetch HTML from ${url}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Parse date string to ISO format
   */
  protected parseDate(dateStr: string): string {
    // Handle common Korean date formats
    // e.g., "2024.12.06", "2024-12-06", "2024년 12월 06일"
    const cleaned = dateStr
      .replace(/년|월|일/g, '-')
      .replace(/\./g, '-')
      .replace(/--+/g, '-')
      .trim()
      .replace(/-$/, '');

    const date = new Date(cleaned);
    if (isNaN(date.getTime())) {
      // Fallback to current date if parsing fails
      console.warn(`Failed to parse date: ${dateStr}, using current date`);
      return new Date().toISOString();
    }

    return date.toISOString();
  }

  /**
   * Clean text content
   */
  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Abstract method to be implemented by subclasses
   */
  abstract fetch(limit?: number): Promise<PressRelease[]>;

  getName(): string {
    return this.name;
  }

  getSource(): 'msit' | 'kcc' {
    return this.source;
  }
}
