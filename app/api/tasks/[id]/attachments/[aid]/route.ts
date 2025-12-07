import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseDB } from '@/lib/supabase/client';
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

// DELETE /api/tasks/[id]/attachments/[aid] - 첨부파일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    // Verify admin authentication
    if (!verifyToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { aid } = await params;
    const attachmentId = parseInt(aid, 10);

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: 'Invalid attachment ID' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();
    await db.deleteTaskAttachment(attachmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}
