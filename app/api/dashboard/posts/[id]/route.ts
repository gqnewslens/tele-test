import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseDB } from '@/lib/supabase/client';
import { getCloudinaryClient, CloudinaryClient } from '@/lib/cloudinary/client';
import { getTelegramBot, TelegramBot } from '@/lib/telegram/bot';
import { validTokens } from '@/app/api/admin/auth/route';

// Verify admin token
function verifyToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return false;

  const tokenData = validTokens.get(token);
  if (!tokenData) return false;

  if (tokenData.expiresAt < Date.now()) {
    validTokens.delete(token);
    return false;
  }

  return true;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    if (!verifyToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();

    // Get the post first to retrieve media_link and telegram link
    const post = await db.getPostById(postId);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const deletionResults = {
      supabase: false,
      cloudinary: false,
      telegram: false,
      errors: [] as string[],
    };

    // 1. Delete from Cloudinary if media_link exists
    if (post.media_link) {
      try {
        const extracted = CloudinaryClient.extractPublicId(post.media_link);
        if (extracted) {
          const cloudinary = getCloudinaryClient();
          const deleted = await cloudinary.deleteFile(extracted.publicId, extracted.resourceType);
          deletionResults.cloudinary = deleted;
          if (!deleted) {
            deletionResults.errors.push('Cloudinary deletion returned false');
          }
        } else {
          deletionResults.errors.push('Could not extract Cloudinary public ID from URL');
        }
      } catch (error) {
        console.error('Cloudinary deletion error:', error);
        deletionResults.errors.push(`Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      deletionResults.cloudinary = true; // No media to delete
    }

    // 2. Delete from Telegram if link exists
    if (post.link && post.link.includes('t.me')) {
      try {
        const parsed = TelegramBot.parseChatIdFromLink(post.link);
        if (parsed) {
          const bot = getTelegramBot();
          deletionResults.telegram = await bot.deleteMessage(parsed.chatId, parsed.messageId);
          if (!deletionResults.telegram) {
            deletionResults.errors.push('Telegram message deletion failed (bot may not have admin rights or message is too old)');
          }
        } else {
          deletionResults.errors.push('Could not parse Telegram link');
        }
      } catch (error) {
        console.error('Telegram deletion error:', error);
        deletionResults.errors.push(`Telegram: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      deletionResults.telegram = true; // No Telegram message to delete
    }

    // 3. Delete from Supabase (always attempt this)
    try {
      await db.deletePost(postId);
      deletionResults.supabase = true;
    } catch (error) {
      console.error('Supabase deletion error:', error);
      deletionResults.errors.push(`Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Return results
    const allSuccess = deletionResults.supabase && deletionResults.cloudinary && deletionResults.telegram;

    return NextResponse.json({
      success: deletionResults.supabase, // Consider success if DB record is deleted
      allSuccess,
      results: deletionResults,
      message: allSuccess
        ? 'Post deleted from all sources'
        : deletionResults.supabase
          ? 'Post deleted from database. Some external deletions may have failed.'
          : 'Failed to delete post',
    });
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get single post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();
    const post = await db.getPostById(postId);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
