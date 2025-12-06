'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DocFile {
  name: string;
  slug: string;
  title: string;
}

const DOC_FILES: DocFile[] = [
  { name: 'GUIDE.md', slug: 'guide', title: 'Installation Guide' },
  { name: 'DEPLOYMENT.md', slug: 'deployment', title: 'Deployment' },
  { name: 'CALENDAR_SETUP.md', slug: 'calendar', title: 'Calendar Setup' },
  { name: 'CRAWLER.md', slug: 'crawler', title: 'Crawler System' },
  { name: 'DESIGN-SYSTEM.md', slug: 'design', title: 'Design System' },
  { name: 'API.md', slug: 'api', title: 'API Reference' },
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Verifying access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const currentDoc = DOC_FILES.find(d => d.slug === selectedDoc);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider">
                GQAI WORKSPACE
              </p>
              <h1 className="text-xl font-bold text-black mt-1">
                TECHNICAL DOCUMENTATION
              </h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">CLASSIFICATION</p>
              <p className="text-sm font-bold text-black">ADMIN ONLY</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Navigation */}
        <nav className="mb-6 pb-4 border-b border-gray-300">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-black">
              Dashboard
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-black font-medium">Documentation</span>
          </div>
        </nav>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <div className="sticky top-6">
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">
                TABLE OF CONTENTS
              </p>
              <ul className="space-y-1">
                {DOC_FILES.map((doc) => (
                  <li key={doc.slug}>
                    <button
                      onClick={() => setSelectedDoc(doc.slug)}
                      className={`w-full text-left px-3 py-2 text-sm border-l-2 transition-colors ${
                        selectedDoc === doc.slug
                          ? 'border-black bg-gray-100 text-black font-medium'
                          : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {doc.title}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: Dec 2024
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Version 1.0
                </p>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {docLoading ? (
              <div className="py-12 text-center text-gray-600">
                Loading document...
              </div>
            ) : (
              <article className="doc-content">
                {/* Document Header */}
                <div className="mb-8 pb-4 border-b-2 border-black">
                  <p className="text-xs text-gray-600 uppercase tracking-wider">
                    DOCUMENT
                  </p>
                  <h2 className="text-2xl font-bold text-black mt-1">
                    {currentDoc?.title || 'Document'}
                  </h2>
                </div>

                {/* Markdown Content */}
                <div
                  className="prose prose-sm max-w-none
                    prose-headings:font-bold prose-headings:text-black prose-headings:border-b prose-headings:border-gray-200 prose-headings:pb-2
                    prose-h1:text-xl prose-h1:mt-8 prose-h1:mb-4
                    prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
                    prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-h3:border-none
                    prose-p:text-gray-800 prose-p:leading-relaxed prose-p:my-3
                    prose-a:text-black prose-a:underline prose-a:underline-offset-2
                    prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-code:text-black
                    prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-300 prose-pre:text-sm prose-pre:overflow-x-auto
                    prose-ul:my-3 prose-ul:pl-6 prose-li:my-1
                    prose-ol:my-3 prose-ol:pl-6
                    prose-table:border prose-table:border-gray-300
                    prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-sm prose-th:font-bold
                    prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2 prose-td:text-sm
                    prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700
                    prose-hr:border-gray-300 prose-hr:my-6
                    prose-strong:text-black
                  "
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </article>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-black mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <p>GQAI WORKSPACE - INTERNAL USE ONLY</p>
            <p>© 2024 All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
