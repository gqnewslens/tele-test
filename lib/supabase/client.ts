import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TelegramPost {
  id?: number;
  created_at?: string;
  timestamp: string;
  channel: string;
  message_id: number;
  category: string;
  subcategory?: string;
  text: string;
  media_type?: string;
  link?: string;
  media_link?: string;
}

class SupabaseDB {
  private client: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase URL and ANON KEY are required');
    }

    this.client = createClient(url, key);
  }

  async insertPost(post: Omit<TelegramPost, 'id' | 'created_at'>): Promise<TelegramPost> {
    const { data, error } = await this.client
      .from('telegram_posts')
      .insert(post)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert post: ${error.message}`);
    }

    return data;
  }

  async getPosts(limit = 100): Promise<TelegramPost[]> {
    const { data, error } = await this.client
      .from('telegram_posts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    return data || [];
  }

  async getPostsByFilter(filter: {
    mediaType?: string;
    category?: string;
    hasMediaLink?: boolean;
  }): Promise<TelegramPost[]> {
    let query = this.client
      .from('telegram_posts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filter.mediaType) {
      query = query.eq('media_type', filter.mediaType);
    }

    if (filter.category) {
      query = query.eq('category', filter.category);
    }

    if (filter.hasMediaLink !== undefined) {
      if (filter.hasMediaLink) {
        query = query.not('media_link', 'is', null);
      } else {
        query = query.is('media_link', null);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    return data || [];
  }

  async getPostById(id: number): Promise<TelegramPost | null> {
    const { data, error } = await this.client
      .from('telegram_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch post: ${error.message}`);
    }

    return data;
  }

  async deletePost(id: number): Promise<void> {
    const { error } = await this.client
      .from('telegram_posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }
}

// Singleton instance
let dbInstance: SupabaseDB | null = null;

export function getSupabaseDB(): SupabaseDB {
  if (!dbInstance) {
    dbInstance = new SupabaseDB();
  }
  return dbInstance;
}

export { SupabaseDB };
