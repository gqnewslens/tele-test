import { NextResponse } from 'next/server';
import { getSupabaseDB } from '@/lib/supabase/client';

export async function GET() {
  try {
    const db = getSupabaseDB();
    const data = await db.getPosts(200);

    // Transform to match frontend interface
    const posts = data.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      channel: row.channel,
      messageId: String(row.message_id),
      category: row.category,
      subcategory: row.subcategory || '',
      text: row.text || '',
      mediaType: row.media_type || '',
      link: row.link || '',
      mediaLink: row.media_link || '',
      replyToMessageId: row.reply_to_message_id ? String(row.reply_to_message_id) : null,
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
