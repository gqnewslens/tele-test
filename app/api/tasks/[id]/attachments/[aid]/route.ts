import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseDB } from '@/lib/supabase/client';
import { verifyToken as verifyJwtToken } from '@/app/api/admin/auth/route';

// Verify admin token using JWT
function verifyToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') ?? null;
  return verifyJwtToken(token);
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
