'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, MessageSquare } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="border-b border-stone-200 bg-gradient-to-r from-blue-600 via-blue-600 to-violet-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-sm group-hover:bg-white transition-all">
            <MessageSquare className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-lg font-semibold text-white">
            Difficult Chat Mentor
          </h1>
        </Link>

        {!isHome && (
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-white" />
          </Link>
        )}
      </div>
    </header>
  );
}
