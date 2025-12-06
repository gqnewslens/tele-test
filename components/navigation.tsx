'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Dashboard', href: '/' },
  { name: 'Press Releases', href: '/press-releases' },
  { name: 'Calendar', href: '/calendar' },
  { name: 'Docs', href: '/admin/docs' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
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
        </div>
      </div>
    </nav>
  );
}
