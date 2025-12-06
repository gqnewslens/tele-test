'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Custom styles for markdown elements not covered by Tailwind prose
const customStyles = `
  .docs-content ul {
    list-style-type: disc !important;
  }
  .docs-content ul li::marker {
    color: #818cf8;
  }
  .docs-content ol {
    list-style-type: decimal !important;
  }
  .docs-content ul.contains-task-list {
    list-style-type: none !important;
    padding-left: 0 !important;
  }
  .docs-content ul.contains-task-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }
  .docs-content input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.125rem;
    accent-color: #4f46e5;
    cursor: pointer;
    flex-shrink: 0;
  }
  .docs-content pre {
    background: #0f172a !important;
    border-radius: 0.75rem;
    padding: 1.5rem !important;
    overflow-x: auto;
    margin: 1.5rem 0;
    border: 1px solid #334155;
  }
  .docs-content pre code {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    color: #e2e8f0 !important;
    font-size: 0.875rem;
    line-height: 1.7;
  }
  .docs-content code {
    background: #eef2ff;
    color: #4338ca;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid #c7d2fe;
  }
  .docs-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 2rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .docs-content thead {
    background: #eef2ff;
  }
  .docs-content th {
    padding: 1rem 1.25rem;
    text-align: left;
    font-weight: 700;
    color: #312e81;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    border-bottom: 2px solid #c7d2fe;
  }
  .docs-content td {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e5e7eb;
    color: #374151;
  }
  .docs-content tr:nth-child(even) {
    background: #f9fafb;
  }
  .docs-content tr:hover {
    background: #eef2ff;
  }
  .docs-content h1, .docs-content h2, .docs-content h3 {
    scroll-margin-top: 2rem;
  }
  .docs-content hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 3rem 0;
  }
  .docs-content blockquote {
    border-left: 4px solid #6366f1;
    background: linear-gradient(to right, #eef2ff, transparent);
    padding: 1rem 1.5rem;
    margin: 1.5rem 0;
    border-radius: 0 0.5rem 0.5rem 0;
    color: #374151;
  }
  .docs-content blockquote p {
    margin: 0;
  }
`;

interface DocFile {
  name: string;
  slug: string;
  title: string;
  icon: string;
  description: string;
}

const DOC_FILES: DocFile[] = [
  {
    name: 'GUIDE.md',
    slug: 'guide',
    title: 'Installation Guide',
    icon: '📖',
    description: '전체 설치 및 운영 가이드'
  },
  {
    name: 'DEPLOYMENT.md',
    slug: 'deployment',
    title: 'Deployment',
    icon: '🚀',
    description: 'Vercel 배포 방법'
  },
  {
    name: 'CALENDAR_SETUP.md',
    slug: 'calendar',
    title: 'Calendar Setup',
    icon: '📅',
    description: 'Google Calendar 연동'
  },
  {
    name: 'CRAWLER.md',
    slug: 'crawler',
    title: 'Crawler System',
    icon: '🔄',
    description: '보도자료 크롤러'
  },
  {
    name: 'DESIGN-SYSTEM.md',
    slug: 'design',
    title: 'Design System',
    icon: '🎨',
    description: 'UI/UX 디자인 가이드'
  },
  {
    name: 'API.md',
    slug: 'api',
    title: 'API Reference',
    icon: '⚡',
    description: 'REST API 문서'
  },
  {
    name: 'CI-CD.md',
    slug: 'cicd',
    title: 'CI/CD Guide',
    icon: '🔁',
    description: '배포 파이프라인 가이드'
  },
];

export default function AdminDocsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string>('guide');
  const [content, setContent] = useState<string>('');
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/?login=required');
      return;
    }
    verifyToken(token);
  }, [router]);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch('/api/admin/auth', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsAdmin(true);
      } else {
        localStorage.removeItem('adminToken');
        router.push('/?login=required');
      }
    } catch {
      localStorage.removeItem('adminToken');
      router.push('/?login=required');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && selectedDoc) {
      loadDocument(selectedDoc);
    }
  }, [isAdmin, selectedDoc]);

  const loadDocument = async (slug: string) => {
    setDocLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/docs/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
      } else {
        setContent('Document not found.');
      }
    } catch {
      setContent('Failed to load document.');
    } finally {
      setDocLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-4"></div>
          <p className="text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const currentDoc = DOC_FILES.find(d => d.slug === selectedDoc);

  return (
    <div className="min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-900 transition-colors"
              >
                ← Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Technical Documentation
                </h1>
                <p className="text-sm text-gray-500">GQAI Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                ADMIN ONLY
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <div className="sticky top-8">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-semibold">
                Documents
              </p>
              <ul className="space-y-2">
                {DOC_FILES.map((doc) => (
                  <li key={doc.slug}>
                    <button
                      onClick={() => setSelectedDoc(doc.slug)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedDoc === doc.slug
                          ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                          : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{doc.icon}</span>
                        <div>
                          <p className={`font-medium ${selectedDoc === doc.slug ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {doc.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {doc.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Version Info</p>
                <p className="text-sm text-gray-700">v1.0 | Dec 2024</p>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {docLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-4"></div>
                <p className="text-gray-500">Loading document...</p>
              </div>
            ) : (
              <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Document Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{currentDoc?.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {currentDoc?.title || 'Document'}
                    </h2>
                  </div>
                  <p className="text-gray-500">{currentDoc?.description}</p>
                </div>

                {/* Markdown Content */}
                <div className="px-10 py-10">
                  <div
                    className="docs-content prose prose-lg prose-gray max-w-none
                      prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight
                      prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b-2 prose-h1:border-indigo-200
                      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-200 prose-h2:text-gray-800
                      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-indigo-700 prose-h3:font-semibold
                      prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-3 prose-h4:text-gray-800 prose-h4:font-medium
                      prose-p:text-gray-700 prose-p:leading-7 prose-p:my-5 prose-p:text-base
                      prose-a:text-indigo-600 prose-a:font-medium prose-a:underline prose-a:underline-offset-2 prose-a:decoration-indigo-300 hover:prose-a:decoration-indigo-500 hover:prose-a:text-indigo-700
                      prose-strong:text-gray-900 prose-strong:font-bold
                      prose-img:rounded-xl prose-img:border prose-img:border-gray-200 prose-img:shadow-md
                    "
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </article>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
