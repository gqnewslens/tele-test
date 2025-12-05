/**
 * Press release data structure
 */
export interface PressRelease {
  source: 'msit' | 'kcc';
  source_id: string;
  title: string;
  content?: string;
  published_at: string;
  url: string;
  category?: string;
  department?: string;
  author?: string;
  attachments?: Attachment[];
}

/**
 * Attachment information
 */
export interface Attachment {
  name: string;
  url: string;
  size?: string;
}

/**
 * Crawl result
 */
export interface CrawlResult {
  success: boolean;
  source: 'msit' | 'kcc';
  items_fetched: number;
  items_new: number;
  items_updated: number;
  errors?: string[];
  timestamp: string;
}

/**
 * Base crawler interface
 */
export interface ICrawler {
  /**
   * Fetch press releases from source
   * @param limit - Maximum number of items to fetch
   * @returns Array of press releases
   */
  fetch(limit?: number): Promise<PressRelease[]>;

  /**
   * Get crawler name
   */
  getName(): string;

  /**
   * Get source identifier
   */
  getSource(): 'msit' | 'kcc';
}
