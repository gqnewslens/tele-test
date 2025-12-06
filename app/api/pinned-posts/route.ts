import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseDB } from '@/lib/supabase/client';

// GET - Fetch all pinned posts
export async function GET() {
  try {
    const db = getSupabaseDB();
    const pinnedPosts = await db.getPinnedPosts();

    return NextResponse.json({ success: true, data: pinnedPosts });
  } catch (error) {
    console.error('Failed to fetch pinned posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pinned posts' },
      { status: 500 }
    );
  }
}

// POST - Pin a post
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postId, pinnedBy, customTitle } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId is required' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();
    const pinnedPost = await db.pinPost(postId, pinnedBy, customTitle);

    return NextResponse.json({ success: true, data: pinnedPost });
  } catch (error) {
    console.error('Failed to pin post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to pin post' },
      { status: 500 }
    );
  }
}

// DELETE - Unpin a post
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId is required' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();
    await db.unpinPost(parseInt(postId, 10));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unpin post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unpin post' },
      { status: 500 }
    );
  }
}
