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

// GET /api/tasks/[id]/attachments - 첨부파일 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();
    const attachments = await db.getTaskAttachments(taskId);

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Get attachments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/attachments - 첨부파일 추가
export async function POST(
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
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, url, file_type } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();

    // Check if task exists
    const task = await db.getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const attachment = await db.addTaskAttachment({
      task_id: taskId,
      name: name.trim(),
      url: url.trim(),
      file_type: file_type || 'link',
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error('Add attachment error:', error);
    return NextResponse.json(
      { error: 'Failed to add attachment' },
      { status: 500 }
    );
  }
}
