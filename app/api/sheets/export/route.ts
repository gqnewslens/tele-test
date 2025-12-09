import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/sheets/client';

interface ExportPost {
  id: number;
  timestamp: string;
  channel: string;
  messageId: string;
  category?: string;
  subcategory?: string;
  text: string;
  mediaType?: string;
  link?: string;
  mediaLink?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { posts, sheetName = '텔레그램' } = body as {
      posts: ExportPost[];
      sheetName?: string;
    };

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No posts provided' },
        { status: 400 }
      );
    }

    const sheets = getGoogleSheetsClient();

    // Ensure sheet exists with headers
    await sheets.ensureSheetExists(sheetName);

    // Convert posts to sheet rows
    const rows = posts.map((post) => ({
      timestamp: post.timestamp,
      channelTitle: post.channel,
      messageId: parseInt(post.messageId) || 0,
      category: post.category || '',
      subcategory: post.subcategory || '',
      text: post.text,
      mediaType: post.mediaType || '',
      link: post.link || '',
      driveLink: post.mediaLink || '',
    }));

    await sheets.appendRows(sheetName, rows);

    return NextResponse.json({
      success: true,
      message: `${posts.length}개 항목을 시트에 저장했습니다`,
      count: posts.length,
      sheetName,
    });
  } catch (error) {
    console.error('Sheet export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export to sheet',
      },
      { status: 500 }
    );
  }
}
