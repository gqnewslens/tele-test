import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseDB } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId parameter is required' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();
    const chain = await db.getReplyChain(parseInt(messageId, 10));

    // Transform to match frontend interface
    const posts = chain.map(row => ({
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

    return NextResponse.json({ chain: posts });
  } catch (error) {
    console.error('Reply chain API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reply chain' },
      { status: 500 }
    );
  }
}
