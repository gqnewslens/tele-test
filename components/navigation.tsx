'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Dashboard', href: '/' },
  { name: 'Tasks', href: '/tasks' },
  { name: 'Press Releases', href: '/press-releases' },
  { name: 'Calendar', href: '/calendar' },
  { name: 'Docs', href: '/admin/docs' },
];

export function Navigation() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsAdmin(true);
        setShowLoginModal(false);
        setPassword('');
        setError('');
      } else {
        setError('비밀번호가 틀렸습니다');
      }
    } catch {
      setError('로그인 실패');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
  };

  return (
    <>
      <nav className="border-b border-cyan-900/50 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/" className="text-xl font-bold text-amber-400 hover:text-amber-300 transition-colors">
                  GQAI | Workspace
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href;
                  return (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                        isActive
                          ? 'border-cyan-500 text-cyan-400'
                          : 'border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      {tab.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* Admin button */}
            <div className="flex items-center">
              {isAdmin ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-900/30 rounded-lg hover:bg-emerald-900/50 transition-colors"
                >
                  Admin ✓
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 hover:text-slate-200 transition-colors"
                >
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4 border border-slate-700">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">관리자 로그인</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-600 mb-3"
              placeholder="비밀번호"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setPassword('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
