'use client';

import { useState, useEffect } from 'react';
import { PressRelease } from '@/lib/supabase/client';

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  domain?: string;
}

export default function PressReleasesPage() {
  const [msitReleases, setMsitReleases] = useState<PressRelease[]>([]);
  const [kccReleases, setKccReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);

  // News search state
  const [searchQuery, setSearchQuery] = useState('');
  const [newsResults, setNewsResults] = useState<NewsItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [newsTotal, setNewsTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const MAX_PAGES = 20; // 최대 100개 (10개 x 10페이지)

  // Multi-select state
  const [selectedNews, setSelectedNews] = useState<Set<number>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);

  // Preset search keywords
  const presetKeywords = [
    '이주희',
    '이주희 국회의원',
    'AI 규제',
    '플랫폼법',
    '방통위',
    '과기부',
  ];

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const [msitRes, kccRes] = await Promise.all([
        fetch('/api/press-releases?source=msit'),
        fetch('/api/press-releases?source=kcc'),
      ]);
      const [msitData, kccData] = await Promise.all([msitRes.json(), kccRes.json()]);

      if (msitData.success) setMsitReleases(msitData.data);
      if (kccData.success) setKccReleases(kccData.data);
    } catch (error) {
      console.error('Failed to fetch releases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrawl = async () => {
    setCrawling(true);
    try {
      const response = await fetch('/api/crawl');
      const data = await response.json();
      if (data.success) {
        alert(
          `✅ 수집 완료!\n총 ${data.totals.fetched}개 확인\n새 항목: ${data.totals.new}개\n업데이트: ${data.totals.updated}개`
        );
        fetchReleases();
      } else {
        alert('❌ 수집 실패: ' + data.error);
      }
    } catch (error) {
      alert('❌ 수집 실패: ' + error);
    } finally {
      setCrawling(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleSearch = async (e?: React.FormEvent, query?: string, page: number = 1) => {
    if (e) e.preventDefault();
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    if (query) setSearchQuery(query);
    setSearching(true);
    setCurrentPage(page);

    const start = (page - 1) * ITEMS_PER_PAGE + 1;
    try {
      const res = await fetch(`/api/news?query=${encodeURIComponent(searchTerm)}&display=${ITEMS_PER_PAGE}&start=${start}`);
      const data = await res.json();
      if (data.success) {
        setNewsResults(data.items);
        setNewsTotal(Math.min(data.total, MAX_PAGES * ITEMS_PER_PAGE)); // 최대 100개로 제한
      }
    } catch (error) {
      console.error('News search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handlePresetClick = (keyword: string) => {
    handleSearch(undefined, keyword, 1);
  };

  const handlePageChange = (page: number) => {
    handleSearch(undefined, searchQuery, page);
  };

  const totalPages = Math.min(Math.ceil(newsTotal / ITEMS_PER_PAGE), MAX_PAGES);

  // Multi-select handlers
  const toggleNewsSelection = (index: number) => {
    const newSelected = new Set(selectedNews);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedNews(newSelected);
  };

  const selectAllNews = () => {
    if (selectedNews.size === newsResults.length) {
      setSelectedNews(new Set());
    } else {
      setSelectedNews(new Set(newsResults.map((_, i) => i)));
    }
  };

  const copySelectedToClipboard = async () => {
    const selectedItems = Array.from(selectedNews)
      .sort((a, b) => a - b)
      .map(index => {
        const news = newsResults[index];
        return `${news.title}\n${news.domain || '출처 없음'} | ${formatNewsDate(news.pubDate)}\n${news.link}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(selectedItems);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatNewsDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const ReleaseCard = ({ release }: { release: PressRelease }) => (
    <a
      href={release.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 py-2 px-3 rounded-md bg-white hover:bg-gray-50 border border-gray-100 transition-all group"
    >
      <span className="text-xs text-gray-400 whitespace-nowrap">
        {formatDate(release.published_at)}
      </span>
      <h3 className="text-sm text-gray-700 group-hover:text-indigo-600 line-clamp-1 flex-1">
        {release.title}
      </h3>
    </a>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Press Releases</h1>
        <button
          onClick={handleCrawl}
          disabled={crawling}
          className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
        >
          {crawling ? '수집 중...' : '📡 수집'}
        </button>
      </div>

      {/* News Search Hero Section */}
      <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔍</span>
          <h2 className="text-sm font-semibold text-green-800">네이버 뉴스 검색</h2>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력하세요 (예: AI 규제, 플랫폼법)"
            className="flex-1 px-3 py-2 text-sm border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          />
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {searching ? '검색 중...' : '검색'}
          </button>
        </form>

        {/* Preset Keywords */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {presetKeywords.map((keyword) => (
            <button
              key={keyword}
              onClick={() => handlePresetClick(keyword)}
              disabled={searching}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                searchQuery === keyword
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50 hover:border-green-400'
              } disabled:opacity-50`}
            >
              {keyword}
            </button>
          ))}
        </div>

        {/* Search Results */}
        {newsResults.length > 0 && (
          <div className="bg-white rounded-lg border border-green-100 overflow-hidden">
            <div className="px-3 py-2 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-700 font-medium">
                  검색결과 {newsTotal.toLocaleString()}건 중 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, newsTotal)}번째
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllNews}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    {selectedNews.size === newsResults.length ? '전체 해제' : '전체 선택'}
                  </button>
                  {selectedNews.size > 0 && (
                    <button
                      onClick={copySelectedToClipboard}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      {copySuccess ? '✓ 복사됨' : `📋 ${selectedNews.size}개 복사`}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setNewsResults([]);
                  setSearchQuery('');
                  setCurrentPage(1);
                  setSelectedNews(new Set());
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {newsResults.map((news, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNews.has(index)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleNewsSelection(index);
                    }}
                    className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />

                  {/* News Content */}
                  <a
                    href={news.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 block"
                  >
                    <div className="flex flex-col gap-1">
                      {/* 1행: 제목 - 언론사 - 날짜 */}
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium text-gray-800 line-clamp-1 hover:text-green-600 flex-1">
                          {news.title}
                        </h3>
                        {news.domain && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                            {news.domain}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatNewsDate(news.pubDate)}
                        </span>
                      </div>
                      {/* 2행: 디스크립션 */}
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {news.description}
                      </p>
                    </div>
                  </a>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-3 py-2 bg-green-50 border-t border-green-100 flex items-center justify-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || searching}
                  className="px-2 py-1 text-xs rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    disabled={searching}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      currentPage === page
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                    } disabled:opacity-50`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || searching}
                  className="px-2 py-1 text-xs rounded border border-green-300 bg-white text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MSIT Column */}
          <div className="bg-blue-50/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-100">
              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                과기부
              </span>
              <span className="text-xs text-gray-400">
                {msitReleases.length}건
              </span>
            </div>
            {msitReleases.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">없음</p>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {msitReleases.map((release) => (
                  <ReleaseCard key={release.id} release={release} />
                ))}
              </div>
            )}
          </div>

          {/* KCC Column */}
          <div className="bg-purple-50/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-100">
              <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                방통위
              </span>
              <span className="text-xs text-gray-400">
                {kccReleases.length}건
              </span>
            </div>
            {kccReleases.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">없음</p>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {kccReleases.map((release) => (
                  <ReleaseCard key={release.id} release={release} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
