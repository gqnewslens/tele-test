import { NextRequest, NextResponse } from 'next/server';

interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NaverNewsResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverNewsItem[];
}

/**
 * Extracts domain from URL using native URL API
 * @param url - Full URL string
 * @returns hostname or undefined if invalid
 */
function extractDomain(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    // Invalid URL - return undefined
    console.warn(`Failed to extract domain from URL: ${url}`);
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const display = searchParams.get('display') || '10';
  const start = searchParams.get('start') || '1'; // 1-based index, max 1000
  const sort = searchParams.get('sort') || 'date'; // date or sim (similarity)

  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { success: false, error: 'Naver API credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=${sort}`;

    const response = await fetch(apiUrl, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.status}`);
    }

    const data: NaverNewsResponse = await response.json();

    // Clean up HTML tags from title and description, extract domain
    const cleanedItems = data.items.map((item) => ({
      title: item.title.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      link: item.originallink || item.link,
      description: item.description.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      pubDate: item.pubDate,
      domain: extractDomain(item.originallink) || extractDomain(item.link),
    }));

    return NextResponse.json({
      success: true,
      total: data.total,
      start: data.start,
      display: data.display,
      items: cleanedItems,
    });
  } catch (error) {
    console.error('Naver News API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
