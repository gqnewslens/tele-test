'use client';

import { useState, useEffect } from 'react';
import { PressRelease } from '@/lib/supabase/client';

export default function PressReleasesPage() {
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [filter, setFilter] = useState<'all' | 'msit' | 'kcc'>('all');

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const sourceParam = filter !== 'all' ? `?source=${filter}` : '';
      const response = await fetch(`/api/press-releases${sourceParam}`);
      const data = await response.json();
      if (data.success) {
        setReleases(data.data);
      }
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
  }, [filter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">보도자료</h1>
        <p className="mt-2 text-sm text-gray-600">
          과기부와 방통위의 최신 보도자료를 확인하세요
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('msit')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              filter === 'msit'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            과기부
          </button>
          <button
            onClick={() => setFilter('kcc')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              filter === 'kcc'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            방통위
          </button>
        </div>

        {/* Crawl Button */}
        <button
          onClick={handleCrawl}
          disabled={crawling}
          className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
        >
          {crawling ? '수집 중...' : '📡 새 보도자료 수집'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      ) : releases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">보도자료가 없습니다.</p>
          <button
            onClick={handleCrawl}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            새 보도자료 수집하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {releases.map((release) => (
            <div
              key={release.id}
              className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        release.source === 'msit'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {release.source === 'msit' ? '과기부' : '방통위'}
                    </span>
                    {release.category && (
                      <span className="text-xs text-gray-500">
                        {release.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    <a
                      href={release.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-600"
                    >
                      {release.title}
                    </a>
                  </h3>
                  {release.content && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {release.content}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {new Date(release.published_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    {release.department && <span>{release.department}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
