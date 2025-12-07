import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseDB, TaskStatus, STATUS_PROGRESS_MAP } from '@/lib/supabase/client';
import { verifyToken as verifyJwtToken } from '@/app/api/admin/auth/route';

// Verify admin token using JWT
function verifyToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') ?? null;
  return verifyJwtToken(token);
}

// GET /api/tasks - 태스크 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TaskStatus | null;

    const db = getSupabaseDB();
    const tasks = await db.getTasks(status ? { status } : undefined);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - 태스크 생성
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, source_message_id, assignees } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // assignees 배열 처리 (@ 태그 형식)
    let processedAssignees: string[] | undefined;
    if (assignees && Array.isArray(assignees)) {
      processedAssignees = assignees
        .map((a: string) => a.trim().replace(/^@/, '')) // @ 제거
        .filter((a: string) => a.length > 0);
    }

    const db = getSupabaseDB();
    const task = await db.createTask({
      title: title.trim(),
      description: description?.trim() || undefined,
      status: 'todo',
      progress: STATUS_PROGRESS_MAP['todo'],
      source_message_id: source_message_id || undefined,
      assignees: processedAssignees,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
