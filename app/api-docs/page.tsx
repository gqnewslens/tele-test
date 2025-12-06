export default function APIDocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">API Documentation</h1>

      <div className="space-y-8">
        {/* Crawl API */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            POST /api/crawl
          </h2>
          <p className="text-gray-600 mb-4">
            과기부와 방통위 RSS 피드에서 최신 보도자료를 수집합니다.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Request</h3>
              <div className="rounded bg-gray-50 p-4">
                <code className="text-sm">
                  curl -X POST https://your-domain.vercel.app/api/crawl
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Query Parameters
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>
                  <code className="bg-gray-100 px-1 rounded">limit</code> - 소스당 수집할
                  최대 항목 수 (기본값: 20)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Response</h3>
              <div className="rounded bg-gray-50 p-4 overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(
                    {
                      success: true,
                      timestamp: '2024-12-06T10:30:00.000Z',
                      results: [
                        {
                          success: true,
                          source: 'msit',
                          items_fetched: 20,
                          items_new: 5,
                          items_updated: 2,
                        },
                      ],
                      totals: {
                        fetched: 40,
                        new: 8,
                        updated: 3,
                        errors: 0,
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Press Releases API */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            GET /api/press-releases
          </h2>
          <p className="text-gray-600 mb-4">
            데이터베이스에 저장된 보도자료를 조회합니다.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Request</h3>
              <div className="rounded bg-gray-50 p-4">
                <code className="text-sm">
                  curl https://your-domain.vercel.app/api/press-releases?source=msit&limit=20
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Query Parameters
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>
                  <code className="bg-gray-100 px-1 rounded">source</code> - 'msit' 또는
                  'kcc' (선택사항)
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">limit</code> - 조회할 최대
                  항목 수 (기본값: 50)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Response</h3>
              <div className="rounded bg-gray-50 p-4 overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(
                    {
                      success: true,
                      count: 2,
                      data: [
                        {
                          id: 1,
                          source: 'msit',
                          title: 'AI 반도체 개발 지원 정책 발표',
                          content: '과학기술정보통신부는...',
                          published_at: '2024-12-06T09:00:00Z',
                          url: 'https://www.korea.kr/...',
                          category: '정책',
                        },
                      ],
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* RSS Feeds */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">RSS Feeds</h2>
          <p className="text-gray-600 mb-4">직접 RSS 피드에 접근할 수 있습니다.</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">과기부 (MSIT)</p>
                <code className="text-xs text-gray-600">
                  https://www.korea.kr/rss/dept_msit.xml
                </code>
              </div>
              <a
                href="https://www.korea.kr/rss/dept_msit.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                열기 →
              </a>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">방통위 (KMCC)</p>
                <code className="text-xs text-gray-600">
                  https://www.korea.kr/rss/dept_kmcc.xml
                </code>
              </div>
              <a
                href="https://www.korea.kr/rss/dept_kmcc.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                열기 →
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
