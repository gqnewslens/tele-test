import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { marked, Renderer } from 'marked';

// Hex color pattern: #RRGGBB or #RGB (with optional opacity suffix)
const hexPattern = /(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})(\s*\([^)]*\))?/g;

// Create color box HTML
function createColorBox(hex: string, size: number = 14): string {
  return `<span style="display:inline-block;width:${size}px;height:${size}px;background:${hex};border-radius:3px;margin-right:6px;vertical-align:middle;border:1px solid rgba(0,0,0,0.15);box-shadow:0 1px 2px rgba(0,0,0,0.1);"></span>`;
}

// Custom renderer for hex color visualization
const renderer = new Renderer();

// Override codespan to add color preview for hex codes
renderer.codespan = function({ text }: { text: string }): string {
  // Check if it's a hex color code
  if (/^#[0-9A-Fa-f]{3,6}$/.test(text.trim())) {
    const hex = text.trim();
    return `<code>${createColorBox(hex)}${hex}</code>`;
  }
  return `<code>${text}</code>`;
};

// Configure marked for GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: true,
});

marked.use({ renderer });

// Document mapping
const DOC_MAP: Record<string, string> = {
  guide: 'GUIDE.md',
  deployment: 'DEPLOYMENT.md',
  calendar: 'CALENDAR_SETUP.md',
  crawler: 'CRAWLER.md',
  design: 'DESIGN-SYSTEM.md',
  api: 'API.md',
  cicd: 'CI-CD.md',
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
    let html = await marked.parse(markdown);

    // Post-process: Add color boxes to hex codes in table cells that aren't in <code> tags
    html = html.replace(/<td>([^<]*)(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})(\s*\([^)]*\))?([^<]*)<\/td>/gi,
      (match, before, hex, suffix, after) => {
        // Skip if already has color box or is inside code tag
        if (match.includes('background:') || match.includes('<code>')) {
          return match;
        }
        const colorBox = createColorBox(hex, 16);
        return `<td>${before}${colorBox}<code>${hex}</code>${suffix || ''}${after}</td>`;
      }
    );

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
