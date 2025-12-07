import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseDB, TaskStatus, STATUS_PROGRESS_MAP } from '@/lib/supabase/client';
import { verifyToken as verifyJwtToken } from '@/app/api/admin/auth/route';

// Verify admin token using JWT
function verifyToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') ?? null;
  return verifyJwtToken(token);
}

// GET /api/tasks/[id] - 태스크 상세 조회
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
    const task = await db.getTaskById(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get attachments
    const attachments = await db.getTaskAttachments(taskId);

    return NextResponse.json({ task, attachments });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - 태스크 수정
export async function PUT(
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
    const { title, description, status, assignees, progress } = body;

    const db = getSupabaseDB();

    // Check if task exists
    const existingTask = await db.getTaskById(taskId);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (title !== undefined) {
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (status !== undefined) {
      const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updates.status = status;
      updates.progress = STATUS_PROGRESS_MAP[status as TaskStatus];
    }

    // 진도율 직접 수정
    if (progress !== undefined && typeof progress === 'number') {
      updates.progress = Math.max(0, Math.min(100, progress));
    }

    // assignees 배열 처리 (@ 태그 형식)
    if (assignees !== undefined) {
      if (assignees === null || (Array.isArray(assignees) && assignees.length === 0)) {
        updates.assignees = null;
      } else if (Array.isArray(assignees)) {
        updates.assignees = assignees
          .map((a: string) => a.trim().replace(/^@/, '')) // @ 제거
          .filter((a: string) => a.length > 0);
      }
    }

    const task = await db.updateTask(taskId, updates);

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - 태스크 삭제
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
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();

    // Check if task exists
    const existingTask = await db.getTaskById(taskId);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    await db.deleteTask(taskId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
