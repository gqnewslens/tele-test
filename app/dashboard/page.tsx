'use client';

import { useEffect, useState } from 'react';
import Calendar from '@/components/Calendar';

interface Post {
  id: number;
  timestamp: string;
  channel: string;
  messageId: string;
  category: string;
  subcategory: string;
  text: string;
  mediaType: string;
  link: string;
  mediaLink: string;
}

type FilterType = 'all' | 'document' | 'link' | 'image' | 'video' | 'notice';

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Sheet export state
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      verifyToken(savedToken);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch('/api/admin/auth', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsAdmin(true);
        setAdminToken(token);
      } else {
        localStorage.removeItem('adminToken');
      }
    } catch {
      localStorage.removeItem('adminToken');
    }
  };

  useEffect(() => {
    fetchPosts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilter();
  }, [posts, filter]);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/dashboard/posts');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPosts(data.posts);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered: Post[];

    const isDocument = (p: Post) => p.mediaType?.toLowerCase() === 'document';
    const isImage = (p: Post) => ['photo', 'sticker'].includes(p.mediaType?.toLowerCase() || '');
    const isVideo = (p: Post) => p.mediaType?.toLowerCase() === 'video';
    const hasLink = (p: Post) => /https?:\/\/[^\s]+/.test(p.text);
    const isNotice = (p: Post) => /^\[(공유|전달|공지|안내|중요)\]/.test(p.text.trim());

    switch (filter) {
      case 'document':
        filtered = posts.filter(isDocument);
        break;
      case 'link':
        filtered = posts.filter(p => hasLink(p) && !p.mediaType);
        break;
      case 'image':
        filtered = posts.filter(isImage);
        break;
      case 'video':
        filtered = posts.filter(isVideo);
        break;
      case 'notice':
        filtered = posts.filter(isNotice);
        break;
      default:
        // 'all' - exclude general conversation
        filtered = posts.filter(p =>
          isDocument(p) || isImage(p) || isVideo(p) || hasLink(p) || isNotice(p)
        );
    }

    setFilteredPosts(filtered);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const extractLinks = (text: string): string[] => {
    const urlPattern = /https?:\/\/[^\s]+/g;
    return text.match(urlPattern) || [];
  };

  const getTypeIcon = (post: Post) => {
    const mt = post.mediaType?.toLowerCase();
    if (mt === 'document') return '📄';
    if (mt === 'photo' || mt === 'sticker') return '🖼️';
    if (mt === 'video') return '🎬';
    if (/^\[(공유|전달|공지|안내|중요)\]/.test(post.text.trim())) return '📢';
    if (/https?:\/\/[^\s]+/.test(post.text)) return '🔗';
    return '💬';
  };

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: 'all', label: '전체'},
    { type: 'notice', label: '공지'},
    { type: 'document', label: '문서'},
    { type: 'link', label: '링크'},
    { type: 'image', label: '이미지'},
    { type: 'video', label: '영상'},
  ];

  // Admin login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAdmin(true);
        setAdminToken(data.token);
        localStorage.setItem('adminToken', data.token);
        setShowLoginModal(false);
        setPassword('');
      } else {
        setLoginError(data.error || '로그인 실패');
      }
    } catch {
      setLoginError('서버 오류가 발생했습니다');
    }
  };

  // Admin logout handler
  const handleLogout = async () => {
    if (adminToken) {
      await fetch('/api/admin/auth', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
    setIsAdmin(false);
    setAdminToken(null);
    localStorage.removeItem('adminToken');
  };

  // Delete handler
  const handleDelete = async (postId: number) => {
    if (!adminToken) return;

    setDeleting(postId);
    try {
      const res = await fetch(`/api/dashboard/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();

      if (data.success) {
        // Remove from local state
        setPosts(prev => prev.filter(p => p.id !== postId));
        setDeleteConfirm(null);
      } else {
        alert(`삭제 실패: ${data.error || data.message}`);
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(null);
    }
  };

  // Sheet export handlers
  const togglePostSelection = (postId: number) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const selectAllPosts = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    }
  };

  const exportToSheet = async () => {
    if (selectedPosts.size === 0) return;

    setExporting(true);
    try {
      const postsToExport = filteredPosts.filter(p => selectedPosts.has(p.id));
      const res = await fetch('/api/sheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: postsToExport }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ ${data.count}개 항목을 시트에 저장했습니다`);
        setSelectedPosts(new Set());
      } else {
        alert(`❌ 저장 실패: ${data.error}`);
      }
    } catch (err) {
      alert('❌ 시트 저장 중 오류가 발생했습니다');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Telegram Dashboard</h1>

            {/* Admin button */}
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-transparent border border-red-500 hover:border-red-400 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                🔓 로그아웃
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
              >
                🔐 관리자
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {filterButtons.map(btn => (
              <button
                key={btn.type}
                onClick={() => setFilter(btn.type)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === btn.type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {isAdmin && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-6 flex items-center gap-2">
            ✅ 관리자 모드 - 삭제 기능이 활성화되었습니다
          </div>
        )}

        {/* Google Calendar */}
        <div className="mb-6">
          <Calendar />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{filteredPosts.length}개 항목</span>
            <button
              onClick={selectAllPosts}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {selectedPosts.size === filteredPosts.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          {selectedPosts.size > 0 && (
            <button
              onClick={exportToSheet}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {exporting ? '저장 중...' : `📊 시트로 보내기 (${selectedPosts.size})`}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {filteredPosts.map((post, index) => (
            <div
              key={`${post.messageId}-${index}`}
              className={`bg-gray-800 rounded-lg p-4 border transition-colors ${
                selectedPosts.has(post.id)
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedPosts.has(post.id)}
                  onChange={() => togglePostSelection(post.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800 cursor-pointer"
                />
                <span className="text-2xl">{getTypeIcon(post)}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-blue-400">{post.channel}</span>
                    <span className="text-gray-500 text-sm">{formatDate(post.timestamp)}</span>
                  </div>

                  <p className="text-gray-200 whitespace-pre-wrap break-words mb-3">
                    {post.text}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {post.mediaLink && (
                      <a
                        href={post.mediaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm hover:bg-green-900 transition-colors"
                      >
                        📥 미디어 다운로드
                      </a>
                    )}

                    {/* Show prominent button for documents without cloud link */}
                    {post.mediaType?.toLowerCase() === 'document' && !post.mediaLink && post.link && !post.link.startsWith('[') && (
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-sm hover:bg-yellow-900 transition-colors"
                      >
                        📄 텔레그램에서 보기
                      </a>
                    )}

                    {extractLinks(post.text).map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-sm hover:bg-blue-900 transition-colors truncate max-w-xs"
                      >
                        🔗 {new URL(link).hostname}
                      </a>
                    ))}

                    {post.link && !post.link.startsWith('[') && !(post.mediaType?.toLowerCase() === 'document' && !post.mediaLink) && (
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600 transition-colors"
                      >
                        💬 원본 보기
                      </a>
                    )}

                    {/* Delete button - only visible for admin */}
                    {isAdmin && (
                      deleteConfirm === post.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={deleting === post.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {deleting === post.id ? '삭제 중...' : '✓ 확인'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting === post.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-full text-sm hover:bg-gray-500 transition-colors disabled:opacity-50"
                          >
                            ✕ 취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(post.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-900/50 text-red-400 rounded-full text-sm hover:bg-red-900 transition-colors"
                        >
                          🗑️ 삭제
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredPosts.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              해당하는 항목이 없습니다
            </div>
          )}
        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">관리자 로그인</h2>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="관리자 비밀번호 입력"
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="mb-4 text-red-400 text-sm">
                  {loginError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setPassword('');
                    setLoginError('');
                  }}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
