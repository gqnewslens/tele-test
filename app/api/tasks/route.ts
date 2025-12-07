import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseDB, TaskStatus, STATUS_PROGRESS_MAP } from '@/lib/supabase/client';
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
    const { title, description, source_message_id } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const db = getSupabaseDB();
    const task = await db.createTask({
      title: title.trim(),
      description: description?.trim() || undefined,
      status: 'todo',
      progress: STATUS_PROGRESS_MAP['todo'],
      source_message_id: source_message_id || undefined,
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
