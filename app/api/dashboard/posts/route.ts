import { NextResponse } from 'next/server';
import { getSupabaseDB, TelegramPost } from '@/lib/supabase/client';

interface PostWithReplies {
  id: number;
  timestamp: string;
  channel: string;
  messageId: string;
  category: string;
  subcategory: string;
  text: string;
  mediaType: string;
  link: string;
  mediaLink: string;
  replyToMessageId: string | null;
  replies: {
    id: number;
    messageId: string;
    text: string;
    channel: string;
    timestamp: string;
  }[];
}

export async function GET() {
  try {
    const db = getSupabaseDB();
    const data = await db.getPosts(200);

    // Separate original posts and replies
    const originals: TelegramPost[] = [];
    const repliesMap = new Map<number, TelegramPost[]>();

    for (const row of data) {
      if (row.reply_to_message_id) {
        // This is a reply - group by parent message_id
        const parentId = row.reply_to_message_id;
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId)!.push(row);
      } else {
        // This is an original post
        originals.push(row);
      }
    }

    // Transform to match frontend interface, attach replies to originals
    const posts: PostWithReplies[] = originals.map(row => ({
      id: row.id!,
      timestamp: row.timestamp,
      channel: row.channel,
      messageId: String(row.message_id),
      category: row.category,
      subcategory: row.subcategory || '',
      text: row.text || '',
      mediaType: row.media_type || '',
      link: row.link || '',
      mediaLink: row.media_link || '',
      replyToMessageId: null,
      replies: (repliesMap.get(row.message_id) || [])
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(reply => ({
          id: reply.id!,
          messageId: String(reply.message_id),
          text: reply.text || '',
          channel: reply.channel,
          timestamp: reply.timestamp,
        })),
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
