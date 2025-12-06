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
  reply_to_message_id?: number;
}

export interface PinnedPost {
  id?: number;
  created_at?: string;
  post_id: number;
  pinned_at?: string;
  pinned_by?: string;
  display_order?: number;
  custom_title?: string;
  // Joined fields from telegram_posts
  post?: TelegramPost;
}

export interface PressRelease {
  id?: number;
  created_at?: string;
  source: 'msit' | 'kcc';
  source_id: string;
  title: string;
  content?: string;
  published_at: string;
  url: string;
  category?: string;
  department?: string;
  author?: string;
  attachments?: { name: string; url: string; size?: string }[];
  last_updated?: string;
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

  async getPostByMessageId(messageId: number): Promise<TelegramPost | null> {
    const { data, error } = await this.client
      .from('telegram_posts')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch post: ${error.message}`);
    }

    return data;
  }

  async getReplyChain(messageId: number): Promise<TelegramPost[]> {
    const chain: TelegramPost[] = [];
    let currentMessageId: number | undefined = messageId;

    // Build chain by following reply_to_message_id references
    while (currentMessageId) {
      const post = await this.getPostByMessageId(currentMessageId);
      if (!post) break;

      chain.unshift(post); // Add to beginning to maintain chronological order
      currentMessageId = post.reply_to_message_id;
    }

    return chain;
  }

  async getReplies(messageId: number): Promise<TelegramPost[]> {
    const { data, error } = await this.client
      .from('telegram_posts')
      .select('*')
      .eq('reply_to_message_id', messageId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch replies: ${error.message}`);
    }

    return data || [];
  }

  // Press Release Methods

  async upsertPressRelease(
    release: Omit<PressRelease, 'id' | 'created_at' | 'last_updated'>
  ): Promise<PressRelease> {
    const { data, error } = await this.client
      .from('press_releases')
      .upsert(
        {
          ...release,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'source,source_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert press release: ${error.message}`);
    }

    return data;
  }

  async getPressReleases(filter?: {
    source?: 'msit' | 'kcc';
    limit?: number;
  }): Promise<PressRelease[]> {
    let query = this.client
      .from('press_releases')
      .select('*')
      .order('published_at', { ascending: false });

    if (filter?.source) {
      query = query.eq('source', filter.source);
    }

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch press releases: ${error.message}`);
    }

    return data || [];
  }

  async getPressReleaseBySourceId(
    source: 'msit' | 'kcc',
    sourceId: string
  ): Promise<PressRelease | null> {
    const { data, error } = await this.client
      .from('press_releases')
      .select('*')
      .eq('source', source)
      .eq('source_id', sourceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch press release: ${error.message}`);
    }

    return data;
  }

  async deletePressRelease(id: number): Promise<void> {
    const { error } = await this.client.from('press_releases').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete press release: ${error.message}`);
    }
  }

  // Pinned Posts Methods

  async getPinnedPosts(): Promise<(PinnedPost & { post: TelegramPost })[]> {
    const { data, error } = await this.client
      .from('pinned_posts')
      .select(`
        *,
        post:telegram_posts(*)
      `)
      .order('display_order', { ascending: true })
      .order('pinned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pinned posts: ${error.message}`);
    }

    return data || [];
  }

  async pinPost(postId: number, pinnedBy?: string, customTitle?: string): Promise<PinnedPost> {
    // Get max display_order
    const { data: maxData } = await this.client
      .from('pinned_posts')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (maxData?.[0]?.display_order ?? -1) + 1;

    const { data, error } = await this.client
      .from('pinned_posts')
      .insert({
        post_id: postId,
        pinned_by: pinnedBy,
        custom_title: customTitle,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to pin post: ${error.message}`);
    }

    return data;
  }

  async unpinPost(postId: number): Promise<void> {
    const { error } = await this.client
      .from('pinned_posts')
      .delete()
      .eq('post_id', postId);

    if (error) {
      throw new Error(`Failed to unpin post: ${error.message}`);
    }
  }

  async isPinned(postId: number): Promise<boolean> {
    const { data, error } = await this.client
      .from('pinned_posts')
      .select('id')
      .eq('post_id', postId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check pin status: ${error.message}`);
    }

    return !!data;
  }

  async updatePinnedPostOrder(id: number, newOrder: number): Promise<void> {
    const { error } = await this.client
      .from('pinned_posts')
      .update({ display_order: newOrder })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update pin order: ${error.message}`);
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
