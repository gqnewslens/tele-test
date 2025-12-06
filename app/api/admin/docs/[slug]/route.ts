import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { marked } from 'marked';

// Document mapping
const DOC_MAP: Record<string, string> = {
  guide: 'GUIDE.md',
  deployment: 'DEPLOYMENT.md',
  calendar: 'CALENDAR_SETUP.md',
  crawler: 'CRAWLER.md',
  design: 'DESIGN-SYSTEM.md',
  api: 'API.md',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Check admin authorization
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const filename = DOC_MAP[slug];
  if (!filename) {
    return NextResponse.json(
      { success: false, error: 'Document not found' },
      { status: 404 }
    );
  }

  try {
    const docsDir = path.join(process.cwd(), 'docs');
    const filePath = path.join(docsDir, filename);

    const markdown = await fs.readFile(filePath, 'utf-8');
    const html = await marked(markdown);

    return NextResponse.json({
      success: true,
      slug,
      filename,
      content: html,
    });
  } catch (error) {
    console.error('Failed to read document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read document' },
      { status: 500 }
    );
  }
}
