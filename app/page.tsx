'use client';

import { useEffect, useState } from 'react';
import UpcomingEvents from '@/components/UpcomingEvents';

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
  replyToMessageId: string | null;
}

type FilterType = 'all' | 'document' | 'link' | 'image' | 'video' | 'notice';

export default function Home() {
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

  // Reply chain state
  const [replyChainModal, setReplyChainModal] = useState<Post | null>(null);
  const [replyChain, setReplyChain] = useState<Post[]>([]);
  const [loadingChain, setLoadingChain] = useState(false);

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
        // 'all' - show all posts
        filtered = posts;
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

  // Reply chain handler
  const handleShowReplyChain = async (post: Post) => {
    setReplyChainModal(post);
    setLoadingChain(true);
    try {
      const res = await fetch(`/api/posts/reply-chain?messageId=${post.messageId}`);
      if (res.ok) {
        const data = await res.json();
        setReplyChain(data.chain);
      }
    } catch (err) {
      console.error('Failed to fetch reply chain:', err);
    } finally {
      setLoadingChain(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-xl text-cyan-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-cyan-900/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-cyan-400">Telegram Dashboard</h1>

            {/* Admin button */}
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                🔓 로그아웃
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
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
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
          <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {isAdmin && (
          <div className="bg-teal-900/30 border border-teal-500/50 rounded-lg p-3 mb-6 flex items-center gap-2">
            ✅ 관리자 모드 - 삭제 기능이 활성화되었습니다
          </div>
        )}

        {/* Top Section: 6:4 layout */}
        <div className="flex gap-4 mb-6">
          {/* Left side - 60% */}
          <div className="w-3/5 bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 h-[300px]">
            {/* Reserved for future content */}
          </div>

          {/* Right side - 40% Calendar */}
          <div className="w-2/5">
            <UpcomingEvents />
          </div>
        </div>

        <div className="mb-4 text-slate-400">
          {filteredPosts.length}개 항목
        </div>

        <div className="space-y-4">
          {filteredPosts.map((post, index) => (
            <div
              key={`${post.messageId}-${index}`}
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-cyan-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getTypeIcon(post)}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-cyan-400">{post.channel}</span>
                    <span className="text-slate-500 text-sm">{formatDate(post.timestamp)}</span>
                  </div>

                  <p className="text-slate-200 whitespace-pre-wrap break-words mb-3">
                    {post.text}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {post.mediaLink && (
                      <a
                        href={post.mediaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-teal-900/50 text-teal-400 rounded-full text-sm hover:bg-teal-900 transition-colors"
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
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-900/50 text-amber-400 rounded-full text-sm hover:bg-amber-900 transition-colors"
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
                        className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-900/50 text-cyan-400 rounded-full text-sm hover:bg-cyan-900 transition-colors truncate max-w-xs"
                      >
                        🔗 {new URL(link).hostname}
                      </a>
                    ))}

                    {post.link && !post.link.startsWith('[') && !(post.mediaType?.toLowerCase() === 'document' && !post.mediaLink) && (
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm hover:bg-slate-600 transition-colors"
                      >
                        💬 원본 보기
                      </a>
                    )}

                    {/* Reply chain button - show if this post is a reply or has replies */}
                    {post.replyToMessageId && (
                      <button
                        onClick={() => handleShowReplyChain(post)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-900/50 text-purple-400 rounded-full text-sm hover:bg-purple-900 transition-colors"
                      >
                        🔗 대화 체인
                      </button>
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
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-600 text-white rounded-full text-sm hover:bg-slate-500 transition-colors disabled:opacity-50"
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
            <div className="text-center text-slate-500 py-12">
              해당하는 항목이 없습니다
            </div>
          )}
        </div>
      </main>

      {/* Reply Chain Modal */}
      {replyChainModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl mx-4 border border-purple-900/50 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-400">🔗 대화 체인</h2>
              <button
                onClick={() => {
                  setReplyChainModal(null);
                  setReplyChain([]);
                }}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {loadingChain ? (
              <div className="text-center text-slate-400 py-8">로딩 중...</div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1">
                {replyChain.map((chainPost, index) => (
                  <div
                    key={chainPost.id}
                    className={`p-3 rounded-lg border ${
                      chainPost.messageId === replyChainModal.messageId
                        ? 'bg-purple-900/30 border-purple-500/50'
                        : 'bg-slate-700/50 border-slate-600/50'
                    }`}
                  >
                    {index > 0 && (
                      <div className="text-purple-400 text-xs mb-2">↳ 리플라이</div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-cyan-400 text-sm">{chainPost.channel}</span>
                      <span className="text-slate-500 text-xs">{formatDate(chainPost.timestamp)}</span>
                    </div>
                    <p className="text-slate-200 text-sm whitespace-pre-wrap">{chainPost.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4 border border-cyan-900/50">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">관리자 로그인</h2>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-slate-400 mb-2">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
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
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
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
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
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
